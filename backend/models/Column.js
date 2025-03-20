const mongoose = require("mongoose");

const ColumnSchema = new mongoose.Schema({
  columnId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
});

module.exports = mongoose.model("Column", ColumnSchema);
