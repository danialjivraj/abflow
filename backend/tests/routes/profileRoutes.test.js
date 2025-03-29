jest.setTimeout(10000);

const fs = require("fs");
const path = require("path");
const os = require("os");
const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const tempUploadsDir = path.join(os.tmpdir(), "test-uploads");
process.env.UPLOADS_DIR = tempUploadsDir;

if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true });
} e

const Task = require("../../models/Task");
const User = require("../../models/User");
const profileRoutes = require("../../routes/profileRoutes");

let app;
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    await User.create({ userId: "user1" });

    app = express();
    app.use(express.json());
    app.use("/api/profile", profileRoutes);
});

beforeEach(async () => {
    await Task.deleteMany({});
});

afterEach(() => {
    fs.readdirSync(tempUploadsDir).forEach(file => {
        fs.unlinkSync(path.join(tempUploadsDir, file));
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    fs.rmSync(tempUploadsDir, { recursive: true, force: true });
});

describe("Profile Routes", () => {
    describe("GET /api/profile/user1", () => {
        it("should return correct total points and completed task count for all priority types", async () => {
            const completedTasksData = [
                { title: "Task A1", priority: "A1", userId: "user1", status: "completed", points: 5.0 },
                { title: "Task A2", priority: "A2", userId: "user1", status: "completed", points: 4.5 },
                { title: "Task A3", priority: "A3", userId: "user1", status: "completed", points: 4.0 },
                { title: "Task B1", priority: "B1", userId: "user1", status: "completed", points: 3.5 },
                { title: "Task B2", priority: "B2", userId: "user1", status: "completed", points: 3.0 },
                { title: "Task B3", priority: "B3", userId: "user1", status: "completed", points: 2.5 },
                { title: "Task C1", priority: "C1", userId: "user1", status: "completed", points: 2.0 },
                { title: "Task C2", priority: "C2", userId: "user1", status: "completed", points: 1.5 },
                { title: "Task C3", priority: "C3", userId: "user1", status: "completed", points: 1.0 },
                { title: "Task D", priority: "D", userId: "user1", status: "completed", points: 0.5 },
                { title: "Task E", priority: "E", userId: "user1", status: "completed", points: 0.0 }
            ];

            await Task.create(completedTasksData);

            await Task.create({
                title: "Pending Task",
                priority: "A1",
                userId: "user1",
                status: "pending",
                points: 10
            });

            const res = await request(app)
                .get("/api/profile/user1")
                .expect(200);

            expect(res.body.points).toBe(27.5);
            expect(res.body.tasksCompleted).toBe(11);
        });

        it("should handle duplicate priorities correctly", async () => {
            const duplicateTasksData = [
                { title: "Task A1-1", priority: "A1", userId: "user1", status: "completed", points: 5 },
                { title: "Task A1-2", priority: "A1", userId: "user1", status: "completed", points: 5 },
                { title: "Task B2-1", priority: "B2", userId: "user1", status: "completed", points: 4 },
                { title: "Task B2-2", priority: "B2", userId: "user1", status: "completed", points: 4 },
                { title: "Task C3-1", priority: "C3", userId: "user1", status: "completed", points: 3 },
                { title: "Task C3-2", priority: "C3", userId: "user1", status: "completed", points: 3 },
                { title: "Task C3-3", priority: "C3", userId: "user1", status: "completed", points: 3 }
            ];
            await Task.create(duplicateTasksData);

            const res = await request(app)
                .get("/api/profile/user1")
                .expect(200);

            expect(res.body.points).toBe(27);
            expect(res.body.tasksCompleted).toBe(7);
        });

        it("should return 400 if userId param is missing", async () => {
            await request(app)
                .get("/api/profile/")
                .expect(404);
        });
    });

    describe("PUT /api/profile/updateName/user1", () => {
        it("should update the user name successfully", async () => {
            const newName = "New User Name";
            const res = await request(app)
                .put("/api/profile/updateName/user1")
                .send({ name: newName })
                .expect(200);
            expect(res.body.message).toBe("Name updated successfully");
            expect(res.body.name).toBe(newName);

            const updatedUser = await User.findOne({ userId: "user1" });
            expect(updatedUser.name).toBe(newName);
        });

        it("should return 400 if name is not provided", async () => {
            const res = await request(app)
                .put("/api/profile/updateName/user1")
                .send({ name: "" })
                .expect(400);
            expect(res.body.error).toBe("Name is required");
        });

        it("should return 404 if the user is not found", async () => {
            const res = await request(app)
                .put("/api/profile/updateName/nonexistent")
                .send({ name: "Any Name" })
                .expect(404);
            expect(res.body.error).toBe("User not found");
        });
    });

    describe("POST /api/profile/uploadProfilePicture/user1", () => {
        it("should upload a profile picture successfully and update the user", async () => {
            const fixedTimestamp = 1695673440987;
            const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(fixedTimestamp);

            const res = await request(app)
                .post("/api/profile/uploadProfilePicture/user1")
                .attach("profilePicture", Buffer.from("dummy image content"), "test.jpg")
                .expect(200);

            const expectedFilename = `/uploads/user1-${fixedTimestamp}.jpg`;
            expect(res.body.profilePicture).toEqual(expectedFilename);

            const updatedUser = await User.findOne({ userId: "user1" });
            expect(updatedUser.profilePicture).toEqual(expectedFilename);

            dateNowSpy.mockRestore();
        });

        it("should return 400 if no file is uploaded", async () => {
            const res = await request(app)
                .post("/api/profile/uploadProfilePicture/user1")
                .expect(400);
            expect(res.body.error).toBe("No file uploaded");
        });

        it("should return 404 if the user is not found", async () => {
            const res = await request(app)
                .post("/api/profile/uploadProfilePicture/nonexistent")
                .attach("profilePicture", Buffer.from("dummy image content"), "test.jpg")
                .expect(404);
            expect(res.body.error).toBe("User not found");
        });
    });

    describe("PUT /api/profile/removeProfilePicture/user1", () => {
        it("should remove the profile picture successfully", async () => {
            await User.findOneAndUpdate({ userId: "user1" }, { profilePicture: "/uploads/test.jpg" });
            const res = await request(app)
                .put("/api/profile/removeProfilePicture/user1")
                .expect(200);
            expect(res.body.message).toBe("Profile picture removed");
            expect(res.body.profilePicture).toEqual("");

            const updatedUser = await User.findOne({ userId: "user1" });
            expect(updatedUser.profilePicture).toEqual("");
        });

        it("should return 404 if the user is not found", async () => {
            const res = await request(app)
                .put("/api/profile/removeProfilePicture/nonexistent")
                .expect(404);
            expect(res.body.error).toBe("User not found");
        });
    });
});
