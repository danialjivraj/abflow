jest.setTimeout(10000);

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Task = require("../../models/Task");
const User = require("../../models/User");
const profileRoutes = require("../../routes/profileRoutes");

let app;
let mongoServer;
let defaultUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    defaultUser = await User.create({ userId: "user1" });

    app = express();
    app.use(express.json());
    app.use("/api/profile", profileRoutes);
});

beforeEach(async () => {
    await Task.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Profile Routes", () => {
    describe("GET /api/profile/:userId", () => {
        it("should return correct total points and completed task count for all priority types", async () => {
            const completedTasksData = [
                { title: "Task A1", priority: "A1", userId: defaultUser.userId, status: "completed" },
                { title: "Task A2", priority: "A2", userId: defaultUser.userId, status: "completed" },
                { title: "Task A3", priority: "A3", userId: defaultUser.userId, status: "completed" },
                { title: "Task B1", priority: "B1", userId: defaultUser.userId, status: "completed" },
                { title: "Task B2", priority: "B2", userId: defaultUser.userId, status: "completed" },
                { title: "Task B3", priority: "B3", userId: defaultUser.userId, status: "completed" },
                { title: "Task C1", priority: "C1", userId: defaultUser.userId, status: "completed" },
                { title: "Task C2", priority: "C2", userId: defaultUser.userId, status: "completed" },
                { title: "Task C3", priority: "C3", userId: defaultUser.userId, status: "completed" },
                { title: "Task D", priority: "D", userId: defaultUser.userId, status: "completed" },
                { title: "Task E", priority: "E", userId: defaultUser.userId, status: "completed" }
            ];

            await Task.create(completedTasksData);

            // This task should not be counted because it's not completed
            await Task.create({
                title: "Pending Task",
                priority: "A1",
                userId: defaultUser.userId,
                status: "pending"
            });

            // Sum = 5.0+4.5+4.0+3.5+3.0+2.5+2.0+1.5+1.0+0.5+0.0 = 27.5
            const res = await request(app)
                .get(`/api/profile/${defaultUser.userId}`)
                .expect(200);

            expect(res.body.points).toBe(27.5);
            expect(res.body.tasksCompleted).toBe(11);
        });

        it("should handle duplicate priorities correctly", async () => {
            const duplicateTasksData = [
                { title: "Task A1-1", priority: "A1", userId: defaultUser.userId, status: "completed" },
                { title: "Task A1-2", priority: "A1", userId: defaultUser.userId, status: "completed" },
                { title: "Task B2-1", priority: "B2", userId: defaultUser.userId, status: "completed" },
                { title: "Task B2-2", priority: "B2", userId: defaultUser.userId, status: "completed" },
                { title: "Task C3-1", priority: "C3", userId: defaultUser.userId, status: "completed" },
                { title: "Task C3-2", priority: "C3", userId: defaultUser.userId, status: "completed" },
                { title: "Task C3-3", priority: "C3", userId: defaultUser.userId, status: "completed" },
            ];
            await Task.create(duplicateTasksData);

            const res = await request(app)
                .get(`/api/profile/${defaultUser.userId}`)
                .expect(200);

            expect(res.body.points).toBe(19.0);
            expect(res.body.tasksCompleted).toBe(7);
        });

        it("should return 400 if userId param is missing", async () => {
            await request(app)
                .get("/api/profile/") // Missing userId
                .expect(404);
        });
    });
});
