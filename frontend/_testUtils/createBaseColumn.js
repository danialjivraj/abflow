function createBaseColumn(overrides = {}) {
    return {
      columnId: "column-1",
      userId: "user1",
      name: "Test Board",
      order: 0,
      ...overrides,
    };
  }
  
  module.exports = { createBaseColumn };
  