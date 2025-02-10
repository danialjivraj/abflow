const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User"); // Import User model

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
      status: "backlog", // ✅ Default status when created
      points: pointsMap[priority] || 0 
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error("❌ Error saving task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});


// ✅ Move Task (Change Status & Award Points)
router.put("/:id/move", async (req, res) => {
  try {
    const { status, order } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = status; // ✅ Save new column
    task.order = order;   // ✅ Save new position
    await task.save();

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

// ✅ Fetch tasks sorted by order
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // ✅ Fetch tasks sorted by order
    const tasks = await Task.find({ userId }).sort({ order: 1 });
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});


router.put("/reorder", async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "Invalid tasks data" });
    }

    // ✅ Update each task's order in MongoDB
    const updatePromises = tasks.map((task) =>
      Task.findByIdAndUpdate(task._id, { order: task.order, status: task.status }, { new: true })
    );

    await Promise.all(updatePromises);

    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    console.error("❌ Error reordering tasks:", error);
    res.status(500).json({ error: "Failed to reorder tasks" });
  }
});


// ✅ Save Column Order (Fixes issue where it wasn't saving)
router.put("/columns/order", async (req, res) => {
  try {
    const { userId, columnOrder } = req.body;
    if (!userId || !columnOrder) {
      return res.status(400).json({ error: "User ID and column order required" });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { columnOrder },
      { upsert: true, new: true }
    );

    res.json({ message: "Column order saved successfully", columnOrder: user.columnOrder });
  } catch (error) {
    console.error("❌ Error saving column order:", error);
    res.status(500).json({ error: "Failed to save column order" });
  }
});

// ✅ Fetch Column Order (Fixes issue where it always resets)
router.put("/columns/order", async (req, res) => {
  try {
    const { userId, columnOrder } = req.body;
    if (!userId || !columnOrder) {
      return res.status(400).json({ error: "User ID and column order required" });
    }

    // ✅ Update user's column order
    const user = await User.findOneAndUpdate(
      { userId },
      { columnOrder },
      { upsert: true, new: true }
    );

    res.json({ message: "Column order saved successfully", columnOrder: user.columnOrder });
  } catch (error) {
    console.error("❌ Error saving column order:", error);
    res.status(500).json({ error: "Failed to save column order" });
  }
});

router.get("/columns/order/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.json({ columnOrder: ["backlog", "todo", "done"] }); // Default order if no data
    }

    res.json({ columnOrder: user.columnOrder });
  } catch (error) {
    console.error("❌ Error fetching column order:", error);
    res.status(500).json({ error: "Failed to fetch column order" });
  }
});


router.put("/tasks/reorder", async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "Invalid tasks data" });
    }

    // ✅ Remove duplicates (Ensures each task is updated only once)
    const uniqueTasks = tasks.reduce((acc, task) => {
      if (!acc.some(t => t._id === task._id)) {
        acc.push(task);
      }
      return acc;
    }, []);

    // ✅ Update only the moved tasks
    const updatePromises = uniqueTasks.map((task) =>
      Task.findByIdAndUpdate(task._id, { order: task.order, status: task.status }, { new: true })
    );

    await Promise.all(updatePromises);
    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    console.error("❌ Error reordering tasks:", error);
    res.status(500).json({ error: "Failed to reorder tasks" });
  }
});


module.exports = router;
