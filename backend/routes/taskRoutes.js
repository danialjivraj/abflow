const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// ✅ Create Task
router.post("/", async (req, res) => {
  try {
    const { title, priority, userId } = req.body;
    if (!title || !priority || !userId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const pointsMap = {
      "A1": 10, "A2": 8, "A3": 6,
      "B1": 5, "B2": 4, "B3": 3,
      "C1": 2, "C2": 1, "C3": 0,
      "D": 0, "E": 0
    };

    const newTask = new Task({ 
      title, 
      priority, 
      userId, 
      points: pointsMap[priority] || 0 
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error("❌ Error saving task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ✅ Move Task (Change Status)
router.put("/:id/move", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["backlog", "todo", "done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(task);
  } catch (error) {
    console.error("❌ Error moving task:", error);
    res.status(500).json({ error: "Failed to move task" });
  }
});

// ✅ Edit Task
router.put("/:id/edit", async (req, res) => {
  try {
    const { title, priority } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { title, priority }, { new: true });
    res.json(task);
  } catch (error) {
    console.error("❌ Error editing task:", error);
    res.status(500).json({ error: "Failed to edit task" });
  }
});

// ✅ Archive Completed Task (Move to Profile)
router.put("/:id/archive", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
    res.json(task);
  } catch (error) {
    console.error("❌ Error archiving task:", error);
    res.status(500).json({ error: "Failed to archive task" });
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

// ✅ Get All Tasks by User
router.get("/:userId", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.params.userId });
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

module.exports = router;
