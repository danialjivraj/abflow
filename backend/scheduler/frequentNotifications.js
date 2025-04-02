const Task = require("../models/Task");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Checks if a notification with the same message exists for the user,
 * created within the past thresholdMs (default 1 ms for testing; increase for production).
 */
const shouldCreateNotification = async (userId, message, thresholdMs = 1) => {
  const threshold = new Date(Date.now() - thresholdMs);
  const exists = await Notification.findOne({
    userId,
    message,
    createdAt: { $gte: threshold },
  });
  return !exists;
};

/**
 * Helper to consistently format times as 12-hour with AM/PM,
 * ensuring we never mix 24-hour vs. 12-hour strings.
 */
const formatTime12Hour = (date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Generates scheduled notifications for tasks whose scheduled start is within N minutes.
 * Updates the task's lastNotifiedScheduledStart field.
 */
const generateScheduledNotifications = async (userId, now) => {
  const tasks = await Task.find({ userId, status: { $ne: "completed" } });
  let notifications = [];

  const user = await User.findOne({ userId });
  const notifyMinutes =
    user?.settingsPreferences?.notifyScheduledTaskIsDue || 5;
  const thresholdMs = notifyMinutes * 60 * 1000;

  for (const task of tasks) {
    if (task.scheduledStart) {
      const scheduledStart = new Date(task.scheduledStart);
      const diffScheduled = scheduledStart - now;

      if (diffScheduled < 60_000) {
        continue;
      }

      if (diffScheduled > 0 && diffScheduled <= thresholdMs) {
        const remainingMinutes = Math.ceil(diffScheduled / 60000);

        if (remainingMinutes > 0) {
          if (
            !task.lastNotifiedScheduledStart ||
            new Date(task.lastNotifiedScheduledStart).toISOString() !==
              scheduledStart.toISOString()
          ) {
            const scheduledTime = formatTime12Hour(scheduledStart);
            const plural = remainingMinutes !== 1 ? "s" : "";
            const message = `Reminder: Your scheduled task "${task.title}" will start at ${scheduledTime} (in less than ${remainingMinutes} minute${plural}).`;
            notifications.push({
              userId,
              message,
              createdAt: now,
              taskId: task._id,
            });

            await Task.findByIdAndUpdate(task._id, {
              lastNotifiedScheduledStart: scheduledStart,
            });
          }
        }
      }
    }
  }
  return notifications;
};

/**
 * Generates upcoming notifications for tasks whose due date is within 24 hours.
 * Updates the task's lastNotifiedUpcoming field.
 */
const generateUpcomingNotifications = async (userId, now) => {
  const tasks = await Task.find({ userId, status: { $ne: "completed" } });
  let notifications = [];

  for (const task of tasks) {
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const diff = due - now;

      if (diff > 0 && diff <= 24 * 60 * 60 * 1000 && !task.notifiedUpcoming) {
        const dueTime = formatTime12Hour(due);
        const message = `Reminder: Your task "${task.title}" is due at ${dueTime} (within 24 hours).`;

        if (await shouldCreateNotification(userId, message, 5 * 60 * 1000)) {
          // 5 minute threshold
          notifications.push({
            userId,
            message,
            createdAt: now,
            taskId: task._id,
          });
          await Task.findByIdAndUpdate(task._id, {
            lastNotifiedUpcoming: now,
            notifiedUpcoming: true,
          });
        }
      }
    }
  }

  return notifications;
};

/**
 * Generates overdue notifications for tasks whose due date is past.
 * Updates the task's lastNotifiedOverdue field.
 */
const generateOverdueNotifications = async (userId, now) => {
  const tasks = await Task.find({ userId, status: { $ne: "completed" } });
  let notifications = [];

  for (const task of tasks) {
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const diff = due - now;

      if (diff < 0 && !task.notifiedOverdue) {
        const message = `Alert: Your task "${task.title}" is overdue. Please review it.`;

        if (await shouldCreateNotification(userId, message, 5 * 60 * 1000)) {
          // 5 minute threshold
          notifications.push({
            userId,
            message,
            createdAt: now,
            taskId: task._id,
          });
          await Task.findByIdAndUpdate(task._id, {
            lastNotifiedOverdue: now,
            notifiedOverdue: true,
          });
        }
      }
    }
  }

  return notifications;
};

/**
 * Generates warning notifications for tasks that are not high priority
 * (i.e., tasks whose priority does not start with "A" or "B"),
 * when the timer is running and the total time spent exceeds a threshold (e.g. 1 hour),
 * and when there exist at least some high-priority tasks.
 */
const generateWarningNotifications = async (userId, now) => {
  const tasks = await Task.find({ userId, status: { $ne: "completed" } });
  let notifications = [];

  const user = await User.findOne({ userId });
  const thresholdHours =
    user?.settingsPreferences?.notifyNonPriorityGoesOvertime || 1;
  const thresholdMs = thresholdHours * 60 * 60 * 1000;

  const highPriorityTasks = tasks.filter(
    (task) =>
      task.priority &&
      (task.priority.startsWith("A") || task.priority.startsWith("B")),
  );
  if (!highPriorityTasks.length) return notifications;

  const nonHighPriorityTasks = tasks.filter(
    (task) =>
      !(
        task.priority &&
        (task.priority.startsWith("A") || task.priority.startsWith("B"))
      ),
  );

  const highPriorityLetters = [
    ...new Set(highPriorityTasks.map((t) => t.priority[0])),
  ].sort();
  const priorityMessage =
    highPriorityLetters.length === 1
      ? highPriorityLetters[0]
      : highPriorityLetters.join(" and ");

  for (const task of nonHighPriorityTasks) {
    // Check if timer is running
    if (task.isTimerRunning && task.timerStartTime) {
      const elapsedTimeMs =
        (task.timeSpent || 0) * 1000 + (now - new Date(task.timerStartTime));

      // If it exceeds threshold and we haven't warned yet
      if (elapsedTimeMs >= thresholdMs && !task.notifiedWarning) {
        const hoursWord = thresholdHours > 1 ? "hours" : "hour";
        const message = `Warning: You have spent over ${thresholdHours} ${hoursWord} on the task "${task.title}" which is non high priority. Consider switching to high priority work (there are ${priorityMessage} tasks to do).`;
        notifications.push({
          userId,
          message,
          createdAt: now,
          taskId: task._id,
        });

        // Mark this task as warned
        await Task.findByIdAndUpdate(task._id, {
          notifiedWarning: true,
        });
      }
    }
  }

  return notifications;
};

/**
 * Master function to generate all frequent notifications independently.
 */
const generateFrequentNotifications = async () => {
  try {
    const users = await User.find({});
    const now = new Date();

    for (const user of users) {
      const userId = user.userId;

      const scheduledNotifs = await generateScheduledNotifications(userId, now);
      const upcomingNotifs = await generateUpcomingNotifications(userId, now);
      const overdueNotifs = await generateOverdueNotifications(userId, now);
      const warningNotifs = await generateWarningNotifications(userId, now);

      const notificationsToCreate = [
        ...scheduledNotifs,
        ...upcomingNotifs,
        ...overdueNotifs,
        ...warningNotifs,
      ];

      if (notificationsToCreate.length) {
        await Notification.insertMany(notificationsToCreate);
      }
    }
  } catch (error) {
    console.error("Error generating frequent notifications:", error);
  }
};

module.exports = {
  formatTime12Hour,
  shouldCreateNotification,
  generateScheduledNotifications,
  generateUpcomingNotifications,
  generateOverdueNotifications,
  generateWarningNotifications,
  generateFrequentNotifications,
};
