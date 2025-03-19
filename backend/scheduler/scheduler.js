const cron = require("node-cron");
const { generateFrequentNotifications } = require("./frequentNotifications");
const { generateWeeklyInsights } = require("./weeklyNotifications");

// every 5 seconds.
cron.schedule("*/5 * * * * *", () => {
  generateFrequentNotifications();
});

// every Monday at 9:00.
cron.schedule("0 9 * * 1", () => {
  generateWeeklyInsights();
});

console.log("Scheduler is running...");
