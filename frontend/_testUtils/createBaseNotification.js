function createBaseNotification(overrides = {}) {
    return {
      _id: "notif1",
      userId: "user1",
      message: "Test notification",
      read: false,
      soundPlayed: false,
      createdAt: "2022-01-01T10:00:00.000Z",
      taskId: null,
      ...overrides,
    };
  }
  
  module.exports = { createBaseNotification };
  