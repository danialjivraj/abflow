jest.setTimeout(10000);

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Task = require("../../models/Task");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const {
  formatTime12Hour,
  shouldCreateNotification,
  generateScheduledNotifications,
  generateUpcomingNotifications,
  generateOverdueNotifications,
  generateWarningNotifications,
  generateFrequentNotifications,
} = require("../../scheduler/frequentNotifications");

const RealDate = Date;
let fixedDate = new Date("2025-03-20T17:40:00.000Z");

describe("Frequent Notifications", () => {
  let mongoServer;
  let defaultUser;

  const getBaseTask = () => ({
    priority: "C1",
    status: "pending",
    userId: defaultUser.userId,
    notifiedUpcoming: false,
    notifiedOverdue: false,
    notifiedWarning: false,
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
    if (arguments.length === 0) {
      return formatTime12Hour(this);
    }
    return originalToLocaleTimeString.call(this, locales, options);
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
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    global.Date = RealDate;
    RealDate.prototype.toLocaleTimeString = originalToLocaleTimeString;
  });

  // ---------------------------
  // shouldCreateNotification Tests
  // ---------------------------
  it("should not create a notification if one already exists within threshold", async () => {
    const now = new Date();
    await Notification.create({
      userId: defaultUser.userId,
      message: "Test message",
      createdAt: now,
    });
    const result = await shouldCreateNotification(
      defaultUser.userId,
      "Test message",
    );
    expect(result).toBe(false);
  });

  it("should create a notification if none exists within threshold", async () => {
    const result = await shouldCreateNotification(
      defaultUser.userId,
      "Another test message",
    );
    expect(result).toBe(true);
  });

  it("should respect a custom threshold", async () => {
    const now = new Date();
    await Notification.create({
      userId: defaultUser.userId,
      message: "Custom threshold message",
      createdAt: new Date(now.getTime() - 50),
    });
    const result = await shouldCreateNotification(
      defaultUser.userId,
      "Custom threshold message",
      100,
    );
    expect(result).toBe(false);
  });

  // ---------------------------
  // generateScheduledNotifications Tests
  // ---------------------------
  it("should generate scheduled notification for a task starting within 4 minutes", async () => {
    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 4 * 60 * 1000); // 4 minutes later: 17:44 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Test Task Scheduled",
      scheduledStart,
    });
    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );
    expect(scheduledNotifs.length).toBe(1);
    const expectedMessage =
      'Reminder: Your scheduled task "Test Task Scheduled" will start at 5:44 PM (in less than 4 minutes).';
    expect(scheduledNotifs[0].message).toBe(expectedMessage);
  });

  it("should generate scheduled notification when task is scheduled exactly 5 minutes away", async () => {
    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 5 * 60 * 1000); // Exactly 5 minutes later: 17:45 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Edge Scheduled Task",
      scheduledStart,
    });
    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );
    expect(scheduledNotifs.length).toBe(1);
    expect(scheduledNotifs[0].message).toBe(
      'Reminder: Your scheduled task "Edge Scheduled Task" will start at 5:45 PM (in less than 5 minutes).',
    );
  });

  it("should generate scheduled notification when task is scheduled at 4 minutes 55 seconds away", async () => {
    const now = new Date();
    const scheduledStart = new Date(now.getTime() + (4 * 60 + 55) * 1000);

    await Task.create({
      ...getBaseTask(),
      title: "Edge Scheduled Task",
      scheduledStart,
    });

    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );

    expect(scheduledNotifs.length).toBe(1);
    expect(scheduledNotifs[0].message).toBe(
      'Reminder: Your scheduled task "Edge Scheduled Task" will start at 5:44 PM (in less than 5 minutes).',
    );
  });

  it("should generate scheduled notification using a custom threshold from user settings", async () => {
    await User.findOneAndUpdate(
      { userId: defaultUser.userId },
      { "settingsPreferences.notifyScheduledTaskIsDue": 30 },
      { new: true },
    );

    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 29 * 60 * 1000);
    await Task.create({
      ...getBaseTask(),
      title: "Custom Threshold Task",
      scheduledStart,
    });

    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );
    expect(scheduledNotifs.length).toBe(1);

    const expectedMessage = `Reminder: Your scheduled task "Custom Threshold Task" will start at 6:09 PM (in less than 29 minutes).`;
    expect(scheduledNotifs[0].message).toBe(expectedMessage);
  });

  it("should not generate scheduled notification if task is scheduled just over 5 minutes away", async () => {
    await User.findOneAndUpdate(
      { userId: defaultUser.userId },
      { "settingsPreferences.notifyScheduledTaskIsDue": 5 },
      { new: true },
    );

    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 5 * 60 * 1000 + 1); // Over 5 minutes away: 17:45:01 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Late Scheduled Task",
      scheduledStart,
    });
    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );
    expect(scheduledNotifs.length).toBe(0);
  });

  it("should not generate scheduled notification if one was already sent", async () => {
    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 4 * 60 * 1000); // 4 minutes later: 17:44 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Already Notified Task",
      scheduledStart,
      lastNotifiedScheduledStart: scheduledStart, // Already notified
    });
    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );
    expect(scheduledNotifs.length).toBe(0);
  });

  it("should not generate scheduled notification if task is scheduled less than 1 minute away", async () => {
    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 30 * 1000);
    await Task.create({
      ...getBaseTask(),
      title: "Zero Minute Task",
      scheduledStart,
    });
    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );
    expect(scheduledNotifs.length).toBe(0);
  });

  it("should generate a scheduled notification in the morning (AM scenario)", async () => {
    const oldFixedDate = fixedDate;
    try {
      // 5:40 AM instead of 5:40 PM
      fixedDate = new Date("2025-03-21T05:40:00.000Z");
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 4 * 60 * 1000); // 05:44 AM
      await Task.create({
        ...getBaseTask(),
        title: "Morning Task",
        scheduledStart,
      });
      const scheduledNotifs = await generateScheduledNotifications(
        defaultUser.userId,
        now,
      );
      expect(scheduledNotifs.length).toBe(1);
      expect(scheduledNotifs[0].message).toBe(
        'Reminder: Your scheduled task "Morning Task" will start at 5:44 AM (in less than 4 minutes).',
      );
    } finally {
      fixedDate = oldFixedDate;
    }
  });

  // ---------------------------
  // generateUpcomingNotifications Tests
  // ---------------------------
  it("should generate upcoming notification for task due within 24 hours", async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later: 19:40 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Upcoming Task",
      dueDate,
    });
    const upcomingNotifs = await generateUpcomingNotifications(
      defaultUser.userId,
      now,
    );
    expect(upcomingNotifs.length).toBe(1);
    expect(upcomingNotifs[0].message).toBe(
      'Reminder: Your task "Upcoming Task" is due at 7:40 PM (within 24 hours).',
    );
  });

  it("should generate upcoming notification when task is due exactly 24 hours away", async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 17:40 next day
    await Task.create({
      ...getBaseTask(),
      title: "Edge Upcoming Task",
      dueDate,
    });
    const upcomingNotifs = await generateUpcomingNotifications(
      defaultUser.userId,
      now,
    );
    expect(upcomingNotifs.length).toBe(1);
    expect(upcomingNotifs[0].message).toBe(
      'Reminder: Your task "Edge Upcoming Task" is due at 5:40 PM (within 24 hours).',
    );
  });

  it("should not generate upcoming notification if due date is just over 24 hours away", async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 1); // 24 hours and 1 millisecond later
    await Task.create({
      ...getBaseTask(),
      title: "Late Upcoming Task",
      dueDate,
    });
    const upcomingNotifs = await generateUpcomingNotifications(
      defaultUser.userId,
      now,
    );
    expect(upcomingNotifs.length).toBe(0);
  });

  it("should not generate upcoming notification if already notified", async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later: 19:40 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Already Notified Upcoming Task",
      dueDate,
      notifiedUpcoming: true,
    });
    const upcomingNotifs = await generateUpcomingNotifications(
      defaultUser.userId,
      now,
    );
    expect(upcomingNotifs.length).toBe(0);
  });

  // ---------------------------
  // generateOverdueNotifications Tests
  // ---------------------------
  it("should generate overdue notification for task that is past due", async () => {
    const now = new Date();
    const pastDue = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago: 16:40 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Overdue Task",
      dueDate: pastDue,
    });
    const overdueNotifs = await generateOverdueNotifications(
      defaultUser.userId,
      now,
    );
    expect(overdueNotifs.length).toBe(1);
    expect(overdueNotifs[0].message).toBe(
      'Alert: Your task "Overdue Task" is overdue. Please review it.',
    );
  });

  it("should generate overdue notification when task is due exactly now", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "Edge Overdue Task",
      dueDate: now,
    });
    const overdueNotifs = await generateOverdueNotifications(
      defaultUser.userId,
      now,
    );
    expect(overdueNotifs.length).toBe(0);
  });

  it("should not generate overdue notification if already notified", async () => {
    const now = new Date();
    const pastDue = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago: 16:40 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Already Notified Overdue Task",
      dueDate: pastDue,
      notifiedOverdue: true,
    });
    const overdueNotifs = await generateOverdueNotifications(
      defaultUser.userId,
      now,
    );
    expect(overdueNotifs.length).toBe(0);
  });

  // ---------------------------
  // generateWarningNotifications Tests
  // ---------------------------
  it("should not generate warning if no high-priority tasks exist", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "Non-High Priority Long Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago: 15:40 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(0);
  });

  it("should generate warning if non-high-priority task exceeds 1 hour and A high-priority tasks exist", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "A High Priority Task",
      priority: "A1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "Long Running Non-High Priority Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago: 15:40 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(1);
    expect(warningNotifs[0].message).toBe(
      'Warning: You have spent over 1 hour on the task "Long Running Non-High Priority Task" which is non high priority. Consider switching to high priority work (there are A tasks to do).',
    );
  });

  it("should generate warning if non-high-priority task exceeds 1 hour and B high-priority tasks exist", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "B High Priority Task",
      priority: "B1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "Long Running Non-High Priority Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago: 15:40 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(1);
    expect(warningNotifs[0].message).toBe(
      'Warning: You have spent over 1 hour on the task "Long Running Non-High Priority Task" which is non high priority. Consider switching to high priority work (there are B tasks to do).',
    );
  });

  it("should generate warning if a 'C' non-high-priority task exceeds 1 hour and A and B high-priority tasks exist", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "A High Priority Task",
      priority: "A1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "B High Priority Task",
      priority: "B1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "Long Running Non-High Priority Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago: 15:40 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(1);
    expect(warningNotifs[0].message).toBe(
      'Warning: You have spent over 1 hour on the task "Long Running Non-High Priority Task" which is non high priority. Consider switching to high priority work (there are A and B tasks to do).',
    );
  });

  it("should generate warning if a 'D' non-high-priority task exceeds 1 hour and A and B high-priority tasks exist", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "A High Priority Task",
      priority: "A1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "B High Priority Task",
      priority: "B1",
    });
    await Task.create({
      ...getBaseTask(),
      priority: "D",
      title: "Long Running Non-High Priority Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago: 15:40 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(1);
    expect(warningNotifs[0].message).toBe(
      'Warning: You have spent over 1 hour on the task "Long Running Non-High Priority Task" which is non high priority. Consider switching to high priority work (there are A and B tasks to do).',
    );
  });

  it("should generate warning if a 'E' non-high-priority task exceeds 1 hour and A and B high-priority tasks exist", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "A High Priority Task",
      priority: "A1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "B High Priority Task",
      priority: "B1",
    });
    await Task.create({
      ...getBaseTask(),
      priority: "E",
      title: "Long Running Non-High Priority Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago: 15:40 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(1);
    expect(warningNotifs[0].message).toBe(
      'Warning: You have spent over 1 hour on the task "Long Running Non-High Priority Task" which is non high priority. Consider switching to high priority work (there are A and B tasks to do).',
    );
  });

  it("should generate warning notification using custom threshold of 3 hours for non-high-priority tasks", async () => {
    const customUser = await User.create({
      userId: "user_custom",
      settingsPreferences: { notifyNonPriorityGoesOvertime: 3 },
    });

    const now = new Date();

    await Task.create({
      ...getBaseTask(),
      userId: customUser.userId,
      title: "A High Priority Task",
      priority: "A1",
    });
    await Task.create({
      ...getBaseTask(),
      userId: customUser.userId,
      title: "B High Priority Task",
      priority: "B1",
    });

    const timerStartTime = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
    await Task.create({
      ...getBaseTask(),
      userId: customUser.userId,
      title: "Custom Threshold Warning Task",
      isTimerRunning: true,
      timerStartTime,
      timeSpent: 0,
    });

    const warningNotifs = await generateWarningNotifications(
      customUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(1);
    expect(warningNotifs[0].message).toBe(
      'Warning: You have spent over 3 hours on the task "Custom Threshold Warning Task" which is non high priority. Consider switching to high priority work (there are A and B tasks to do).',
    );

    const updatedTask = await Task.findOne({
      title: "Custom Threshold Warning Task",
    });
    expect(updatedTask.notifiedWarning).toBe(true);
  });

  it("should generate warning if a 'E' non-high-priority task exceeds 1 hour and A and B high-priority tasks exist and timer is off", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "A High Priority Task",
      priority: "A1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "B High Priority Task",
      priority: "B1",
    });
    await Task.create({
      ...getBaseTask(),
      priority: "E",
      title: "Long Running Non-High Priority Task",
      isTimerRunning: false,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago: 15:40 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(0);
  });

  it("should not generate warning if task running time is below threshold", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "High Priority Task",
      priority: "A1",
    });
    await Task.create({
      ...getBaseTask(),
      title: "Short Running Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago: 17:10 UTC
      timeSpent: 0,
    });
    const warningNotifs = await generateWarningNotifications(
      defaultUser.userId,
      now,
    );
    expect(warningNotifs.length).toBe(0);
  });

  // ---------------------------
  // Tasks Without Dates Tests
  // ---------------------------
  it("should ignore tasks without scheduledStart for scheduled notifications", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "No ScheduledStart Task",
    });
    const scheduledNotifs = await generateScheduledNotifications(
      defaultUser.userId,
      now,
    );
    expect(scheduledNotifs.length).toBe(0);
  });

  it("should ignore tasks without dueDate for upcoming or overdue notifications", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "No DueDate Task",
    });
    const upcomingNotifs = await generateUpcomingNotifications(
      defaultUser.userId,
      now,
    );
    const overdueNotifs = await generateOverdueNotifications(
      defaultUser.userId,
      now,
    );
    expect(upcomingNotifs.length).toBe(0);
    expect(overdueNotifs.length).toBe(0);
  });

  // ---------------------------
  // Flag Updates Tests
  // ---------------------------
  it("should update notifiedUpcoming flag after generating upcoming notification", async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const task = await Task.create({
      ...getBaseTask(),
      title: "Upcoming Flag Task",
      dueDate,
    });
    await generateUpcomingNotifications(defaultUser.userId, now);
    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.notifiedUpcoming).toBe(true);
  });

  it("should update notifiedOverdue flag after generating overdue notification", async () => {
    const now = new Date();
    const pastDue = new Date(now.getTime() - 60 * 60 * 1000);
    const task = await Task.create({
      ...getBaseTask(),
      title: "Overdue Flag Task",
      dueDate: pastDue,
    });
    await generateOverdueNotifications(defaultUser.userId, now);
    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.notifiedOverdue).toBe(true);
  });

  it("should update notifiedWarning flag after generating warning notification", async () => {
    const now = new Date();
    await Task.create({
      ...getBaseTask(),
      title: "High Priority For Warning Task",
      priority: "A1",
    });
    const task = await Task.create({
      ...getBaseTask(),
      title: "Warning Flag Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      timeSpent: 0,
    });
    await generateWarningNotifications(defaultUser.userId, now);
    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.notifiedWarning).toBe(true);
  });

  // ---------------------------
  // Master Function: generateFrequentNotifications Tests
  // ---------------------------
  it("should generate a combined set of notifications for multiple tasks", async () => {
    const now = new Date();
    // 17:44 UTC
    const scheduledStart = new Date(now.getTime() + 4 * 60 * 1000);
    await Task.create({
      ...getBaseTask(),
      title: "Scheduled Task",
      scheduledStart,
    });
    // 19:40 UTC
    const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    await Task.create({
      ...getBaseTask(),
      title: "Upcoming Task",
      dueDate,
    });
    // 16:40 UTC
    const pastDue = new Date(now.getTime() - 60 * 60 * 1000);
    await Task.create({
      ...getBaseTask(),
      title: "Overdue Task",
      dueDate: pastDue,
    });
    // High Priority Task for warnings
    await Task.create({
      ...getBaseTask(),
      title: "High Priority Task",
      priority: "A1",
    });
    // Long Running Warning Task: running for 2 hours, started at 15:40 UTC
    await Task.create({
      ...getBaseTask(),
      title: "Long Running Warning Task",
      isTimerRunning: true,
      timerStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      timeSpent: 0,
    });
    await generateFrequentNotifications();
    const notifications = await Notification.find({
      userId: defaultUser.userId,
    });
    expect(notifications.length).toBe(4);
  });
});
