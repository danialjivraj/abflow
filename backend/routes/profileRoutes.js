// profileRoutes.js

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinaryConfig");
const Task = require("../models/Task");
const User = require("../models/User");

// Helper function
function extractPublicId(url) {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const rest = parts[1].split("/");
    let publicIdParts = rest;
    if (rest[0].startsWith("v")) {
      publicIdParts = rest.slice(1);
    }
    const publicIdWithExt = publicIdParts.join("/");
    const dotIndex = publicIdWithExt.lastIndexOf(".");
    return dotIndex !== -1
      ? publicIdWithExt.substring(0, dotIndex)
      : publicIdWithExt;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
}

// ----- LOGGING EXAMPLE START -----
// This will help you confirm that Render is picking up your Cloudinary variables.
console.log("Cloudinary Environment Variables on startup:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
// For security, it's best NOT to log the API secret in production, but you could do:
// console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);
// ----- LOGGING EXAMPLE END -----

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

// GET profile
router.get("/:userId", async (req, res) => {
  try {
    console.log("GET /:userId called with userId =", req.params.userId);
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

// POST upload profile picture
router.post(
  "/uploadProfilePicture/:userId",
  upload.single("profilePicture"),
  async (req, res) => {
    console.log("POST /uploadProfilePicture/:userId called");
    console.log("userId =", req.params.userId);

    // Log if the file is received
    if (!req.file) {
      console.log("No file was uploaded in the request.");
      return res.status(400).json({ error: "No file uploaded" });
    } else {
      console.log("File uploaded:", req.file.originalname);
    }

    try {
      const user = await User.findOne({ userId: req.params.userId });
      if (!user) {
        console.log("User not found in DB");
        return res.status(404).json({ error: "User not found" });
      }

      // If there's an old picture, remove from Cloudinary
      if (user.profilePicture) {
        const publicId = extractPublicId(user.profilePicture);
        if (publicId) {
          console.log("Deleting old picture from Cloudinary, publicId =", publicId);
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
        }
      }

      const imageUrl = req.file.path;
      console.log("New image URL from Cloudinary:", imageUrl);

      const updatedUser = await User.findOneAndUpdate(
        { userId: req.params.userId },
        { profilePicture: imageUrl },
        { new: true }
      );

      console.log("Profile picture updated for user:", updatedUser.userId);
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
  }
);

// PUT remove profile picture
router.put("/removeProfilePicture/:userId", async (req, res) => {
  console.log("PUT /removeProfilePicture/:userId called");
  console.log("userId =", req.params.userId);
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      console.log("User not found in DB");
      return res.status(404).json({ error: "User not found" });
    }

    if (user.profilePicture) {
      const publicId = extractPublicId(user.profilePicture);
      if (publicId) {
        console.log("Deleting old picture from Cloudinary, publicId =", publicId);
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId: req.params.userId },
      { profilePicture: "" },
      { new: true }
    );

    console.log("Profile picture removed for user:", updatedUser.userId);
    res.json({
      message: "Profile picture removed",
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    res.status(500).json({ error: "Failed to remove profile picture" });
  }
});

module.exports = router;
