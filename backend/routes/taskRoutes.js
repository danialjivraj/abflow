const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// create a new task
router.post("/", async (req, res) => {
  try {
    const { title, priority, userId, description, assignedTo, status, dueDate, storyPoints, scheduledStart, scheduledEnd } = req.body;
    if (!title || !priority || !userId || !status) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let newOrder;
    if (req.body.order !== undefined) {
      newOrder = req.body.order;
    } else {
      const highestOrderTask = await Task.findOne({ userId, status })
        .sort({ order: -1 })
        .select("order")
        .exec();
      const highestOrder = highestOrderTask ? highestOrderTask.order : -1;
      newOrder = highestOrder + 1;
    }

    const pointsMap = {
      "A1": 5.0, "A2": 4.5, "A3": 4.0,
      "B1": 3.5, "B2": 3.0, "B3": 2.5,
      "C1": 2.0, "C2": 1.5, "C3": 1.0,
      "D": 0.5,
      "E": 0.0
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
      scheduledStart: scheduledStart || null,
      scheduledEnd: scheduledEnd || null,
    });

    await newTask.save();

    await Task.updateMany(
      {
        userId,
        status,
        _id: { $ne: newTask._id },
        order: { $gte: newTask.order },
      },
      { $inc: { order: 1 } }
    );

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
      scheduledStart,
      scheduledEnd,
      taskCompleted,
      completedAt,
    } = req.body;

    const existingTask = await Task.findById(req.params.id);

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
      scheduledStart,
      scheduledEnd,
    };

    if (dueDate !== undefined) {
      const newDueDate = dueDate ? new Date(dueDate).toISOString() : null;
      const oldDueDate = existingTask.dueDate ? new Date(existingTask.dueDate).toISOString() : null;
      if (newDueDate !== oldDueDate) {
        updatedFields.notifiedUpcoming = false;
        updatedFields.notifiedOverdue = false;
      }
    }

    if (timeSpent !== undefined && timeSpent !== existingTask.timeSpent) {
      updatedFields.notifiedWarning = false;
    }

    if (typeof taskCompleted !== "undefined") {
      updatedFields.taskCompleted = taskCompleted;
    }
    if (req.body.hasOwnProperty("completedAt")) {
      updatedFields.completedAt = completedAt;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
    res.json(task);
  } catch (error) {
    console.error("Error editing task:", error);
    res.status(500).json({ error: "Failed to edit task" });
  }
});

// patch update schedule for a task (only scheduledStart and scheduledEnd)
router.patch("/:id/schedule", async (req, res) => {
  try {
    const { scheduledStart, scheduledEnd } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { scheduledStart, scheduledEnd },
      { new: true }
    );
    res.json(task);
  } catch (error) {
    console.error("Error updating task schedule:", error);
    res.status(500).json({ error: "Failed to update task schedule" });
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
    }

    res.json(task);
  } catch (error) {
    console.error("Error stopping timer:", error);
    res.status(500).json({ error: "Failed to stop timer" });
  }
});

router.put("/:id/complete", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        taskCompleted: true,
        completedAt: new Date(),
        scheduledStart: null,
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

// update notification flags for a task
router.put("/:id/reset-notification-flags", async (req, res) => {
  try {
    const { notifiedUpcoming, notifiedOverdue } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { notifiedUpcoming, notifiedOverdue },
      { new: true }
    );
    res.json(task);
  } catch (error) {
    console.error("Error resetting notification flags:", error);
    res.status(500).json({ error: "Failed to reset notification flags" });
  }
});

module.exports = router;
