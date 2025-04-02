jest.mock("node-cron", () => ({
  schedule: jest.fn((cronExpression, callback) => {
    callback();
    return { start: jest.fn(), stop: jest.fn() };
  }),
}));

jest.mock("../../scheduler/frequentNotifications", () => ({
  generateFrequentNotifications: jest.fn(),
}));

jest.mock("../../scheduler/weeklyNotifications", () => ({
  generateWeeklyInsights: jest.fn(),
}));

const cron = require("node-cron");
const {
  generateFrequentNotifications,
} = require("../../scheduler/frequentNotifications");
const {
  generateWeeklyInsights,
} = require("../../scheduler/weeklyNotifications");

require("../../scheduler/scheduler");

describe("Scheduler", () => {
  it("should schedule generateFrequentNotifications every 5 seconds", () => {
    expect(cron.schedule).toHaveBeenCalledWith(
      "*/5 * * * * *",
      expect.any(Function),
    );
  });

  it("should schedule generateWeeklyInsights every Monday at 9:00", () => {
    expect(cron.schedule).toHaveBeenCalledWith(
      "0 9 * * 1",
      expect.any(Function),
    );
  });

  it("should call generateFrequentNotifications when its cron job runs", () => {
    expect(generateFrequentNotifications).toHaveBeenCalled();
  });

  it("should call generateWeeklyInsights when its cron job runs", () => {
    expect(generateWeeklyInsights).toHaveBeenCalled();
  });
});
