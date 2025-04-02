const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: {
    type: String,
    enum: ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"],
    required: true,
  },
  status: { type: String, required: true },
  dueDate: Date,
  completedAt: Date,
  taskCompleted: { type: Boolean, default: false },
  userId: { type: String, required: true },
  assignedTo: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  points: {
    type: Number,
    default: function () {
      const pointsMap = {
        A1: 5.0,
        A2: 4.5,
        A3: 4.0,
        B1: 3.5,
        B2: 3.0,
        B3: 2.5,
        C1: 2.0,
        C2: 1.5,
        C3: 1.0,
        D: 0.5,
        E: 0.0,
      };
      return pointsMap[this.priority] || 0;
    },
  },
  storyPoints: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  description: { type: String, default: "" },
  timeSpent: { type: Number, default: 0 },
  isTimerRunning: { type: Boolean, default: false },
  timerStartTime: { type: Date },
  scheduledStart: { type: Date, default: null },
  scheduledEnd: { type: Date, default: null },
  labels: {
    type: [
      {
        title: { type: String },
        color: { type: String },
      },
    ],
    default: [],
  },
  // notification related
  notifiedUpcoming: { type: Boolean, default: false },
  notifiedOverdue: { type: Boolean, default: false },
  lastNotifiedScheduledStart: { type: Date, default: null },
  notifiedWarning: { type: Boolean, default: false },
});

const Task = mongoose.model("Task", TaskSchema);
module.exports = Task;
