const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"], 
    required: true 
  },
  status: { type: String, required: true },
  dueDate: Date,
  completedAt: Date,
  taskCompleted: { type: Boolean, default: false },
  userId: { type: String, required: true },
  assignedTo: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  points: { type: Number, default: 0 },
  storyPoints: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  description: { type: String, default: "" },
  timeSpent: { type: Number, default: 0 },
  isTimerRunning: { type: Boolean, default: false },
  timerStartTime: { type: Date },
  scheduledStart: { type: Date, default: null },
  scheduledEnd: { type: Date, default: null },
  // notification related
  lastNotifiedAt: { type: Date, default: null },
  notifiedUpcoming: { type: Boolean, default: false },
  notifiedOverdue: { type: Boolean, default: false },
});

const Task = mongoose.model("Task", TaskSchema);
module.exports = Task;
