// routes/preferences.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET user preferences
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ preferences: user.preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// PUT update user preferences
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const newPreferences = req.body.preferences;
    if (!newPreferences)
      return res.status(400).json({ error: "No preferences provided" });

    const user = await User.findOneAndUpdate(
      { userId },
      { preferences: newPreferences },
      { new: true, upsert: true }
    );

    res.json({ preferences: user.preferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

module.exports = router;
