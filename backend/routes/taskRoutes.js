const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");

// create a new task
router.post("/", async (req, res) => {
  try {
    const { title, priority, userId, description, assignedTo, status, dueDate, storyPoints, scheduledAt, scheduledEnd } = req.body;
    if (!title || !priority || !userId || !status) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const highestOrderTask = await Task.findOne({ userId, status })
      .sort({ order: -1 })
      .select("order")
      .exec();

    const highestOrder = highestOrderTask ? highestOrderTask.order : -1;
    const newOrder = highestOrder + 1;

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
      status,
      points: pointsMap[priority] || 0,
      description: description || "",
      assignedTo: assignedTo || "",
      dueDate: dueDate || null,
      order: newOrder,
      storyPoints: storyPoints !== undefined ? storyPoints : 0,
      scheduledAt: scheduledAt || null,
      scheduledEnd: scheduledEnd || null,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error saving task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// fetch tasks sorted by order for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const tasks = await Task.find({ userId }).sort({ order: 1 });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// edit a task
router.put("/:id/edit", async (req, res) => {
  try {
    const {
      title,
      priority,
      status,
      dueDate,
      assignedTo,
      storyPoints,
      timeSpent,
      description,
      order,
      timerStartTime,
      scheduledAt,
      scheduledEnd,
    } = req.body;

    const updatedFields = {
      title,
      priority,
      status,
      dueDate,
      assignedTo,
      storyPoints,
      timeSpent,
      description,
      order,
      timerStartTime,
      scheduledAt,
      scheduledEnd,
    };

    const task = await Task.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
    res.json(task);
  } catch (error) {
    console.error("Error editing task:", error);
    res.status(500).json({ error: "Failed to edit task" });
  }
});

// move a task to a new status and order
router.put("/:id/move", async (req, res) => {
  try {
    const { status, order } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = status;
    task.order = order;
    await task.save();

    res.json(task);
  } catch (error) {
    console.error("Error moving task:", error);
    res.status(500).json({ error: "Failed to move task" });
  }
});

// reorder multiple tasks
router.put("/reorder", async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "Invalid tasks data" });
    }

    const updatePromises = tasks.map((task) =>
      Task.findByIdAndUpdate(task._id, { order: task.order, status: task.status }, { new: true })
    );

    await Promise.all(updatePromises);

    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    res.status(500).json({ error: "Failed to reorder tasks" });
  }
});

// archive a completed task
router.put("/:id/archive", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
    res.json(task);
  } catch (error) {
    console.error("Error archiving task:", error);
    res.status(500).json({ error: "Failed to archive task" });
  }
});

// delete a task
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// start the timer for a task
router.put("/:id/start-timer", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.isTimerRunning = true;
    task.timerStartTime = new Date();
    await task.save();

    console.log(`Timer started for task ${task._id} at ${task.timerStartTime}`);
    res.json(task);
  } catch (error) {
    console.error("Error starting timer:", error);
    res.status(500).json({ error: "Failed to start timer" });
  }
});

// stop the timer for a task
router.put("/:id/stop-timer", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.isTimerRunning) {
      const now = new Date();
      const timeElapsed = Math.floor((now - task.timerStartTime) / 1000);
      task.timeSpent += timeElapsed;
      task.isTimerRunning = false;
      task.timerStartTime = null;
      await task.save();

      console.log(`Timer stopped for task ${task._id}. Total time spent: ${task.timeSpent} seconds`);
    }

    res.json(task);
  } catch (error) {
    console.error("Error stopping timer:", error);
    res.status(500).json({ error: "Failed to stop timer" });
  }
});

// save column order for a user
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
    console.error("Error saving column order:", error);
    res.status(500).json({ error: "Failed to save column order" });
  }
});

// fetch column order for a user
router.get("/columns/order/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
        columnOrder: ["backlog", "inprogress", "done"],
        columnNames: new Map([["backlog", "Backlog"], ["inprogress", "In Progress"], ["done", "Done"]]),
      });
      await user.save();
    }

    const columnNames = Object.fromEntries(user.columnNames);

    res.json({ columnOrder: user.columnOrder, columnNames });
  } catch (error) {
    console.error("Error fetching column order:", error);
    res.status(500).json({ error: "Failed to fetch column order" });
  }
});

// create a new column
router.post("/columns/create", async (req, res) => {
  try {
    const { userId, columnName } = req.body;
    if (!userId || !columnName) {
      return res.status(400).json({ error: "User ID and column name are required" });
    }

    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
      });
      await user.save();
    }

    const newColumnId = `column-${Date.now()}`;

    user.columnOrder.push(newColumnId);

    user.columnNames.set(newColumnId, columnName);

    await user.save();

    res.json({ message: "Board created successfully", columnId: newColumnId, columnName });
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
});

// rename a column
router.put("/columns/rename", async (req, res) => {
  try {
    const { userId, columnId, newName } = req.body;
    if (!userId || !columnId || !newName) {
      return res.status(400).json({ error: "User ID, column ID, and new name are required" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.columnNames.set(columnId, newName);

    await user.save();

    res.json({ message: "Board renamed successfully" });
  } catch (error) {
    console.error("Error renaming board:", error);
    res.status(500).json({ error: "Failed to rename board" });
  }
});

// delete a column and its tasks
router.delete("/columns/delete", async (req, res) => {
  try {
    const { userId, columnId } = req.body;
    if (!userId || !columnId) {
      return res.status(400).json({ error: "User ID and column ID are required" });
    }

    await Task.deleteMany({ userId, status: columnId });

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.columnOrder = user.columnOrder.filter((id) => id !== columnId);
    user.columnNames.delete(columnId);

    await user.save();

    res.json({ message: "Board and associated tasks deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board" });
  }
});

// Mark a task as completed
router.put("/:id/complete", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        status: "completed", 
        taskCompleted: true,
        completedAt: new Date(),
        scheduledAt: null,
        scheduledEnd: null
      },
      { new: true }
    );
    res.json(task);
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

module.exports = router;