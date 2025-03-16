// statsRoutes.js
const express = require("express");
const router = express.Router();

const UserPreferences = require("../models/User");

router.post("/preferences", async (req, res) => {
  try {
    const { userId, ...preferences } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const updatedPrefs = await UserPreferences.findOneAndUpdate(
      { userId },
      { preferences },
      { upsert: true, new: true }
    );

    res.json(updatedPrefs);
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

router.get("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = await UserPreferences.findOne({ userId });
    res.json(prefs ? prefs.preferences : {});
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

module.exports = router;