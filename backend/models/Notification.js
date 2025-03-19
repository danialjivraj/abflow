const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
});

module.exports = mongoose.model("Notification", NotificationSchema);
