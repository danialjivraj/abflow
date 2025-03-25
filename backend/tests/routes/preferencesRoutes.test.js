jest.setTimeout(60000);

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const preferencesRoutes = require("../../routes/preferencesRoutes");

let app;
let mongoServer;
let defaultUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use("/api/preferences", preferencesRoutes);
});

beforeEach(async () => {
  await User.deleteMany({});
  defaultUser = await User.create({ userId: "user1" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Preferences Routes", () => {
  describe("Chart Preferences", () => {
    // ---------------------------
    // Get Chart Preferences for a User
    // ---------------------------
    describe("GET /api/preferences/:userId", () => {
      it("should return chartPreferences for an existing user", async () => {
        const res = await request(app)
          .get(`/api/preferences/${defaultUser.userId}`)
          .expect(200);

        expect(res.body.chartPreferences).toBeDefined();
      });

      it("should return 404 if the user is not found", async () => {
        const res = await request(app)
          .get("/api/preferences/nonexistentUser")
          .expect(404);

        expect(res.body.error).toBe("User not found");
      });
    });

    // ---------------------------
    // Update Chart Preferences for a User
    // ---------------------------
    describe("PUT /api/preferences/:userId", () => {
      it("should update chartPreferences for an existing user (partial update)", async () => {
        const newPrefs = {
          chartType: "bar",
          xAxisField: "status",
          yAxisMetric: "count",
        };

        const res = await request(app)
          .put(`/api/preferences/${defaultUser.userId}`)
          .send({ chartPreferences: newPrefs })
          .expect(200);

        expect(res.body.chartPreferences).toMatchObject(newPrefs);
      });

      it("should create a new user with provided chartPreferences if the user does not exist", async () => {
        const newPrefs = { chartType: "line" };
        const newUserId = "newUser456";

        const res = await request(app)
          .put(`/api/preferences/${newUserId}`)
          .send({ chartPreferences: newPrefs })
          .expect(200);

        expect(res.body.chartPreferences).toMatchObject(newPrefs);
      });

      it("should return 400 if chartPreferences are not provided", async () => {
        const res = await request(app)
          .put(`/api/preferences/${defaultUser.userId}`)
          .send({})
          .expect(400);

        expect(res.body.error).toBe("No preferences provided");
      });

      it("should update chartPreferences with all fields", async () => {
        const newChartPrefs = {
          timeRangeType: "month",
          taskType: "completed",
          chartType: "line",
          xAxisField: "priority",
          yAxisMetric: "timeSpent",
          sortOrder: "asc",
          dueFilter: "overdue",
          priorityFilters: ["A1", "B1"],
          dayOfWeekFilters: ["Monday", "Friday"],
          statusFilters: ["In Progress", "Done"],
          assignedToFilter: "user123",
          minTaskCount: "10",
          minStoryPoints: "20",
          minTimeSpent: "30",
          minTimeUnit: "hours",
          scheduledOnly: true,
          includeZeroMetrics: false,
          includeNoDueDate: false,
          comparisonMode: true,
          compStartDate: "2020-01-01T00:00:00.000Z",
          compEndDate: "2020-12-31T23:59:59.000Z",
          customStartDate: "2021-01-01T00:00:00.000Z",
          customEndDate: "2021-12-31T23:59:59.000Z"
        };

        const res = await request(app)
          .put(`/api/preferences/${defaultUser.userId}`)
          .send({ chartPreferences: newChartPrefs })
          .expect(200);

        expect(res.body.chartPreferences).toEqual(newChartPrefs);
      });

      it("should return 500 when invalid chartPreferences data is provided", async () => {
        const invalidChartPrefs = {
          chartType: "invalidChartType",
          xAxisField: "status",
          yAxisMetric: "count",
        };

        const res = await request(app)
          .put(`/api/preferences/${defaultUser.userId}`)
          .send({ chartPreferences: invalidChartPrefs })
          .expect(500);

        expect(res.body.error).toBe("Failed to update user preferences");
      });
    });
  });

  describe("Settings Preferences", () => {
    const newSettings = {
      darkMode: false,
      muteNotifications: true,
      inactivityTimeoutHours: 2,
      inactivityTimeoutNever: true,
      defaultPriority: "B1",
      hideOldCompletedTasksDays: 365,
      hideOldCompletedTasksNever: true,
      defaultBoardView: "schedule",
      disableToCreateTask: false,
      confirmBeforeDeleteBoard: true,
      confirmBeforeDeleteTask: true,
      notifyNonPriorityGoesOvertime: 2,
      notifyScheduledTaskIsDue: 30,
      priorityColours: {
        A1: "#ff4d4d",
        A2: "#ff6666",
        A3: "#ff9999",
        B1: "#4d4dff",
        B2: "#6666ff",
        B3: "#9999ff",
        C1: "#4dff4d",
        C2: "#66ff66",
        C3: "#99ff99",
        D: "#cc66ff",
        E: "#ff9966",
      },
      themeAccent: "Green",
      themeAccentCustom: "",
      topbarAccent: "Blue",
      topbarAccentCustom: ""
    };

    // ---------------------------
    // Get Settings Preferences for a User
    // ---------------------------
    describe("GET /api/preferences/:userId", () => {
      it("should return settingsPreferences for an existing user", async () => {
        defaultUser.settingsPreferences = newSettings;
        await defaultUser.save();

        const res = await request(app)
          .get(`/api/preferences/${defaultUser.userId}`)
          .expect(200);

        expect(res.body.settingsPreferences).toEqual(newSettings);
      });
    });

    // ---------------------------
    // Update Settings Preferences for a User
    // ---------------------------
    describe("PUT /api/preferences/:userId", () => {
      it("should update settingsPreferences for an existing user", async () => {
        const res = await request(app)
          .put(`/api/preferences/${defaultUser.userId}`)
          .send({ settingsPreferences: newSettings })
          .expect(200);

        expect(res.body.settingsPreferences).toEqual(newSettings);
      });

      it("should create a new user with provided settingsPreferences if the user does not exist", async () => {
        const newUserId = "newUserSettings";

        const res = await request(app)
          .put(`/api/preferences/${newUserId}`)
          .send({ settingsPreferences: newSettings })
          .expect(200);

        expect(res.body.settingsPreferences).toEqual(newSettings);
      });

      it("should return 500 when invalid settingsPreferences data is provided", async () => {
        const invalidSettings = { ...newSettings, defaultPriority: "invalidPriority" };

        const res = await request(app)
          .put(`/api/preferences/${defaultUser.userId}`)
          .send({ settingsPreferences: invalidSettings })
          .expect(500);

        expect(res.body.error).toBe("Failed to update user preferences");
      });
    });
  });
});
