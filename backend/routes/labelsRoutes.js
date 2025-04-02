const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Task = require("../models/Task");

// get all labels for a user (sorted by order)
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Sort labels based on the order field before returning them
    const sortedLabels = user.labels.sort((a, b) => a.order - b.order);
    res.json(sortedLabels);
  } catch (
    // eslint-disable-next-line no-unused-vars, unused-imports/no-unused-vars
    _
  ) {
    res.status(500).json({ error: "Failed to fetch labels" });
  }
});

// create a new label for a user with order set to the current array length
router.post("/:userId", async (req, res) => {
  try {
    const { title, color } = req.body;
    if (!title || !color) {
      return res.status(400).json({ error: "Title and color are required" });
    }
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newLabel = { title, color, order: user.labels.length };
    user.labels.push(newLabel);
    await user.save();
    res.status(201).json(user.labels[user.labels.length - 1]);
  } catch (
    // eslint-disable-next-line no-unused-vars, unused-imports/no-unused-vars
    _
  ) {
    res.status(500).json({ error: "Failed to create label" });
  }
});

// update the order of labels for a user
router.put("/:userId/reorder", async (req, res) => {
  try {
    const { labels } = req.body;
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.labels = labels;
    await user.save();
    res.json(user.labels);
  } catch (
    // eslint-disable-next-line no-unused-vars, unused-imports/no-unused-vars
    _
  ) {
    console.error("Error reordering labels:", _);
    res.status(500).json({ error: "Failed to update label order" });
  }
});

// update a label for a user (supports updating title, color, and order)
router.put("/:userId/:labelId", async (req, res) => {
  try {
    const { title, color, order } = req.body;
    const { userId, labelId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const label = user.labels.id(labelId);
    if (!label) return res.status(404).json({ error: "Label not found" });

    if (title) label.title = title;
    if (color) label.color = color;
    if (order !== undefined) label.order = order;

    await user.save();

    await Task.updateMany(
      { userId, "labels._id": labelId },
      {
        $set: {
          "labels.$[elem].title": label.title,
          "labels.$[elem].color": label.color,
        },
      },
      { arrayFilters: [{ "elem._id": labelId }] },
    );
    res.json(label);
  } catch (
    // eslint-disable-next-line no-unused-vars, unused-imports/no-unused-vars
    _
  ) {
    console.error("Error updating label:", _);
    res.status(500).json({ error: "Failed to update label" });
  }
});

// delete a label for a user and remove it from all tasks
router.delete("/:userId/:labelId", async (req, res) => {
  try {
    const { userId, labelId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.labels.pull(labelId);
    await user.save();

    await Task.updateMany({ userId }, { $pull: { labels: { _id: labelId } } });

    res.json({ message: "Label deleted" });
  } catch (
    // eslint-disable-next-line no-unused-vars, unused-imports/no-unused-vars
    _
  ) {
    console.error("Error deleting label:", _);
    res.status(500).json({ error: "Failed to delete label" });
  }
});

module.exports = router;
