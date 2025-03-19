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

const generateWeeklyInsights = async () => {
  try {
    const now = new Date();
    // Calculate the start of the current week (assuming Monday is the first day)
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);

    const users = await User.find({});

    for (const user of users) {
      const userId = user.userId;
      // Check if a weekly notification was already sent this week.
      if (user.lastWeeklyNotification && new Date(user.lastWeeklyNotification) >= startOfWeek) {
        console.log(`Weekly insight already sent for user ${userId} this week.`);
        continue;
      }

      // Get tasks completed in the past week
      const tasksLastWeek = await Task.find({
        userId,
        completedAt: { $gte: oneWeekAgo },
      });

      const totalTime = tasksLastWeek.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
      // Filter tasks considered high priority (A or B)
      const highPriorityTasks = tasksLastWeek.filter(
        (task) => task.priority && (task.priority.startsWith("A") || task.priority.startsWith("B"))
      );
      const highTime = highPriorityTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);

      if (highPriorityTasks.length > 0 && totalTime > 0) {
        const highPercentage = (highTime / totalTime) * 100;
        let message;
        if (highPercentage < 50) {
          const newHighCount = highPriorityTasks.filter(
            (task) => task.createdAt && new Date(task.createdAt) >= twoDaysAgo
          ).length;
          if (newHighCount > 0) {
            message = `Weekly Insight: Your high priority tasks accounted for only ${Math.round(highPercentage)}% of your total time last week, with some new tasks added recently. Consider reviewing them for improved focus.`;
          } else {
            message = `Weekly Insight: You spent only ${Math.round(highPercentage)}% of your time on high priority tasks last week. Consider increasing your focus on these tasks.`;
          }
        } else {
          message = `Weekly Insight: Great job! You dedicated ${Math.round(highPercentage)}% of your time to high priority tasks last week.`;
        }
        // Use our check to avoid sending duplicate notifications within the threshold window
        if (await shouldCreateNotification(userId, message)) {
          await Notification.create({ userId, message, createdAt: now });
          // Update the user record to indicate that this week's notification has been sent.
          await User.findOneAndUpdate({ userId }, { lastWeeklyNotification: now });
          console.log(`Weekly insight generated for user ${userId}: ${message}`);
        }
      }
    }
  } catch (error) {
    console.error("Error generating weekly insights:", error);
  }
};

module.exports = { generateWeeklyInsights };
