const Task = require("../models/Task");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Helper: Checks if a notification with the same message exists for the user,
 * created within the past thresholdMs (default 100 ms; adjust for production).
 */
const shouldCreateNotification = async (userId, message, thresholdMs = 100) => {
  const threshold = new Date(Date.now() - thresholdMs);
  const exists = await Notification.findOne({
    userId,
    message,
    createdAt: { $gte: threshold },
  });
  return !exists;
};

/**
 * Generates a weekly insight notification based on high priority tasks.
 * Returns an array with one notification (or empty if none qualifies).
 */
const generateWeeklyInsightNotification = async (
  userId,
  now,
  tasksLastWeek,
  twoDaysAgo,
) => {
  let notifications = [];
  const totalTime = tasksLastWeek.reduce(
    (sum, task) => sum + (task.timeSpent || 0),
    0,
  );
  const highPriorityTasks = tasksLastWeek.filter(
    (task) =>
      task.priority &&
      (task.priority.startsWith("A") || task.priority.startsWith("B")),
  );
  const highTime = highPriorityTasks.reduce(
    (sum, task) => sum + (task.timeSpent || 0),
    0,
  );

  // Only generate if there's total time and some high-priority tasks
  if (highPriorityTasks.length > 0 && totalTime > 0) {
    const highPercentage = (highTime / totalTime) * 100;
    let message;
    if (highPercentage < 50) {
      const newHighCount = highPriorityTasks.filter(
        (task) => task.createdAt && new Date(task.createdAt) >= twoDaysAgo,
      ).length;
      if (newHighCount > 0) {
        message = `Weekly Insight: Your high priority tasks accounted for only ${Math.round(highPercentage)}% of your total time last week, with some new tasks added recently. Consider reviewing them for improved focus.`;
      } else {
        message = `Weekly Insight: You spent only ${Math.round(highPercentage)}% of your time on high priority tasks last week. Consider increasing your focus on these tasks.`;
      }
    } else {
      message = `Weekly Insight: Great job! You dedicated ${Math.round(highPercentage)}% of your time to high priority tasks last week.`;
    }
    if (await shouldCreateNotification(userId, message)) {
      notifications.push({
        userId,
        message,
        createdAt: now,
      });
    }
  }
  return notifications;
};

/**
 * Generates a weekly task count notification if the user completed any tasks last week.
 * Returns an array with one notification (or empty if no tasks were completed).
 */
const generateWeeklyTaskCountNotification = async (
  userId,
  now,
  tasksLastWeek,
) => {
  let notifications = [];
  if (tasksLastWeek.length > 0) {
    const taskCount = tasksLastWeek.length;
    const taskMsg = `Weekly Insight: You completed ${taskCount} task${taskCount === 1 ? "" : "s"} last week.`;
    if (await shouldCreateNotification(userId, taskMsg)) {
      notifications.push({
        userId,
        message: taskMsg,
        createdAt: now,
      });
    }
  }
  return notifications;
};

/**
 * Master function to generate all weekly notifications for every user.
 * "Last week" is defined here as Monday 00:00 of last week to Monday 00:00 of this week.
 */
const generateWeeklyInsights = async () => {
  try {
    const now = new Date();

    // 1) Calculate Monday 00:00 of the current week
    // (Assumes Monday is the first day, day=1, Sunday=0)
    const startOfThisWeek = new Date(now);
    const day = startOfThisWeek.getDay(); // 0=Sun, 1=Mon, etc.
    const diffToMonday = day === 0 ? 6 : day - 1; // how many days back from today to Monday
    startOfThisWeek.setDate(startOfThisWeek.getDate() - diffToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0); // set to Monday 00:00 of this week

    // 2) Calculate Monday 00:00 of last week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7); // Monday 00:00 of last week

    // For the "new tasks" check in generateWeeklyInsightNotification:
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Fetch all users
    const users = await User.find({});

    for (const user of users) {
      const userId = user.userId;

      // If a weekly notification was already sent this week, skip
      if (
        user.lastWeeklyNotification &&
        new Date(user.lastWeeklyNotification) >= startOfThisWeek
      ) {
        console.log(
          `Weekly insight already sent for user ${userId} this week.`,
        );
        continue;
      }

      // 3) Query tasks completed in [last Monday 00:00, this Monday 00:00)
      const tasksLastWeek = await Task.find({
        userId,
        completedAt: { $gte: startOfLastWeek, $lt: startOfThisWeek },
      });

      let notificationsToCreate = [];

      // 1. High Priority Time-based Insight
      const insightNotifs = await generateWeeklyInsightNotification(
        userId,
        now,
        tasksLastWeek,
        twoDaysAgo,
      );
      notificationsToCreate = notificationsToCreate.concat(insightNotifs);

      // 2. Task Count Notification
      const taskCountNotifs = await generateWeeklyTaskCountNotification(
        userId,
        now,
        tasksLastWeek,
      );
      notificationsToCreate = notificationsToCreate.concat(taskCountNotifs);

      // If we have new notifications, insert them and update lastWeeklyNotification
      if (notificationsToCreate.length) {
        await Notification.insertMany(notificationsToCreate);

        // Only update if an insight was sent; or you could do it if *any* notification was sent:
        // if (insightNotifs.length) { ...
        // but presumably any weekly notification means we've done "this week's" notifications
        await User.findOneAndUpdate(
          { userId },
          { lastWeeklyNotification: startOfThisWeek }, // or 'now', your call
        );

        console.log(
          `Weekly notifications generated for user ${userId}:`,
          notificationsToCreate,
        );
      } else {
        console.log(
          `No new weekly notifications generated for user ${userId}.`,
        );
      }
    }
  } catch (error) {
    console.error("Error generating weekly insights:", error);
  }
};

module.exports = { generateWeeklyInsights };
