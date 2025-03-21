function createBaseTask(overrides = {}) {
    return {
      _id: "1",
      title: "Test Task",
      priority: "A1",
      status: "in-progress",
      dueDate: "2022-01-05T10:00:00.000Z",
      completedAt: null,
      taskCompleted: false,
      userId: "user1",
      assignedTo: "John Doe",
      createdAt: "2022-01-01T10:00:00.000Z",
      points: 0,
      storyPoints: 5,
      order: 0,
      description: "This is a test description.",
      timeSpent: 1800,
      isTimerRunning: false,
      timerStartTime: null,
      scheduledStart: "2022-01-01T09:00:00.000Z",
      scheduledEnd: "2022-01-01T11:00:00.000Z",
      notifiedUpcoming: false,
      notifiedOverdue: false,
      lastNotifiedScheduledStart: null,
      notifiedWarning: false,
      ...overrides,
    };
  }
  
  module.exports = { createBaseTask };
