const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinaryConfig");

const Task = require("../models/Task");
const User = require("../models/User");

const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  }),
});
const upload = multer({ storage });

// User profile data
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
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profilePicture = user.profilePicture || "";
    const name = user.name || "User";

    res.json({
      points: totalPoints,
      tasksCompleted,
      totalHours,
      profilePicture,
      name,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

// Update user name
router.put("/updateName/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { name },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Name updated successfully", name: updatedUser.name });
  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ error: "Failed to update name" });
  }
});

// Upload profile picture
router.post("/uploadProfilePicture/:userId", upload.single("profilePicture"), async (req, res) => {
  console.log("Upload request received:", req.params.userId);
  try {
    if (!req.file) {
      console.error("No file uploaded.");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      console.error("User not found:", req.params.userId);
      return res.status(404).json({ error: "User not found" });
    }

    // If there's an old image, destroy it by public_id
    if (user.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(user.cloudinaryPublicId, { invalidate: true });
      console.log("Old image removed from Cloudinary");
    }

    // The new Cloudinary image URL is in req.file.path
    // The new Cloudinary public_id is in req.file.filename
    console.log("New image URL:", req.file.path);
    console.log("New image public_id:", req.file.filename);

    // Update the user record
    user.profilePicture = req.file.path;      // store the new URL
    user.cloudinaryPublicId = req.file.filename; // store the new public_id
    await user.save();

    console.log("User updated with new profile picture");
    res.json({
      message: "Profile picture updated",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("❌ Error updating profile picture:", error);
    res.status(500).json({
      error: "Failed to update profile picture",
      details: error.message,
    });
  }
});

// Remove profile picture
router.put("/removeProfilePicture/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Destroy old image if public_id exists
    if (user.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(user.cloudinaryPublicId, { invalidate: true });
      console.log("Old image removed from Cloudinary");
    }

    // Clear the user’s stored URL and public_id
    user.profilePicture = "";
    user.cloudinaryPublicId = "";
    await user.save();

    res.json({
      message: "Profile picture removed",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    res.status(500).json({ error: "Failed to remove profile picture" });
  }
});

module.exports = router;
