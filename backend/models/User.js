const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  columnOrder: { type: [String], default: ["backlog", "In Progress", "done"] },
  columnNames: { type: Map, of: String, default: new Map([["backlog", "Backlog"], ["inprogress", "In Progress"], ["done", "Done"]]) },
});

module.exports = mongoose.model("User", userSchema);