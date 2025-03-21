const express = require("express");
const router = express.Router();
const User = require("../models/User");

// user chart preferences
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ chartPreferences: user.chartPreferences });
  } catch (error) {
    console.error("Error fetching chart preferences:", error);
    res.status(500).json({ error: "Failed to fetch chart preferences" });
  }
});

// update user chart preferences
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const newPreferences = req.body.chartPreferences;
    if (!newPreferences)
      return res.status(400).json({ error: "No chartPreferences provided" });

    const user = await User.findOneAndUpdate(
      { userId },
      { chartPreferences: newPreferences },
      { new: true, upsert: true }
    );

    res.json({ chartPreferences: user.chartPreferences });
  } catch (error) {
    console.error("Error updating chart preferences:", error);
    res.status(500).json({ error: "Failed to update chart preferences" });
  }
});

module.exports = router;
