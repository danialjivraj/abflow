const express = require("express");
const router = express.Router();
const User = require("../models/User");

// get user preferences (both chart and settings)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      chartPreferences: user.chartPreferences,
      settingsPreferences: user.settingsPreferences,
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
});

// put update user preferences (chart and/or settings)
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { chartPreferences, settingsPreferences } = req.body;

    const update = {};
    if (chartPreferences) update.chartPreferences = chartPreferences;
    if (settingsPreferences) update.settingsPreferences = settingsPreferences;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No preferences provided" });
    }

    const user = await User.findOneAndUpdate({ userId }, update, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    res.json({
      chartPreferences: user.chartPreferences,
      settingsPreferences: user.settingsPreferences,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ error: "Failed to update user preferences" });
  }
});

module.exports = router;
