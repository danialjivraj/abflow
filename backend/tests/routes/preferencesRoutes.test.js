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
            it("should update chartPreferences for an existing user", async () => {
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
        });
    });
});
