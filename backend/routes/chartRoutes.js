const express = require("express");
const router = express.Router();

const User = require("../models/User");

// POST endpoint to save/update chart preferences
router.post("/chart-preferences", async (req, res) => {
  try {
    const { userId, ...preferences } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const updatedPrefs = await User.findOneAndUpdate(
      { userId },
      { preferences },
      { upsert: true, new: true }
    );

    res.json(updatedPrefs);
  } catch (error) {
    console.error("Error saving chart preferences:", error);
    res.status(500).json({ error: "Failed to save chart preferences" });
  }
});

// GET endpoint to retrieve chart preferences for a user
router.get("/chart-preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = await User.findOne({ userId });
    res.json(prefs ? prefs.preferences : {});
  } catch (error) {
    console.error("Error fetching chart preferences:", error);
    res.status(500).json({ error: "Failed to fetch chart preferences" });
  }
});

module.exports = router;
