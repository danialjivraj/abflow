const mongoose = require("mongoose");

const ColumnSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Board name
  order: { type: Number, default: 0 }, // Position of the board
  userId: { type: String, required: true }, // User who owns this board
});

const Column = mongoose.model("Column", ColumnSchema);
module.exports = Column;
