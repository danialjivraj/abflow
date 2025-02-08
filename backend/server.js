const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const taskRoutes = require("./routes/taskRoutes");
const statsRoutes = require("./routes/statsRoutes"); // ✅ Import Stats Routes
const profileRoutes = require("./routes/profileRoutes"); // ✅ Import Profile Routes

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

app.use("/api/tasks", taskRoutes);
app.use("/api/stats", statsRoutes); // ✅ Add Stats Routes
app.use("/api/profile", profileRoutes); // ✅ Use Profile Routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
