jest.setTimeout(10000);

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const chartRoutes = require("../../routes/chartRoutes");

// Full default chartPreferences from the User schema.
const defaultChartPreferences = {
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
    labelFilters: [],
    includeNoneLabel: true,
    includeZeroMetrics: true,
    includeNoDueDate: true,
    comparisonMode: false,
    compStartDate: null,
    compEndDate: null,
    customStartDate: null,
    customEndDate: null,
};

let app;
let mongoServer;
let defaultUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use("/api/charts", chartRoutes);
});

beforeEach(async () => {
    await User.deleteMany({});
    defaultUser = await User.create({ userId: "user1" });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Chart Routes", () => {
    // ---------------------------
    // Save/Update Chart Preferences
    // ---------------------------
    describe("POST /api/charts/chart-preferences", () => {
        it("should update chart preferences for an existing user with a complete preferences object", async () => {
            const initialRes = await request(app)
                .get(`/api/charts/chart-preferences/${defaultUser.userId}`)
                .expect(200);
            expect(initialRes.body).toEqual(defaultChartPreferences);

            const newPrefs = {
                timeRangeType: "custom",
                taskType: "completed",
                chartType: "line",
                xAxisField: "priority",
                yAxisMetric: "storyPoints",
                sortOrder: "asc",
                dueFilter: "due",
                priorityFilters: ["A1", "B2"],
                dayOfWeekFilters: ["Monday", "Friday"],
                statusFilters: ["completed"],
                assignedToFilter: "John Doe",
                minTaskCount: "5",
                minStoryPoints: "3",
                minTimeSpent: "60",
                minTimeUnit: "minutes",
                scheduledOnly: true,
                labelFilters: ["Bugs", "Backend"],
                includeNoneLabel: false,
                includeZeroMetrics: false,
                includeNoDueDate: false,
                comparisonMode: true,
                compStartDate: "2023-01-01T00:00:00.000Z",
                compEndDate: "2023-01-31T23:59:59.999Z",
                customStartDate: "2023-02-01T00:00:00.000Z",
                customEndDate: "2023-02-28T23:59:59.999Z",
            };

            const res = await request(app)
                .post("/api/charts/chart-preferences")
                .send({ userId: defaultUser.userId, ...newPrefs })
                .expect(200);

            // Compare the entire chartPreferences object exactly
            expect(res.body.chartPreferences).toEqual(newPrefs);
        });

        it("should create a new user with chart preferences if user does not exist (complete object)", async () => {
            const newPrefs = {
                timeRangeType: "week",
                taskType: "active",
                chartType: "pie", // override default ("bar")
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
                labelFilters: ["Bugs", "Backend"],
                includeNoneLabel: false,
                includeNoDueDate: true,
                comparisonMode: false,
                compStartDate: null,
                compEndDate: null,
                customStartDate: null,
                customEndDate: null,
            };

            const newUserId = "newUser123";
            const res = await request(app)
                .post("/api/charts/chart-preferences")
                .send({ userId: newUserId, ...newPrefs })
                .expect(200);

            expect(res.body.userId).toBe(newUserId);
            expect(res.body.chartPreferences).toEqual(newPrefs);
        });

        it("should return 400 if userId is not provided", async () => {
            const res = await request(app)
                .post("/api/charts/chart-preferences")
                .send({ chartType: "bar" })
                .expect(400);

            expect(res.body.error).toBe("User ID is required");
        });

        // ---------------------------
        // Validation Tests for Enum Fields
        // ---------------------------
        it("should return 500 if an invalid dayOfWeekFilters value is provided", async () => {
            const invalidPrefs = {
                ...defaultChartPreferences,
                dayOfWeekFilters: ["Funday"], // invalid day
            };

            const res = await request(app)
                .post("/api/charts/chart-preferences")
                .send({ userId: defaultUser.userId, ...invalidPrefs })
                .expect(500);

            expect(res.body.error).toBe("Failed to save chart preferences");
        });

        it("should return 500 if an invalid priorityFilters value is provided", async () => {
            const invalidPrefs = {
                ...defaultChartPreferences,
                priorityFilters: ["Z1"], // invalid priority
            };

            const res = await request(app)
                .post("/api/charts/chart-preferences")
                .send({ userId: defaultUser.userId, ...invalidPrefs })
                .expect(500);

            expect(res.body.error).toBe("Failed to save chart preferences");
        });

        // ---------------------------
        // Extra Fields Test
        // ---------------------------
        it("should ignore extra fields not defined in the schema", async () => {
            const prefsWithExtra = {
                ...defaultChartPreferences,
                chartType: "line",
                extraField: "shouldBeIgnored",
            };

            const res = await request(app)
                .post("/api/charts/chart-preferences")
                .send({ userId: defaultUser.userId, ...prefsWithExtra })
                .expect(200);

            // The returned chartPreferences should not have extraField.
            expect(res.body.chartPreferences).toEqual({
                ...defaultChartPreferences,
                chartType: "line",
            });
        });

        // ---------------------------
        // Partial Update Test
        // ---------------------------
        it("should merge chart preferences when a partial object is provided", async () => {
            const partialPrefs = {
                chartType: "line",
            };

            const res = await request(app)
                .post("/api/charts/chart-preferences")
                .send({ userId: defaultUser.userId, ...partialPrefs })
                .expect(200);

            expect(res.body.chartPreferences).toEqual({
                ...defaultChartPreferences,
                chartType: "line",
            });
        });
    });

    // ---------------------------
    // Retrieve Chart Preferences
    // ---------------------------
    describe("GET /api/charts/chart-preferences/:userId", () => {
        it("should return the default chart preferences for an existing user", async () => {
            const res = await request(app)
                .get(`/api/charts/chart-preferences/${defaultUser.userId}`)
                .expect(200);

            expect(res.body).toEqual(defaultChartPreferences);
        });

        it("should return an empty object if user is not found", async () => {
            const res = await request(app)
                .get("/api/charts/chart-preferences/nonexistentUser")
                .expect(200);

            expect(res.body).toEqual({});
        });
    });
});
