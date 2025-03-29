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
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: "uploads",
    public_id: `${req.params.userId}-${Date.now()}`,
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  }),
});

const upload = multer({ storage });

// Helper function to extract Cloudinary public_id from a URL.
function extractPublicId(url) {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const rest = parts[1];
    const restParts = rest.split("/");
    let publicIdParts = restParts;
    if (restParts[0].startsWith("v")) {
      publicIdParts = restParts.slice(1);
    }
    const publicIdWithExt = publicIdParts.join("/");
    const dotIndex = publicIdWithExt.lastIndexOf(".");
    let publicId = dotIndex !== -1 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt;
    if (publicId.startsWith("uploads/")) {
      publicId = publicId.substring("uploads/".length);
    }
    return publicId;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
}

// User profile data
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ error: "User ID is required" });

    const completedTasks = await Task.find({ userId, status: "completed" });
    const totalPoints = completedTasks.reduce(
      (sum, task) => sum + (task.points || 0),
      0
    );
    const tasksCompleted = completedTasks.length;
    const totalSeconds = completedTasks.reduce(
      (sum, task) => sum + (task.timeSpent || 0),
      0
    );
    const totalHours = (totalSeconds / 3600).toFixed(2);

    const user = await User.findOne({ userId });
    const profilePicture = user?.profilePicture || "";
    const name = user?.name || "User";

    res.json({ points: totalPoints, tasksCompleted, totalHours, profilePicture, name });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

// Update user name
router.put("/updateName/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;

  if (!name)
    return res.status(400).json({ error: "Name is required" });

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { name },
      { new: true }
    );
    if (!updatedUser)
      return res.status(404).json({ error: "User not found" });

    res.json({ message: "Name updated successfully", name: updatedUser.name });
  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ error: "Failed to update name" });
  }
});

// Upload profile picture
router.post("/uploadProfilePicture/:userId", upload.single("profilePicture"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If an old picture exists, remove it from Cloudinary.
    if (user.profilePicture) {
      const publicId = extractPublicId(user.profilePicture);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
    }

    const imageUrl = req.file.path;

    const updatedUser = await User.findOneAndUpdate(
      { userId: req.params.userId },
      { profilePicture: imageUrl },
      { new: true }
    );

    res.json({
      message: "Profile picture updated",
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
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
    if (!user)
      return res.status(404).json({ error: "User not found" });

    if (user.profilePicture) {
      const publicId = extractPublicId(user.profilePicture);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
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
