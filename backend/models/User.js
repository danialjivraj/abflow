const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  columnOrder: { type: [String], default: ["backlog", "todo", "done"] },
  columnNames: { type: Map, of: String, default: new Map([["backlog", "Backlog"], ["todo", "Todo"], ["done", "Done"]]) },
});

module.exports = mongoose.model("User", userSchema);