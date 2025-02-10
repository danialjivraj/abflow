const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"], 
    required: true 
  },
  status: { type: String, enum: ["backlog", "todo", "done"], default: "backlog" }, // Kanban Status
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  points: { type: Number, default: 0 }, // Points earned when completed
  order: { type: Number, default: 0 } // ✅ Order field to track position
});

const Task = mongoose.model("Task", TaskSchema);
module.exports = Task;
