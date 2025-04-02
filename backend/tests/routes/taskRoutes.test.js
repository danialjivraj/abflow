jest.setTimeout(10000);

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
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe("user1");
      expect(res.body.status).toBe("pending");
      expect(res.body.description).toBe("Test description");
      expect(res.body.points).toBe(5);
      // other fields
      expect(res.body.order).toBe(0);
      expect(res.body.labels).toEqual([]);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
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
      const task1 = await Task.create({
        title: "Task 1",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        description: "First task",
        order: 2,
        points: 3,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const task2 = await Task.create({
        title: "Task 2",
        priority: "B1",
        userId: defaultUser.userId,
        status: "in-progress",
        description: "Second task",
        order: 1,
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const res = await request(app)
        .get(`/api/tasks/${defaultUser.userId}`)
        .expect(200);

      expect(res.body.length).toBe(2);

      expect(res.body[0].order).toBe(1);
      expect(res.body[1].order).toBe(2);

      // first task (task2)
      expect(res.body[0].title).toBe("Task 2");
      expect(res.body[0].priority).toBe("B1");
      expect(res.body[0].userId).toBe(defaultUser.userId);
      expect(res.body[0].status).toBe("in-progress");
      expect(res.body[0].description).toBe("Second task");
      expect(res.body[0].points).toBe(5);
      expect(res.body[0].labels).toEqual([]);
      expect(res.body[0].scheduledStart).toBeNull();
      expect(res.body[0].scheduledEnd).toBeNull();

      // second task (task1)
      expect(res.body[1].title).toBe("Task 1");
      expect(res.body[1].priority).toBe("A1");
      expect(res.body[1].userId).toBe(defaultUser.userId);
      expect(res.body[1].status).toBe("pending");
      expect(res.body[1].description).toBe("First task");
      expect(res.body[1].points).toBe(3);
      expect(res.body[1].labels).toEqual([]);
      expect(res.body[1].scheduledStart).toBeNull();
      expect(res.body[1].scheduledEnd).toBeNull();
    });

    it("should return 400 if userId is missing", async () => {
      await request(app).get(`/api/tasks/`).expect(404);
    });
  });

  // ---------------------------
  // Edit a task
  // ---------------------------
  describe("PUT /api/tasks/:id/edit", () => {
    it("should update a task and return the updated task", async () => {
      const originalTask = await Task.create({
        title: "Original Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "Original description",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const updatedData = {
        title: "Updated Task",
        priority: "B1",
        status: "completed",
        order: 1,
        description: "Updated description",
      };

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/edit`)
        .send(updatedData)
        .expect(200);

      expect(res.body.title).toBe("Updated Task");
      expect(res.body.priority).toBe("B1");
      expect(res.body.status).toBe("completed");
      expect(res.body.order).toBe(1);
      expect(res.body.description).toBe("Updated description");
      // other fields
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
    });

    it("should update a task's labels", async () => {
      const originalTask = await Task.create({
        title: "Task with labels",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "Label test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const updatedData = {
        title: "Task with updated labels",
        labels: [
          { title: "Urgent", color: "#ff0000" },
          { title: "Bug", color: "#00ff00" },
        ],
      };

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/edit`)
        .send(updatedData)
        .expect(200);

      expect(res.body.labels).toHaveLength(2);
      expect(res.body.labels[0].title).toBe("Urgent");
      expect(res.body.labels[0].color).toBe("#ff0000");
      expect(res.body.labels[1].title).toBe("Bug");
      expect(res.body.labels[1].color).toBe("#00ff00");
      // other fields
      expect(res.body.title).toBe("Task with updated labels");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.status).toBe("pending");
      expect(res.body.order).toBe(0);
      expect(res.body.description).toBe("Label test");
      expect(res.body.points).toBe(5);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
    });
  });

  // ---------------------------
  // Update task schedule
  // ---------------------------
  describe("PATCH /api/tasks/:id/schedule", () => {
    it("should update scheduledStart and scheduledEnd for a task", async () => {
      const originalTask = await Task.create({
        title: "Scheduled Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        description: "Schedule test",
        order: 0,
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const scheduleData = {
        scheduledStart: "2025-04-01T10:00:00.000Z",
        scheduledEnd: "2025-04-01T11:00:00.000Z",
      };

      const res = await request(app)
        .patch(`/api/tasks/${originalTask._id}/schedule`)
        .send(scheduleData)
        .expect(200);

      expect(new Date(res.body.scheduledStart).toISOString()).toBe(
        scheduleData.scheduledStart,
      );
      expect(new Date(res.body.scheduledEnd).toISOString()).toBe(
        scheduleData.scheduledEnd,
      );
      // other fields
      expect(res.body.title).toBe("Scheduled Task");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.status).toBe("pending");
      expect(res.body.description).toBe("Schedule test");
      expect(res.body.order).toBe(0);
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
    });
  });

  // ---------------------------
  // Move a task (update status and order)
  // ---------------------------
  describe("PUT /api/tasks/:id/move", () => {
    it("should update a task's status and order", async () => {
      const originalTask = await Task.create({
        title: "Movable Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "Move test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const moveData = {
        status: "inprogress",
        order: 2,
      };

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/move`)
        .send(moveData)
        .expect(200);

      expect(res.body.status).toBe("inprogress");
      expect(res.body.order).toBe(2);
      // other fields
      expect(res.body.title).toBe("Movable Task");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.description).toBe("Move test");
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
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
        description: "Reorder test 1",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });
      const task2 = await Task.create({
        title: "Task 2",
        priority: "B1",
        userId: defaultUser.userId,
        status: "pending",
        order: 1,
        description: "Reorder test 2",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
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

      const tasks = await Task.find({ userId: defaultUser.userId }).sort({
        order: 1,
      });
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
      const originalTask = await Task.create({
        title: "Task to Archive",
        priority: "A1",
        userId: defaultUser.userId,
        status: "completed",
        order: 0,
        description: "Archive test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/archive`)
        .expect(200);

      expect(res.body.status).toBe("archived");
      // other fields
      expect(res.body.title).toBe("Task to Archive");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.order).toBe(0);
      expect(res.body.description).toBe("Archive test");
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
    });
  });

  // ---------------------------
  // Duplicate a task
  // ---------------------------
  it("should duplicate a task in the middle and shift subsequent tasks", async () => {
    const createdTasks = [];
    for (let i = 0; i < 6; i++) {
      const taskData = {
        title: `Existing Task ${i + 1}`,
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: i,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [],
      };
      if (i === 2) {
        taskData.labels = [{ title: "Test Label", color: "#123456" }];
      }
      const task = await Task.create(taskData);
      createdTasks.push(task);
    }

    // Duplicate task 3 (index 2)
    const duplicateData = {
      title: "Duplicate of Task 3",
      priority: "A1",
      userId: defaultUser.userId,
      status: "pending",
      order: createdTasks[2].order + 1,
      description: "",
      storyPoints: 0,
      scheduledStart: null,
      scheduledEnd: null,
      labels: createdTasks[2].labels,
    };

    const res = await request(app)
      .post("/api/tasks")
      .send(duplicateData)
      .expect(201);

    // duplicate task fields
    expect(res.body.title).toBe("Duplicate of Task 3");
    expect(res.body.priority).toBe("A1");
    expect(res.body.userId).toBe(defaultUser.userId);
    expect(res.body.status).toBe("pending");
    expect(res.body.order).toBe(3);
    expect(res.body.description).toBe("");
    expect(res.body.storyPoints).toBe(0);
    expect(res.body.scheduledStart).toBeNull();
    expect(res.body.scheduledEnd).toBeNull();
    expect(res.body.labels).toHaveLength(1);
    expect(res.body.labels[0].title).toBe("Test Label");
    expect(res.body.labels[0].color).toBe("#123456");

    const tasksAfter = await Task.find({
      userId: defaultUser.userId,
      status: "pending",
    })
      .sort({ order: 1 })
      .lean();

    expect(tasksAfter).toHaveLength(7);

    const expectedTasks = [
      {
        title: "Existing Task 1",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [],
      },
      {
        title: "Existing Task 2",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 1,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [],
      },
      {
        title: "Existing Task 3",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 2,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [{ title: "Test Label", color: "#123456" }],
      },
      {
        title: "Duplicate of Task 3",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 3,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [{ title: "Test Label", color: "#123456" }],
      },
      {
        title: "Existing Task 4",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 4,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [],
      },
      {
        title: "Existing Task 5",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 5,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [],
      },
      {
        title: "Existing Task 6",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 6,
        description: "",
        storyPoints: 0,
        scheduledStart: null,
        scheduledEnd: null,
        labels: [],
      },
    ];

    expectedTasks.forEach((expected, index) => {
      const actual = tasksAfter[index];
      expect(actual.title).toBe(expected.title);
      expect(actual.priority).toBe(expected.priority);
      expect(actual.userId).toBe(expected.userId);
      expect(actual.status).toBe(expected.status);
      expect(actual.order).toBe(expected.order);
      expect(actual.description).toBe(expected.description);
      expect(actual.storyPoints).toBe(expected.storyPoints);
      expect(actual.scheduledStart).toBeNull();
      expect(actual.scheduledEnd).toBeNull();
      const actualLabels = actual.labels.map((label) => ({
        title: label.title,
        color: label.color,
      }));
      expect(actualLabels).toEqual(expected.labels);
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
        order: 0,
        description: "Delete test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
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
      const originalTask = await Task.create({
        title: "Timer Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "Timer start test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/start-timer`)
        .expect(200);

      expect(res.body.isTimerRunning).toBe(true);
      expect(res.body.timerStartTime).toBeTruthy();
      // other fields
      expect(res.body.title).toBe("Timer Task");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.status).toBe("pending");
      expect(res.body.order).toBe(0);
      expect(res.body.description).toBe("Timer start test");
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
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
      const originalTask = await Task.create({
        title: "Timer Task",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "Timer stop test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
        isTimerRunning: true,
        timerStartTime: new Date(Date.now() - 60 * 1000),
        timeSpent: 0,
      });

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/stop-timer`)
        .expect(200);

      expect(res.body.isTimerRunning).toBe(false);
      expect(res.body.timerStartTime).toBeNull();
      expect(res.body.timeSpent).toBeGreaterThanOrEqual(60);
      // other fields
      expect(res.body.title).toBe("Timer Task");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.status).toBe("pending");
      expect(res.body.order).toBe(0);
      expect(res.body.description).toBe("Timer stop test");
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
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
      const originalTask = await Task.create({
        title: "Task to Complete",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "Complete test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
      });

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/complete`)
        .expect(200);

      expect(res.body.status).toBe("completed");
      expect(res.body.taskCompleted).toBe(true);
      expect(res.body.completedAt).toBeTruthy();
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
      // other fields
      expect(res.body.title).toBe("Task to Complete");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.order).toBe(0);
      expect(res.body.description).toBe("Complete test");
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
    });
  });

  // ---------------------------
  // Update notification flags for a task
  // ---------------------------
  describe("PUT /api/tasks/:id/reset-notification-flags", () => {
    it("should update notification flags for a task", async () => {
      const originalTask = await Task.create({
        title: "Task for Flags",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        order: 0,
        description: "Notification test",
        points: 5,
        labels: [],
        scheduledStart: null,
        scheduledEnd: null,
        notifiedUpcoming: true,
        notifiedOverdue: true,
      });

      const res = await request(app)
        .put(`/api/tasks/${originalTask._id}/reset-notification-flags`)
        .send({ notifiedUpcoming: false, notifiedOverdue: false })
        .expect(200);

      expect(res.body.notifiedUpcoming).toBe(false);
      expect(res.body.notifiedOverdue).toBe(false);
      // other fields
      expect(res.body.title).toBe("Task for Flags");
      expect(res.body.priority).toBe("A1");
      expect(res.body.userId).toBe(defaultUser.userId);
      expect(res.body.status).toBe("pending");
      expect(res.body.order).toBe(0);
      expect(res.body.description).toBe("Notification test");
      expect(res.body.points).toBe(5);
      expect(res.body.labels).toEqual([]);
      expect(res.body.scheduledStart).toBeNull();
      expect(res.body.scheduledEnd).toBeNull();
    });
  });
});
