const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Firebase user ID
  columnOrder: { type: [String], default: ["backlog", "todo", "done"] } // Store column order
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
