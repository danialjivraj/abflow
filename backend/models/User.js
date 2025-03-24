const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  welcomeColumnsAndTask: { type: Boolean, default: false },
  chartPreferences: {
    type: new Schema(
      {
        timeRangeType: { type: String, default: "week", enum: ["week", "2weeks", "month", "year", "all-time", "custom"] },
        taskType: { type: String, default: "active", enum: ["active", "completed", "both"] },
        chartType: { type: String, default: "bar", enum: ["bar", "line", "pie", "area", "radar"] },
        xAxisField: { type: String, default: "day", enum: ["day", "priority", "status"] },
        yAxisMetric: { type: String, default: "count", enum: ["count", "timeSpent", "storyPoints"] },
        sortOrder: { type: String, default: "none", enum: ["none", "asc", "desc"] },
        dueFilter: { type: String, default: "both", enum: ["both", "due", "overdue"] },
        priorityFilters: {
          type: [String],
          enum: ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"],
          default: []
        },
        dayOfWeekFilters: {
          type: [String],
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          default: []
        },
        statusFilters: { type: [String], default: [] },
        assignedToFilter: { type: String, default: "" },
        minTaskCount: { type: String, default: "" },
        minStoryPoints: { type: String, default: "" },
        minTimeSpent: { type: String, default: "" },
        minTimeUnit: { type: String, default: "seconds", enum: ["seconds", "minutes", "hours"] },
        scheduledOnly: { type: Boolean, default: false },
        includeZeroMetrics: { type: Boolean, default: true },
        includeNoDueDate: { type: Boolean, default: true },
        comparisonMode: { type: Boolean, default: false },
        compStartDate: { type: Date, default: null },
        compEndDate: { type: Date, default: null },
        customStartDate: { type: Date, default: null },
        customEndDate: { type: Date, default: null },
      },
      { _id: false }
    ),
    default: () => ({})
  },
  settingsPreferences: {
    type: new Schema(
      {
        darkMode: { type: Boolean, default: true },
        muteNotifications: { type: Boolean, default: false },
        inactivityTimeoutHours: { type: Number, default: 1 },
        inactivityTimeoutNever: { type: Boolean, default: true },
        defaultPriority: {
          type: String,
          enum: ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"],
          default: "A1"
        },
        hideOldCompletedTasksDays: { type: Number, default: 365 },
        hideOldCompletedTasksNever: { type: Boolean, default: true },
        defaultBoardView: {
          type: String,
          enum: ["boards", "schedule", "completedtasks"],
          default: "boards"
        },
        disableToCreateTask: { type: Boolean, default: false },
        confirmBeforeDelete: { type: Boolean, default: true },
        notifyNonPriorityGoesOvertime: { type: Number, default: 1 },
        notifyScheduledTaskIsDue: { type: Number, default: 5 },
        themeAccent: {
          type: String,
          enum: ["Green", "Blue", "Orange", "Purple", "Yellow"],
          default: "Green"
        },
        topbarAccent: {
          type: String,
          enum: ["Blue", "Red", "Purple", "Black"],
          default: "Blue"
        }
      },
      { _id: false }
    ),
    default: () => ({})
  },
  lastWeeklyNotification: { type: Date, default: null },
});

module.exports = mongoose.model("User", UserSchema);
