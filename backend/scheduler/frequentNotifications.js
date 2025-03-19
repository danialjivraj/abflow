const Task = require("../models/Task");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Checks if a notification with the same message exists for the user,
 * created within the past thresholdMs (default 10 minutes).
 */
const shouldCreateNotification = async (userId, message, thresholdMs = 10 * 60 * 1000) => {
  const threshold = new Date(Date.now() - thresholdMs);
  const exists = await Notification.findOne({
    userId,
    message,
    createdAt: { $gte: threshold },
  });
  return !exists;
};

const generateFrequentNotifications = async () => {
  try {
    const users = await User.find({});
    const now = new Date();

    // Just to verify we are running the code:
    console.log(`[${now.toISOString()}] generateFrequentNotifications is running...`);

    for (const user of users) {
      const userId = user.userId;
      // Fetch active tasks for this user (not completed).
      // If you have other "finished" statuses (like "archived", "done", etc.),
      // add them here to exclude them as well.
      const activeTasks = await Task.find({
        userId,
        status: { $ne: "completed" },
      });

      console.log(
        `User ${userId} has ${activeTasks.length} tasks considered active (status != "completed").`
      );

      let notificationsToCreate = [];

      for (const task of activeTasks) {
        // Make sure we have a dueDate
        if (!task.dueDate) {
          // No due date, skip.
          continue;
        }

        const due = new Date(task.dueDate);
        const diff = due - now;

        console.log(
          `Checking task "${task.title}" (id: ${task._id}) for user ${userId}.`
          + ` dueDate=${due.toISOString()} | now=${now.toISOString()} | diff=${diff}ms`
          + ` | notifiedUpcoming=${task.notifiedUpcoming} | notifiedOverdue=${task.notifiedOverdue}`
        );

        // 1. Upcoming Deadlines: Notify if due within 24 hours (0 < diff <= 24h) and not already notified.
        if (diff > 0 && diff <= 24 * 60 * 60 * 1000 && !task.notifiedUpcoming) {
          const dueTime = due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const message = `Reminder: Your task "${task.title}" is due at ${dueTime} (within 24 hours).`;

          // Check if we've sent the exact same notification in the last 10 minutes.
          if (await shouldCreateNotification(userId, message)) {
            notificationsToCreate.push({
              userId,
              message,
              createdAt: now,
              taskId: task._id,
            });

            // Mark this task as notified for an upcoming deadline.
            await Task.findByIdAndUpdate(task._id, {
              notifiedUpcoming: true,
              lastNotifiedAt: now,
            });

            console.log(
              `--> Upcoming notification created for task "${task.title}" (user ${userId}).`
            );
          } else {
            console.log(
              `--> Upcoming notification already sent recently for task "${task.title}" (user ${userId}).`
            );
          }
        }

        // 2. Overdue Tasks: Notify if past due (diff < 0) and not yet notified.
        if (diff < 0 && !task.notifiedOverdue) {
          const message = `Alert: Your task "${task.title}" is overdue. Please review it.`;

          if (await shouldCreateNotification(userId, message)) {
            notificationsToCreate.push({
              userId,
              message,
              createdAt: now,
              taskId: task._id,
            });

            // Mark this task as notified for being overdue.
            await Task.findByIdAndUpdate(task._id, {
              notifiedOverdue: true,
              lastNotifiedAt: now,
            });

            console.log(`--> Overdue notification created for task "${task.title}" (user ${userId}).`);
          } else {
            console.log(
              `--> Overdue notification already sent recently for task "${task.title}" (user ${userId}).`
            );
          }
        }
      }

      if (notificationsToCreate.length) {
        await Notification.insertMany(notificationsToCreate);
        console.log(`Frequent notifications generated for user ${userId}:`, notificationsToCreate);
      } else {
        console.log(`No new frequent notifications created for user ${userId}.`);
      }
    }
  } catch (error) {
    console.error("Error generating frequent notifications:", error);
  }
};

module.exports = { generateFrequentNotifications };
