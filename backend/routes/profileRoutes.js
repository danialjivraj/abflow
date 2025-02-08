const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Define user titles based on points
const getUserTitle = (points) => {
  if (points >= 1000) return "Grandmaster 🎖️";
  if (points >= 500) return "Master 🏆";
  if (points >= 250) return "Pro 🥇";
  if (points >= 100) return "Intermediate 🥈";
  return "Beginner 🥉";
};

// ✅ Get Total Tasks & Points for User
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const tasks = await Task.find({ userId, status: "done" }); // Only completed tasks
    const totalTasks = tasks.length;
    const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);

    const userTitle = getUserTitle(totalPoints);

    res.json({ totalTasks, totalPoints, userTitle });
  } catch (error) {
    console.error("❌ Error fetching profile stats:", error);
    res.status(500).json({ error: "Failed to fetch profile stats" });
  }
});

router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Fetching profile for user:", userId);
  
      const completedTasks = await Task.find({ userId, status: "done" });
      console.log("Completed Tasks Found:", completedTasks);
  
      const totalTasks = completedTasks.length;
      const totalPoints = completedTasks.reduce((acc, task) => acc + task.points, 0);
      console.log("Total Tasks:", totalTasks, "Total Points:", totalPoints);
  
      let userTitle = "Beginner";
      if (totalPoints > 100) userTitle = "Intermediate";
      if (totalPoints > 300) userTitle = "Advanced";
      if (totalPoints > 500) userTitle = "Master";
      if (totalPoints > 1000) userTitle = "Legend";
  
      res.json({ totalTasks, totalPoints, userTitle });
    } catch (error) {
      console.error("❌ Error fetching profile data:", error);
      res.status(500).json({ error: "Failed to fetch profile data" });
    }
  });
  

module.exports = router;
