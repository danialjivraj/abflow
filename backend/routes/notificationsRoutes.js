const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// get all notifications for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Fetch notifications sorted by creation date (most recent first)
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// post create a new notification manually
router.post("/", async (req, res) => {
  try {
    const { userId, message } = req.body;
    const newNotification = new Notification({ userId, message });
    await newNotification.save();
    res.json({ notification: newNotification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// delete a notification by its id
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndDelete(notificationId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// patch update a notification's read status by its id
router.patch("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { read } = req.body;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ notification });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

module.exports = router;
