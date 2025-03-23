jest.setTimeout(60000);

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Task = require("../../models/Task");
const User = require("../../models/User");
const taskRoutes = require("../../routes/taskRoutes");

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
  app.use("/api/tasks", taskRoutes);
});

beforeEach(async () => {
  await Task.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Task Routes", () => {
  // ---------------------------
  // Create a new task
  // ---------------------------
  describe("POST /api/tasks", () => {
    it("should create a new task and return 201", async () => {
      const taskData = {
        title: "Test Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        description: "Test description",
      };

      const res = await request(app)
        .post("/api/tasks")
        .send(taskData)
        .expect(201);
      
      expect(res.body).toHaveProperty("_id");
      expect(res.body.title).toBe("Test Task");
      expect(res.body.points).toBe(5);
    });

    it("should return 400 if required fields are missing", async () => {
      const taskData = {
        title: "Missing Fields Task",
        userId: defaultUser.userId,
      };
      const res = await request(app)
        .post("/api/tasks")
        .send(taskData)
        .expect(400);
      
      expect(res.body.error).toBe("All fields are required");
    });
  });

  // ---------------------------
  // Fetch tasks for a user
  // ---------------------------
  describe("GET /api/tasks/:userId", () => {
    it("should return tasks sorted by order", async () => {
      await Task.create({
        title: "Task 1",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 2,
      });
      await Task.create({
        title: "Task 2",
        priority: "B1",
        userId: defaultUser.userId,
        status: "pending",
        order: 1,
      });

      const res = await request(app)
        .get(`/api/tasks/${defaultUser.userId}`)
        .expect(200);
      
      expect(res.body.length).toBe(2);
      expect(res.body[0].order).toBe(1);
      expect(res.body[1].order).toBe(2);
    });

    it("should return 400 if userId is missing", async () => {
      await request(app)
        .get(`/api/tasks/`)
        .expect(404);
    });
  });

  // ---------------------------
  // Edit a task
  // ---------------------------
  describe("PUT /api/tasks/:id/edit", () => {
    it("should update a task and return the updated task", async () => {
      const task = await Task.create({
        title: "Original Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
      });

      const updatedData = {
        title: "Updated Task",
        priority: "B1",
        status: "completed",
        order: 1,
        description: "Updated description",
      };

      const res = await request(app)
        .put(`/api/tasks/${task._id}/edit`)
        .send(updatedData)
        .expect(200);

      expect(res.body.title).toBe("Updated Task");
      expect(res.body.priority).toBe("B1");
      expect(res.body.order).toBe(1);
      expect(res.body.description).toBe("Updated description");
    });
  });

  // ---------------------------
  // Update task schedule
  // ---------------------------
  describe("PATCH /api/tasks/:id/schedule", () => {
    it("should update scheduledStart and scheduledEnd for a task", async () => {
      const task = await Task.create({
        title: "Scheduled Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
      });

      const scheduleData = {
        scheduledStart: "2025-04-01T10:00:00.000Z",
        scheduledEnd: "2025-04-01T11:00:00.000Z",
      };

      const res = await request(app)
        .patch(`/api/tasks/${task._id}/schedule`)
        .send(scheduleData)
        .expect(200);

      expect(new Date(res.body.scheduledStart).toISOString()).toBe(scheduleData.scheduledStart);
      expect(new Date(res.body.scheduledEnd).toISOString()).toBe(scheduleData.scheduledEnd);
    });
  });

  // ---------------------------
  // Move a task (update status and order)
  // ---------------------------
  describe("PUT /api/tasks/:id/move", () => {
    it("should update a task's status and order", async () => {
      const task = await Task.create({
        title: "Movable Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
      });

      const moveData = {
        status: "inprogress",
        order: 2,
      };

      const res = await request(app)
        .put(`/api/tasks/${task._id}/move`)
        .send(moveData)
        .expect(200);

      expect(res.body.status).toBe("inprogress");
      expect(res.body.order).toBe(2);
    });
  });

  // ---------------------------
  // Reorder multiple tasks
  // ---------------------------
  describe("PUT /api/tasks/reorder", () => {
    it("should reorder tasks successfully", async () => {
      const task1 = await Task.create({
        title: "Task 1",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
      });
      const task2 = await Task.create({
        title: "Task 2",
        priority: "B1",
        userId: defaultUser.userId,
        status: "pending",
        order: 1,
      });

      const newOrders = [
        { _id: task1._id, order: 1, status: "pending" },
        { _id: task2._id, order: 0, status: "pending" },
      ];

      const res = await request(app)
        .put("/api/tasks/reorder")
        .send({ tasks: newOrders })
        .expect(200);

      expect(res.body.message).toBe("Tasks reordered successfully");

      const tasks = await Task.find({ userId: defaultUser.userId }).sort({ order: 1 });
      expect(tasks[0].order).toBe(0);
      expect(tasks[1].order).toBe(1);
    });

    it("should return 400 if tasks data is invalid", async () => {
      const res = await request(app)
        .put("/api/tasks/reorder")
        .send({ tasks: "not an array" })
        .expect(400);
      expect(res.body.error).toBe("Invalid tasks data");
    });
  });

  // ---------------------------
  // Archive a task
  // ---------------------------
  describe("PUT /api/tasks/:id/archive", () => {
    it("should archive a task", async () => {
      const task = await Task.create({
        title: "Task to Archive",
        priority: "A1",
        userId: defaultUser.userId,
        status: "completed",
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}/archive`)
        .expect(200);

      expect(res.body.status).toBe("archived");
    });
  });

  // ---------------------------
  // Delete a task
  // ---------------------------
  describe("DELETE /api/tasks/:id", () => {
    it("should delete a task", async () => {
      const task = await Task.create({
        title: "Task to Delete",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
      });

      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .expect(200);

      expect(res.body.message).toBe("Task deleted");

      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });
  });

  // ---------------------------
  // Start timer for a task
  // ---------------------------
  describe("PUT /api/tasks/:id/start-timer", () => {
    it("should start the timer for a task", async () => {
      const task = await Task.create({
        title: "Timer Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}/start-timer`)
        .expect(200);

      expect(res.body.isTimerRunning).toBe(true);
      expect(res.body.timerStartTime).toBeTruthy();
    });

    it("should return 404 if task not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/tasks/${fakeId}/start-timer`)
        .expect(404);
      expect(res.body.error).toBe("Task not found");
    });
  });

  // ---------------------------
  // Stop timer for a task
  // ---------------------------
  describe("PUT /api/tasks/:id/stop-timer", () => {
    it("should stop the timer for a running task", async () => {
      const task = await Task.create({
        title: "Timer Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        isTimerRunning: true,
        timerStartTime: new Date(Date.now() - 60 * 1000), // started 1 minute ago
        timeSpent: 0,
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}/stop-timer`)
        .expect(200);

      expect(res.body.isTimerRunning).toBe(false);
      expect(res.body.timerStartTime).toBeNull();
      expect(res.body.timeSpent).toBeGreaterThanOrEqual(60);
    });

    it("should return 404 if task not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/tasks/${fakeId}/stop-timer`)
        .expect(404);
      expect(res.body.error).toBe("Task not found");
    });
  });

  // ---------------------------
  // Mark a task as completed
  // ---------------------------
  describe("PUT /api/tasks/:id/complete", () => {
    it("should mark a task as completed", async () => {
      const task = await Task.create({
        title: "Task to Complete",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}/complete`)
        .expect(200);

      expect(res.body.status).toBe("completed");
      expect(res.body.taskCompleted).toBe(true);
      expect(res.body.completedAt).toBeTruthy();
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
    });
  });

  // ---------------------------
  // Update notification flags for a task
  // ---------------------------
  describe("PUT /api/tasks/:id/reset-notification-flags", () => {
    it("should update notification flags for a task", async () => {
      const task = await Task.create({
        title: "Task for Flags",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        notifiedUpcoming: true,
        notifiedOverdue: true,
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}/reset-notification-flags`)
        .send({ notifiedUpcoming: false, notifiedOverdue: false })
        .expect(200);

      expect(res.body.notifiedUpcoming).toBe(false);
      expect(res.body.notifiedOverdue).toBe(false);
    });
  });
});
