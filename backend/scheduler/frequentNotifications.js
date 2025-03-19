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
    createdAt: { $gte: threshold } 
  });
  return !exists;
};

const generateFrequentNotifications = async () => {
  try {
    const users = await User.find({});
    const now = new Date();

    for (const user of users) {
      const userId = user.userId;

      // Fetch active tasks for this user (not completed)
      const activeTasks = await Task.find({
        userId,
        status: { $ne: "completed" },
      });

      let notificationsToCreate = [];

      // 1. Upcoming Deadlines: Notify if due within 24 hours and not already notified.
      for (const task of activeTasks) {
        if (task.dueDate) {
          const due = new Date(task.dueDate);
          const diff = due - now;
          if (diff > 0 && diff <= 24 * 60 * 60 * 1000 && !task.notifiedUpcoming) {
            const dueTime = due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const message = `Reminder: Your task "${task.title}" is due at ${dueTime} (within 24 hours).`;
            if (await shouldCreateNotification(userId, message)) {
              notificationsToCreate.push({ userId, message, createdAt: now, taskId: task._id });
              // Mark this task as notified for an upcoming deadline.
              await Task.findByIdAndUpdate(task._id, { notifiedUpcoming: true, lastNotifiedAt: now });
            }
          }
        }
      }

      // 2. Overdue Tasks: Notify if past due and not yet notified.
      for (const task of activeTasks) {
        if (task.dueDate) {
          const due = new Date(task.dueDate);
          const diff = due - now;
          if (diff < 0 && !task.notifiedOverdue) {
            const message = `Alert: Your task "${task.title}" is overdue. Please review it.`;
            if (await shouldCreateNotification(userId, message)) {
              notificationsToCreate.push({ userId, message, createdAt: now });
              // Mark this task as notified for being overdue.
              await Task.findByIdAndUpdate(task._id, { notifiedOverdue: true, lastNotifiedAt: now });
            }
          }
        }
      }

      if (notificationsToCreate.length) {
        await Notification.insertMany(notificationsToCreate);
        console.log(`Frequent notifications generated for user ${userId}:`, notificationsToCreate);
      }
    }
  } catch (error) {
    console.error("Error generating frequent notifications:", error);
  }
};

module.exports = { generateFrequentNotifications };
