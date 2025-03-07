const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const moment = require("moment");

// weekly completed tasks
router.get("/weekly", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const tasks = await Task.find({ status: "done", userId });

    const weeklyStats = {};
    const currentWeek = moment().isoWeek();
    const weeksToShow = Array.from({ length: 6 }, (_, i) => currentWeek - 4 + i);

    weeksToShow.forEach(week => {
      weeklyStats[week] = 0;
    });

    tasks.forEach(task => {
      const taskWeek = moment(task.createdAt).isoWeek();
      if (weeklyStats.hasOwnProperty(taskWeek)) {
        weeklyStats[taskWeek]++;
      }
    });

    const formattedWeeks = weeksToShow.map(week => ({
      week,
      tasksCompleted: weeklyStats[week] || 0
    }));

    res.json(formattedWeeks);
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    res.status(500).json({ error: "Failed to fetch weekly stats" });
  }
});

router.get("/time-tracking", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const completedTasks = await Task.find({ status: "done", userId });

    if (!completedTasks || completedTasks.length === 0) {
      return res.status(200).json([]);
    }

    const timeTrackingData = {};

    completedTasks.forEach(task => {
      const timeDiff = moment().diff(moment(task.createdAt), "hours");
      const priority = task.priority;

      if (!timeTrackingData[priority]) {
        timeTrackingData[priority] = 0;
      }

      timeTrackingData[priority] += timeDiff;
    });

    const formattedData = Object.keys(timeTrackingData).map(priority => {
      const totalHours = timeTrackingData[priority];
      let formattedTime = "";

      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;

      if (days > 0) {
        formattedTime += `${days} day${days > 1 ? "s" : ""}`;
        if (hours > 0) formattedTime += ` and ${hours} hour${hours > 1 ? "s" : ""}`;
      } else {
        formattedTime = `${hours} hour${hours !== 1 ? "s" : ""}`;
      }

      return { priority, timeSpent: totalHours, displayText: formattedTime };
    });

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
  
  module.exports = router;