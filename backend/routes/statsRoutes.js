// statRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Get time spent per priority
router.get("/time-spent-per-priority/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await Task.find({ userId });
    // Process and return data
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

module.exports = router;