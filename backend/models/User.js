const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  welcomeColumnsAndTask: { type: Boolean, default: false },
  preferences: {
    type: Object,
    default: {
      timeRangeType: "week",
      taskType: "active",
      chartType: "bar",
      xAxisField: "day",
      yAxisMetric: "count",
      sortOrder: "none",
      dueFilter: "both",
      priorityFilters: [],
      dayOfWeekFilters: [],
      statusFilters: [],
      assignedToFilter: "",
      minTaskCount: "",
      minStoryPoints: "",
      minTimeSpent: "",
      minTimeUnit: "seconds",
      scheduledOnly: false,
      includeZeroMetrics: true,
      includeNoDueDate: true,
      comparisonMode: false,
      compStartDate: null,
      compEndDate: null,
      customStartDate: null,
      customEndDate: null,
    },
  },
  lastWeeklyNotification: { type: Date, default: null },
});

module.exports = mongoose.model("User", UserSchema);
