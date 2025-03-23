const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const completedTasks = await Task.find({ userId, status: "completed" });

    const totalPoints = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);

    const tasksCompleted = completedTasks.length;

    res.json({ points: totalPoints, tasksCompleted });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

module.exports = router;
