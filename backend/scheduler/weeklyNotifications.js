const Task = require("../models/Task");
const Notification = require("../models/Notification");
const User = require("../models/User");

const shouldCreateNotification = async (userId, message, thresholdMs = 100) => {
  const threshold = new Date(Date.now() - thresholdMs);
  const exists = await Notification.findOne({
    userId,
    message,
    createdAt: { $gte: threshold },
  });
  return !exists;
};

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

const generateWeeklyInsights = async () => {
  try {
    const now = new Date();

    const startOfThisWeek = new Date(now);
    const day = startOfThisWeek.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    startOfThisWeek.setDate(startOfThisWeek.getDate() - diffToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const users = await User.find({});

    for (const user of users) {
      const userId = user.userId;

      if (
        user.lastWeeklyNotification &&
        new Date(user.lastWeeklyNotification) >= startOfThisWeek
      ) {
        console.log(
          `Weekly insight already sent for user ${userId} this week.`,
        );
        continue;
      }

      const tasksLastWeek = await Task.find({
        userId,
        completedAt: { $gte: startOfLastWeek, $lt: startOfThisWeek },
      });

      let notificationsToCreate = [];

      const insightNotifs = await generateWeeklyInsightNotification(
        userId,
        now,
        tasksLastWeek,
        twoDaysAgo,
      );
      notificationsToCreate = notificationsToCreate.concat(insightNotifs);

      const taskCountNotifs = await generateWeeklyTaskCountNotification(
        userId,
        now,
        tasksLastWeek,
      );
      notificationsToCreate = notificationsToCreate.concat(taskCountNotifs);

      if (notificationsToCreate.length) {
        await Notification.insertMany(notificationsToCreate);

        await User.findOneAndUpdate(
          { userId },
          { lastWeeklyNotification: startOfThisWeek },
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
