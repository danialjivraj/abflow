const express = require("express");
const router = express.Router();
const User = require("../models/User");

// save/update chart preferences
router.post("/chart-preferences", async (req, res) => {
  try {
    const { userId, ...preferences } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const updatedPrefs = await User.findOneAndUpdate(
      { userId },
      { chartPreferences: preferences },
      { upsert: true, new: true, runValidators: true },
    );
    res.json(updatedPrefs);
  } catch (error) {
    console.error("Error saving chart preferences:", error);
    res.status(500).json({ error: "Failed to save chart preferences" });
  }
});

// retrieve chart preferences for a user
router.get("/chart-preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = await User.findOne({ userId });
    res.json(prefs ? prefs.chartPreferences : {});
  } catch (error) {
    console.error("Error fetching chart preferences:", error);
    res.status(500).json({ error: "Failed to fetch chart preferences" });
  }
});

module.exports = router;
