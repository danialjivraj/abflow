const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Task = require("../models/Task");
const User = require("../models/User");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const userId = req.params.userId || "unknown";
    // Example filename: "7M7kQTuuj4e0wa1DhIfP9YGu5Tn1-1695673440987.jpg"
    cb(null, `${userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

/**
 * Helper function to delete a file if it exists.
 * @param {string} filePath - The absolute path to the file.
 */
const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("Deleted old file:", filePath);
      }
    });
  }
};

// gets user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const completedTasks = await Task.find({ userId, status: "completed" });
    const totalPoints = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);
    const tasksCompleted = completedTasks.length;
    const totalSeconds = completedTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    const totalHours = (totalSeconds / 3600).toFixed(2);
    const user = await User.findOne({ userId });
    const profilePicture = user ? user.profilePicture : "";
    const name = user && user.name ? user.name : "User";

    res.json({ points: totalPoints, tasksCompleted, totalHours, profilePicture, name });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

// update the name
router.put("/updateName/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  try {
    const updatedUser = await User.findOneAndUpdate({ userId }, { name }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Name updated successfully", name: updatedUser.name });
  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ error: "Failed to update name" });
  }
});

// upload picture, and deletes previous one
router.post("/uploadProfilePicture/:userId", upload.single("profilePicture"), async (req, res) => {
  const { userId } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.profilePicture) {
      const oldPicPath = path.join(__dirname, "../", user.profilePicture);
      deleteFileIfExists(oldPicPath);
    }

    const relativePath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { profilePicture: relativePath },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Profile picture updated", profilePicture: updatedUser.profilePicture });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});

// remove profile picture
router.put("/removeProfilePicture/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.profilePicture) {
      const oldPicPath = path.join(__dirname, "../", user.profilePicture);
      deleteFileIfExists(oldPicPath);
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { profilePicture: "" },
      { new: true }
    );
    res.json({ message: "Profile picture removed", profilePicture: updatedUser.profilePicture });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    res.status(500).json({ error: "Failed to remove profile picture" });
  }
});

module.exports = router;
