jest.setTimeout(20000);

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Notification = require("../../models/Notification");
const User = require("../../models/User");
const notificationRoutes = require("../../routes/notificationRoutes");

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
  app.use("/api/notifications", notificationRoutes);
});

beforeEach(async () => {
  await Notification.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Notification Routes", () => {
  // ---------------------------
  // Notifications for a user
  // ---------------------------
  describe("GET /api/notifications/:userId", () => {
    it("should fetch all notifications for a user", async () => {
      const currentDate = new Date();
      await Notification.insertMany([
        {
          userId: defaultUser.userId,
          message: "Notification 1",
          read: false,
          createdAt: new Date(currentDate.getTime() - 1000),
        },
        {
          userId: defaultUser.userId,
          message: "Notification 2",
          read: true,
          createdAt: currentDate,
        },
      ]);

      const res = await request(app)
        .get(`/api/notifications/${defaultUser.userId}`)
        .expect(200);

      expect(res.body.notifications).toHaveLength(2);
      expect(res.body.notifications[0].message).toBe("Notification 2");
      expect(res.body.notifications[1].message).toBe("Notification 1");
    });

    it("should return an empty array if no notifications exist", async () => {
      const res = await request(app)
        .get(`/api/notifications/${defaultUser.userId}`)
        .expect(200);

      expect(res.body.notifications).toHaveLength(0);
    });
  });

  // ---------------------------
  // Create a new notification
  // ---------------------------
  describe("POST /api/notifications", () => {
    it("should create a new notification", async () => {
      const notificationData = {
        userId: defaultUser.userId,
        message: "New Notification",
      };

      const res = await request(app)
        .post("/api/notifications")
        .send(notificationData)
        .expect(200);

      expect(res.body.notification).toHaveProperty("_id");
      expect(res.body.notification.message).toBe("New Notification");
      expect(res.body.notification.userId).toBe(defaultUser.userId);
      expect(res.body.notification.read).toBe(false);
    });

    it("should return 500 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/notifications")
        .send({})
        .expect(500);

      expect(res.body.error).toBe("Failed to create notification");
    });
  });

  // ---------------------------
  // Remove a notification
  // ---------------------------
  describe("DELETE /api/notifications/:notificationId", () => {
    it("should delete a notification by its ID", async () => {
      const notification = await Notification.create({
        userId: defaultUser.userId,
        message: "Delete Me",
      });

      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const deletedNotification = await Notification.findById(notification._id);
      expect(deletedNotification).toBeNull();
    });

    it("should return success even if notification does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------
  // Update read status
  // ---------------------------
  describe("PATCH /api/notifications/:notificationId", () => {
    it("should update a notification's read status", async () => {
      const notification = await Notification.create({
        userId: defaultUser.userId,
        message: "Mark as Read",
        read: false,
      });

      const res = await request(app)
        .patch(`/api/notifications/${notification._id}`)
        .send({ read: true })
        .expect(200);

      expect(res.body.notification.read).toBe(true);
    });

    it("should return 404 if notification is not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/notifications/${fakeId}`)
        .send({ read: true })
        .expect(404);

      expect(res.body.error).toBe("Notification not found");
    });
  });

  // ---------------------------
  // Check soundPlayed
  // ---------------------------
  describe("SoundPlayed Field", () => {
    it("should default to false when a notification is created", async () => {
      const notificationData = {
        userId: defaultUser.userId,
        message: "Test Notification",
      };

      const res = await request(app)
        .post("/api/notifications")
        .send(notificationData)
        .expect(200);

      expect(res.body.notification.soundPlayed).toBe(false);
    });

    it("should update the soundPlayed field", async () => {
      // Create a notification with the default soundPlayed (false)
      const notification = await Notification.create({
        userId: defaultUser.userId,
        message: "Test Notification",
      });

      // Update the notification's soundPlayed field to true
      const res = await request(app)
        .patch(`/api/notifications/${notification._id}`)
        .send({ soundPlayed: true })
        .expect(200);

      expect(res.body.notification.soundPlayed).toBe(true);
    });
  });
});
