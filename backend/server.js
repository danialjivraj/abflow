const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const taskRoutes = require("./routes/taskRoutes");
const chartRoutes = require("./routes/chartRoutes");
const profileRoutes = require("./routes/profileRoutes");
const preferencesRoutes = require("./routes/preferences");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

app.use("/api/tasks", taskRoutes);
app.use("/api/charts", chartRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/preferences", preferencesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
