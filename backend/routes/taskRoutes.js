const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User"); // Import User model

// ✅ Create Task
router.post("/", async (req, res) => {
  try {
    const { title, priority, userId, description, assignedTo, status, dueDate } = req.body; // Add dueDate
    if (!title || !priority || !userId || !status) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Find the highest order value for tasks in the same column
    const highestOrderTask = await Task.findOne({ userId, status })
      .sort({ order: -1 }) // Sort in descending order
      .select("order") // Only fetch the order field
      .exec();

    const highestOrder = highestOrderTask ? highestOrderTask.order : -1; // Default to -1 if no tasks exist
    const newOrder = highestOrder + 1; // Set the new task's order to the next value

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
      status: status,
      points: pointsMap[priority] || 0,
      description: description || "",
      assignedTo: assignedTo || "",
      dueDate: dueDate || null, // Add dueDate
      order: newOrder // Set the calculated order
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

    // Fetch all tasks for the user, sorted by order
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

    // Check if the user exists, if not, create a new user document
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
        columnOrder: ["backlog", "inprogress", "done"],
        columnNames: new Map([["backlog", "Backlog"], ["inprogress", "In Progress"], ["done", "Done"]]),
      });
      await user.save();
    }

    // Convert the Map to a plain object for JSON serialization
    const columnNames = Object.fromEntries(user.columnNames);

    res.json({ columnOrder: user.columnOrder, columnNames });
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

router.post("/columns/create", async (req, res) => {
  try {
    const { userId, columnName } = req.body;
    if (!userId || !columnName) {
      return res.status(400).json({ error: "User ID and column name are required" });
    }

    // Check if the user exists, if not, create a new user document
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
      });
      await user.save();
    }

    // Generate a unique ID for the new column
    const newColumnId = `column-${Date.now()}`;

    // Add the new column to the columnOrder array
    user.columnOrder.push(newColumnId);

    // Add the new column's name to the columnNames map
    user.columnNames.set(newColumnId, columnName);

    // Save the updated user
    await user.save();

    res.json({ message: "Board created successfully", columnId: newColumnId, columnName });
  } catch (error) {
    console.error("❌ Error creating board:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
});

// ✅ Rename a board
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

    // Update the column name in the columnNames map
    user.columnNames.set(columnId, newName);

    // Save the updated user
    await user.save();

    res.json({ message: "Board renamed successfully" });
  } catch (error) {
    console.error("❌ Error renaming board:", error);
    res.status(500).json({ error: "Failed to rename board" });
  }
});

// ✅ Delete a board
router.delete("/columns/delete", async (req, res) => {
  try {
    const { userId, columnId } = req.body;
    if (!userId || !columnId) {
      return res.status(400).json({ error: "User ID and column ID are required" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove the column from the columnOrder array
    user.columnOrder = user.columnOrder.filter((id) => id !== columnId);

    // Remove the column from the columnNames map
    user.columnNames.delete(columnId);

    // Save the updated user
    await user.save();

    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board" });
  }
});

// Start the timer for a task
router.put("/:id/start-timer", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.isTimerRunning = true;
    task.timerStartTime = new Date();
    await task.save();

    console.log(`Timer started for task ${task._id} at ${task.timerStartTime}`); // Log timer start
    res.json(task);
  } catch (error) {
    console.error("❌ Error starting timer:", error);
    res.status(500).json({ error: "Failed to start timer" });
  }
});

// Stop the timer for a task
router.put("/:id/stop-timer", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.isTimerRunning) {
      const now = new Date();
      const timeElapsed = Math.floor((now - task.timerStartTime) / 1000); // Time elapsed in seconds
      task.timeSpent += timeElapsed;
      task.isTimerRunning = false;
      task.timerStartTime = null;
      await task.save();

      console.log(`Timer stopped for task ${task._id}. Total time spent: ${task.timeSpent} seconds`); // Log total time spent
    }

    res.json(task);
  } catch (error) {
    console.error("❌ Error stopping timer:", error);
    res.status(500).json({ error: "Failed to stop timer" });
  }
});
module.exports = router;
