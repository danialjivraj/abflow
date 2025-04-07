jest.setTimeout(20000);

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Task = require("../../models/Task");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const {
  generateWeeklyInsights,
} = require("../../scheduler/weeklyNotifications");

const RealDate = Date;
const fixedDate = new Date("2025-03-20T17:40:00.000Z");

describe("Weekly Notifications", () => {
  let mongoServer;
  let defaultUser;

  const getBaseTask = () => ({
    priority: "C1",
    status: "pending",
    userId: defaultUser.userId,
  });

  function MockDate(...args) {
    if (args.length === 0) return new RealDate(fixedDate);
    return new RealDate(...args);
  }
  MockDate.now = () => fixedDate.getTime();
  MockDate.UTC = RealDate.UTC;
  MockDate.parse = RealDate.parse;
  MockDate.prototype = RealDate.prototype;

  const originalToLocaleTimeString = RealDate.prototype.toLocaleTimeString;
  RealDate.prototype.toLocaleTimeString = function (locales, options) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      ...options,
    }).format(this);
  };

  beforeAll(async () => {
    global.Date = MockDate;
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    defaultUser = await User.create({ userId: "user1" });
  });

  beforeEach(async () => {
    await Task.deleteMany({});
    await Notification.deleteMany({});
    await User.findOneAndUpdate(
      { userId: defaultUser.userId },
      { lastWeeklyNotification: null },
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    global.Date = RealDate;
    RealDate.prototype.toLocaleTimeString = originalToLocaleTimeString;
  });

  // ---------------------------
  // General Weekly Notifications
  // ---------------------------
  it("should generate notifications and update lastWeeklyNotification when tasks completed last week meet conditions", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Completed High Priority Task",
      timeSpent: 3600,
      completedAt: new Date("2025-03-15T12:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Completed Non-High Priority Task",
      timeSpent: 1800,
      completedAt: new Date("2025-03-15T13:00:00.000Z"),
    });

    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    expect(notifications.length).toBeGreaterThan(0);

    const updatedUser = await User.findOne({ userId: defaultUser.userId });
    expect(updatedUser.lastWeeklyNotification).toBeTruthy();

    const startOfThisWeek = new Date(fixedDate);
    const day = startOfThisWeek.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    startOfThisWeek.setDate(startOfThisWeek.getDate() - diffToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);
    expect(
      new Date(updatedUser.lastWeeklyNotification) >= startOfThisWeek,
    ).toBe(true);
  });

  it("should not generate notifications if one was already sent this week", async () => {
    const startOfThisWeek = new Date(fixedDate);
    const day = startOfThisWeek.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    startOfThisWeek.setDate(startOfThisWeek.getDate() - diffToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);
    await User.findOneAndUpdate(
      { userId: defaultUser.userId },
      { lastWeeklyNotification: startOfThisWeek },
    );

    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Completed High Priority Task",
      timeSpent: 3600,
      completedAt: new Date("2025-03-15T12:00:00.000Z"),
    });

    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    expect(notifications.length).toBe(0);
  });

  it("should ignore tasks completed outside the last-week window", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Outside Window Task",
      timeSpent: 1000,
      completedAt: new Date("2025-03-09T12:00:00.000Z"),
    });
    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    expect(notifications.length).toBe(0);
  });

  it("should generate weekly insights for subsequent weeks", async () => {
    // Week 1
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Week1 Task",
      timeSpent: 2000,
      completedAt: new Date("2025-03-15T12:00:00.000Z"),
    });
    await generateWeeklyInsights();
    let notifications = await Notification.find({ userId: defaultUser.userId });
    expect(notifications.length).toBe(2);

    const expectedInsightMessageWeek1 =
      "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week.";
    const expectedTaskCountMessageWeek1 =
      "Weekly Insight: You completed 1 task last week.";
    const week1Messages = notifications.map((n) => n.message).sort();
    expect(week1Messages).toEqual(
      [expectedInsightMessageWeek1, expectedTaskCountMessageWeek1].sort(),
    );

    const updatedUserWeek1 = await User.findOne({ userId: defaultUser.userId });
    const lastNotificationWeek1 = updatedUserWeek1.lastWeeklyNotification;
    expect(lastNotificationWeek1).toBeTruthy();

    // Confirm no new notifications are sent
    await generateWeeklyInsights();
    notifications = await Notification.find({ userId: defaultUser.userId });
    expect(notifications.length).toBe(2);

    // Week 2
    const newFixedDate = new Date("2025-03-27T17:40:00.000Z"); // One week later
    const OldDate = global.Date;
    function NewMockDate(...args) {
      if (args.length === 0) return new RealDate(newFixedDate);
      return new RealDate(...args);
    }
    NewMockDate.now = () => newFixedDate.getTime();
    NewMockDate.UTC = RealDate.UTC;
    NewMockDate.parse = RealDate.parse;
    NewMockDate.prototype = RealDate.prototype;
    global.Date = NewMockDate;

    await Task.deleteMany({});
    await Notification.deleteMany({});
    await User.findOneAndUpdate(
      { userId: defaultUser.userId },
      { lastWeeklyNotification: null },
    );

    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Week2 Task A",
      timeSpent: 3000,
      completedAt: new Date("2025-03-20T10:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      priority: "B1",
      status: "completed",
      title: "Week2 Task B",
      timeSpent: 1500,
      completedAt: new Date("2025-03-20T11:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      priority: "D", // non-high priority
      status: "completed",
      title: "Week2 Task C",
      timeSpent: 2000,
      completedAt: new Date("2025-03-20T12:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      priority: "E", // non-high priority
      status: "completed",
      title: "Week2 Task D",
      timeSpent: 1000,
      completedAt: new Date("2025-03-20T13:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      priority: "A3",
      status: "completed",
      title: "Week2 Task E",
      timeSpent: 500,
      completedAt: new Date("2025-03-20T14:00:00.000Z"),
    });

    await generateWeeklyInsights();
    notifications = await Notification.find({ userId: defaultUser.userId });
    expect(notifications.length).toBe(2);

    const expectedInsightMessageWeek2 =
      "Weekly Insight: Great job! You dedicated 63% of your time to high priority tasks last week.";
    const expectedTaskCountMessageWeek2 =
      "Weekly Insight: You completed 5 tasks last week.";
    const week2Messages = notifications.map((n) => n.message).sort();
    expect(week2Messages).toEqual(
      [expectedInsightMessageWeek2, expectedTaskCountMessageWeek2].sort(),
    );

    const updatedUserWeek2 = await User.findOne({ userId: defaultUser.userId });
    expect(updatedUserWeek2.lastWeeklyNotification).toBeTruthy();

    global.Date = OldDate;
  });

  // ---------------------------
  // Weekly Task Count Notification Tests
  // ---------------------------
  it("should generate a task count notification if 1 task was completed last week", async () => {
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Task 1",
      timeSpent: 600,
      completedAt: new Date("2025-03-12T10:00:00.000Z"),
    });

    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const expectedMessage = "Weekly Insight: You completed 1 task last week.";
    const taskCountNotif = notifications.find(
      (n) => n.message === expectedMessage,
    );
    expect(taskCountNotif).toBeDefined();
  });

  it("should generate a task count notification if 2 tasks were completed last week", async () => {
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Task 1",
      timeSpent: 600,
      completedAt: new Date("2025-03-12T10:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Task 2",
      timeSpent: 1200,
      completedAt: new Date("2025-03-14T15:00:00.000Z"),
    });

    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const expectedMessage = "Weekly Insight: You completed 2 tasks last week.";
    const taskCountNotif = notifications.find(
      (n) => n.message === expectedMessage,
    );
    expect(taskCountNotif).toBeDefined();
  });

  it("should not generate a task count notification if no tasks were completed last week", async () => {
    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    expect(notifications.length).toBe(0);
  });

  // ---------------------------
  // Weekly Insight (High Priority Time) Notification Tests
  // ---------------------------
  it("should generate insight with new high-priority tasks message", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "New High Priority Task",
      timeSpent: 1000,
      completedAt: new Date("2025-03-15T12:00:00.000Z"),
      createdAt: new Date("2025-03-19T18:00:00.000Z"), // qualifies as 'new'
    });
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Non-High Priority Task",
      timeSpent: 4000,
      completedAt: new Date("2025-03-15T13:00:00.000Z"),
    });

    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const expectedMessage =
      "Weekly Insight: Your high priority tasks accounted for only 20% of your total time last week, with some new tasks added recently. Consider reviewing them for improved focus.";
    const insightNotif = notifications.find(
      (n) => n.message === expectedMessage,
    );
    expect(insightNotif).toBeDefined();
  });

  it("should generate insight with no new high-priority tasks message", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Old High Priority Task",
      timeSpent: 1000,
      completedAt: new Date("2025-03-15T12:00:00.000Z"),
      createdAt: new Date("2025-03-16T12:00:00.000Z"), // does not qualify as new
    });
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Non-High Priority Task",
      timeSpent: 4000,
      completedAt: new Date("2025-03-15T13:00:00.000Z"),
    });

    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const expectedMessage =
      "Weekly Insight: You spent only 20% of your time on high priority tasks last week. Consider increasing your focus on these tasks.";
    const insightNotif = notifications.find(
      (n) => n.message === expectedMessage,
    );
    expect(insightNotif).toBeDefined();
  });

  it("should generate insight with 49% time spent on high priority tasks", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Old High Priority Task",
      timeSpent: 2000,
      completedAt: new Date("2025-03-15T12:00:00.000Z"),
      createdAt: new Date("2025-03-16T12:00:00.000Z"), // does not qualify as new
    });
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Non-High Priority Task",
      timeSpent: 2100,
      completedAt: new Date("2025-03-15T13:00:00.000Z"),
    });

    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const expectedMessage =
      "Weekly Insight: You spent only 49% of your time on high priority tasks last week. Consider increasing your focus on these tasks.";
    const insightNotif = notifications.find(
      (n) => n.message === expectedMessage,
    );
    expect(insightNotif).toBeDefined();
  });

  it("should generate a great job insight when highPercentage is exactly 50%", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "High Priority Task",
      timeSpent: 2000,
      completedAt: new Date("2025-03-15T10:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      priority: "C1",
      status: "completed",
      title: "Non-High Priority Task",
      timeSpent: 2000,
      completedAt: new Date("2025-03-15T11:00:00.000Z"),
    });
    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const expectedMessage =
      "Weekly Insight: Great job! You dedicated 50% of your time to high priority tasks last week.";
    const insightNotif = notifications.find(
      (n) => n.message === expectedMessage,
    );
    expect(insightNotif).toBeDefined();
  });

  it("should generate a great job insight when highPercentage is 100%", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "High Priority Task 1",
      timeSpent: 2000,
      completedAt: new Date("2025-03-15T10:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "High Priority Task 2",
      timeSpent: 2000,
      completedAt: new Date("2025-03-15T11:00:00.000Z"),
    });
    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const expectedMessage =
      "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week.";
    const insightNotif = notifications.find(
      (n) => n.message === expectedMessage,
    );
    expect(insightNotif).toBeDefined();
  });

  // ---------------------------
  // Edge Cases
  // ---------------------------
  it("should generate only task count notification when tasks have 0 timeSpent", async () => {
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Zero Time Task 1",
      timeSpent: 0,
      completedAt: new Date("2025-03-15T09:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Zero Time Task 2",
      timeSpent: 0,
      completedAt: new Date("2025-03-15T10:00:00.000Z"),
    });
    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const countMessage = "Weekly Insight: You completed 2 tasks last week.";
    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe(countMessage);
  });

  it("should not create duplicate notifications if one exists within the threshold", async () => {
    await Task.create({
      ...getBaseTask(),
      priority: "A1",
      status: "completed",
      title: "Duplicate Check Task",
      timeSpent: 1000,
      completedAt: new Date("2025-03-15T09:00:00.000Z"),
      createdAt: new Date("2025-03-19T18:00:00.000Z"),
    });
    await Task.create({
      ...getBaseTask(),
      status: "completed",
      title: "Regular Task",
      timeSpent: 4000,
      completedAt: new Date("2025-03-15T10:00:00.000Z"),
    });
    const duplicateMessage =
      "Weekly Insight: Your high priority tasks accounted for only 20% of your total time last week, with some new tasks added recently. Consider reviewing them for improved focus.";
    await Notification.create({
      userId: defaultUser.userId,
      message: duplicateMessage,
      createdAt: new Date(), // falls within the threshold
    });
    await generateWeeklyInsights();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    const insightNotifs = notifications.filter(
      (n) => n.message === duplicateMessage,
    );
    expect(insightNotifs.length).toBe(1);
  });
});
