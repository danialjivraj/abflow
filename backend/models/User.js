const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Firebase user ID
  columnOrder: { type: [String], default: ["backlog", "todo", "done"] },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
