const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const moment = require("moment");

// ✅ Weekly Completed Tasks - Shows Past 4 Weeks + Current + Next Week
router.get("/weekly", async (req, res) => {
  try {
    const tasks = await Task.find({ status: "done" });

    const weeklyStats = {};
    const currentWeek = moment().isoWeek(); // Get current ISO week

    // Generate keys for past 4 weeks, current, and next week
    const weeksToShow = Array.from({ length: 6 }, (_, i) => currentWeek - 4 + i); // ✅ Only 1 future week

    // Initialize all weeks with 0 tasks completed
    weeksToShow.forEach(week => {
      weeklyStats[week] = 0;
    });

    // Process tasks by their ISO week number
    tasks.forEach(task => {
      const taskWeek = moment(task.createdAt).isoWeek();
      if (weeklyStats.hasOwnProperty(taskWeek)) {
        weeklyStats[taskWeek]++;
      }
    });

    // Convert data into an array for the frontend
    const formattedWeeks = weeksToShow.map(week => ({
      week,
      tasksCompleted: weeklyStats[week] || 0 // Default to 0 if no data
    }));

    res.json(formattedWeeks);
  } catch (error) {
    console.error("❌ Error fetching weekly stats:", error);
    res.status(500).json({ error: "Failed to fetch weekly stats" });
  }
});

// ✅ Time Tracking Endpoint - Now Groups & Sums Time by Priority
router.get("/time-tracking", async (req, res) => {
    try {
      const completedTasks = await Task.find({ status: "done" });
  
      if (!completedTasks || completedTasks.length === 0) {
        return res.status(200).json([]); // ✅ Return empty array if no completed tasks
      }
  
      const timeTrackingData = {};
  
      completedTasks.forEach(task => {
        const timeDiff = moment().diff(moment(task.createdAt), "hours"); // Calculate total hours
        const priority = task.priority;
  
        if (!timeTrackingData[priority]) {
          timeTrackingData[priority] = 0;
        }
  
        timeTrackingData[priority] += timeDiff; // Sum up time for the same priority
      });
  
      // Convert to frontend-readable format
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
      console.error("❌ Error fetching time tracking:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  module.exports = router;