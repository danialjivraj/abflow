const fs = require("fs");
const path = require("path");
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

require("dotenv").config();
require("./scheduler/scheduler");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const taskRoutes = require("./routes/taskRoutes");
const columnsRoute = require("./routes/columnsRoute");
const chartRoutes = require("./routes/chartRoutes");
const profileRoutes = require("./routes/profileRoutes");
const preferencesRoutes = require("./routes/preferencesRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors({
  origin: 'https://abflow.netlify.app',
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

app.use("/api/tasks", taskRoutes);
app.use("/api/columns", columnsRoute);
app.use("/api/charts", chartRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Server is live ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
