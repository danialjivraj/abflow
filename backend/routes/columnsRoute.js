const express = require("express");
const router = express.Router();
const Column = require("../models/Column");
const Task = require("../models/Task");
const User = require("../models/User");

// create a new column
router.post("/create", async (req, res) => {
  try {
    const { userId, columnName } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!columnName || columnName.trim() === "") {
      return res.status(400).json({ error: "Column name cannot be empty." });
    }

    if (columnName.trim().toLowerCase() === "completed") {
      return res
        .status(400)
        .json({ error: "Column name 'Completed' is reserved." });
    }

    const existingColumn = await Column.findOne({
      userId,
      name: { $regex: `^${columnName.trim()}$`, $options: "i" },
    });
    if (existingColumn) {
      return res.status(400).json({ error: "Column name already exists." });
    }

    const lastColumn = await Column.findOne({ userId }).sort({ order: -1 });
    const newOrder = lastColumn ? lastColumn.order + 1 : 0;
    const newColumnId = `column-${Date.now()}`;
    const newColumn = new Column({
      columnId: newColumnId,
      userId,
      name: columnName,
      order: newOrder,
    });
    await newColumn.save();
    res.json({
      message: "Board created successfully",
      columnId: newColumnId,
      columnName,
    });
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
});

// rename a column
router.put("/rename", async (req, res) => {
  try {
    const { userId, columnId, newName } = req.body;
    if (!userId || !columnId) {
      return res
        .status(400)
        .json({ error: "User ID and column ID are required" });
    }
    if (!newName || newName.trim() === "") {
      return res.status(400).json({ error: "Column name cannot be empty." });
    }

    if (newName.trim().toLowerCase() === "completed") {
      return res
        .status(400)
        .json({ error: "Column name 'Completed' is reserved." });
    }

    const duplicate = await Column.findOne({
      userId,
      name: { $regex: `^${newName.trim()}$`, $options: "i" },
      columnId: { $ne: columnId },
    });
    if (duplicate) {
      return res.status(400).json({ error: "Column name already exists." });
    }

    const column = await Column.findOneAndUpdate(
      { userId, columnId },
      { name: newName },
      { new: true },
    );
    if (!column) return res.status(404).json({ error: "Column not found" });
    res.json({ message: "Board renamed successfully" });
  } catch (error) {
    console.error("Error renaming board:", error);
    res.status(500).json({ error: "Failed to rename board" });
  }
});

// delete a column and its tasks
router.delete("/delete", async (req, res) => {
  try {
    const { userId, columnId } = req.body;
    if (!userId || !columnId) {
      return res
        .status(400)
        .json({ error: "User ID and column ID are required" });
    }
    // deletes tasks associated with the column
    await Task.deleteMany({ userId, status: columnId });
    const result = await Column.deleteOne({ userId, columnId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Column not found" });
    }
    res.json({ message: "Board and associated tasks deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board" });
  }
});

// fetch column order for a user
router.get("/order/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, welcomeColumnsAndTask: false });
      await user.save();
    }

    let columns = await Column.find({ userId }).sort({ order: 1 });

    // creates initial 3 boards and 1 task for the first time user
    if (columns.length === 0 && !user.welcomeColumnsAndTask) {
      const defaultColumns = [
        { columnId: "backlog", name: "Backlog", order: 0, userId },
        { columnId: "inprogress", name: "In Progress", order: 1, userId },
        { columnId: "done", name: "Done", order: 2, userId },
      ];
      columns = await Column.insertMany(defaultColumns);

      user.welcomeColumnsAndTask = true;
      await user.save();

      const defaultTask = new Task({
        title: "Click me!",
        priority: "A1",
        userId,
        status: "backlog",
        order: 0,
        description:
          "Hello! To create me press on the blue button that says 'Create Task' in the Top Bar!",
        assignedTo: "John Doe",
        dueDate: null,
        storyPoints: 2,
        scheduledStart: null,
        scheduledEnd: null,
      });
      await defaultTask.save();
    }

    const columnOrder = columns.map((col) => col.columnId);
    const columnNames = {};
    columns.forEach((col) => {
      columnNames[col.columnId] = col.name;
    });
    res.json({ columnOrder, columnNames });
  } catch (error) {
    console.error("Error fetching column order:", error);
    res.status(500).json({ error: "Failed to fetch column order" });
  }
});

// save updated column order
router.put("/order", async (req, res) => {
  try {
    const { userId, columnOrder } = req.body;
    if (!userId || !columnOrder) {
      return res
        .status(400)
        .json({ error: "User ID and column order required" });
    }
    const updatePromises = columnOrder.map((colId, index) =>
      Column.findOneAndUpdate(
        { userId, columnId: colId },
        { order: index },
        { new: true },
      ),
    );
    await Promise.all(updatePromises);
    res.json({ message: "Column order saved successfully", columnOrder });
  } catch (error) {
    console.error("Error saving column order:", error);
    res.status(500).json({ error: "Failed to save column order" });
  }
});

module.exports = router;
