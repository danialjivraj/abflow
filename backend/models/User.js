// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  columnOrder: { type: [String], default: ["backlog", "inprogress", "done"] },
  columnNames: {
    type: Map,
    of: String,
    default: new Map([
      ["backlog", "Backlog"],
      ["inprogress", "In Progress"],
      ["done", "Done"],
    ]),
  },
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
      includeNoDueDate: true,
      comparisonMode: false,
      compStartDate: null,
      compEndDate: null,
      customStartDate: null,
      customEndDate: null,
    },
  },
});

module.exports = mongoose.model("User", UserSchema);
