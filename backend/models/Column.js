const mongoose = require("mongoose");

const ColumnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  userId: { type: String, required: true },
});

const Column = mongoose.model("Column", ColumnSchema);
module.exports = Column;
