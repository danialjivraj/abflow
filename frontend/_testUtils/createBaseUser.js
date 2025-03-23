function createBaseUser(overrides = {}) {
  return {
    userId: "user1",
    welcomeColumnsAndTask: false,
    chartPreferences: {
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
    lastWeeklyNotification: null,
    ...overrides,
  };
}

module.exports = { createBaseUser };
