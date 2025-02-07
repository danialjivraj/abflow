const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// ✅ Create Task
router.post("/", async (req, res) => {
  try {
    const { title, priority, userId } = req.body;

    // 🔹 Validate inputs
    if (!title || !priority || !userId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 🔹 Create Task
    const newTask = new Task({ title, priority, userId });
    await newTask.save();

    console.log("✅ Task created:", newTask);
    res.status(201).json(newTask);
  } catch (error) {
    console.error("❌ Error saving task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ✅ Fetch Tasks for a User
router.get("/:userId", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.params.userId });
    console.log("✅ Fetched tasks:", tasks);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ✅ Delete Task
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router; // ✅ Only one `module.exports`
