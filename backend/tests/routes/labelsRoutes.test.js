jest.setTimeout(20000);

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Task = require("../../models/Task");
const labelsRoutes = require("../../routes/labelsRoutes");

let app;
let mongoServer;
let defaultUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  defaultUser = await User.create({ userId: "user1", labels: [] });

  app = express();
  app.use(express.json());
  app.use("/api/labels", labelsRoutes);
});

beforeEach(async () => {
  await Task.deleteMany({});
  defaultUser = await User.findOne({ userId: "user1" });
  defaultUser.labels = [];
  await defaultUser.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Labels Routes", () => {
  // ---------------------------
  // Fetch labels for a user
  // ---------------------------
  describe("GET /api/labels/:userId", () => {
    it("should return sorted labels for a valid user", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [
        { title: "Bug", color: "#ff0000", order: 2 },
        { title: "Feature", color: "#00ff00", order: 0 },
        { title: "Urgent", color: "#0000ff", order: 1 },
      ];
      await user.save();

      const res = await request(app)
        .get(`/api/labels/${defaultUser.userId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
      expect(res.body[0].title).toBe("Feature");
      expect(res.body[1].title).toBe("Urgent");
      expect(res.body[2].title).toBe("Bug");
    });

    it("should return 404 if user not found", async () => {
      await request(app).get("/api/labels/nonexistentUser").expect(404);
    });
  });

  // ---------------------------
  // Create a new label
  // ---------------------------
  describe("POST /api/labels/:userId", () => {
    it("should create a new label and return 201", async () => {
      const labelData = {
        title: "New Label",
        color: "#abcdef",
      };

      const res = await request(app)
        .post(`/api/labels/${defaultUser.userId}`)
        .send(labelData)
        .expect(201);

      expect(res.body.title).toBe("New Label");
      expect(res.body.color).toBe("#abcdef");
      expect(res.body.order).toBe(0);

      const userAfter = await User.findOne({ userId: defaultUser.userId });
      expect(userAfter.labels).toHaveLength(1);
    });

    it("should return 400 if title or color is missing", async () => {
      const labelData = { title: "Incomplete Label" };
      const res = await request(app)
        .post(`/api/labels/${defaultUser.userId}`)
        .send(labelData)
        .expect(400);

      expect(res.body.error).toBe("Field cannot be empty.");
    });

    it("should return 400 if title is an empty string", async () => {
      const labelData = { title: "   ", color: "#123456" };
      const res = await request(app)
        .post(`/api/labels/${defaultUser.userId}`)
        .send(labelData)
        .expect(400);

      expect(res.body.error).toBe("Field cannot be empty.");
    });

    it("should return 400 if color is an empty string", async () => {
      const labelData = { title: "Non-empty", color: "   " };
      const res = await request(app)
        .post(`/api/labels/${defaultUser.userId}`)
        .send(labelData)
        .expect(400);

      expect(res.body.error).toBe("Field cannot be empty.");
    });

    it("should return 404 if user not found", async () => {
      const labelData = { title: "Label", color: "#123456" };
      await request(app)
        .post(`/api/labels/nonexistentUser`)
        .send(labelData)
        .expect(404);
    });

    it("should return 400 if a label with the same title already exists", async () => {
      const labelData = { title: "Duplicate", color: "#111111" };
      await request(app)
        .post(`/api/labels/${defaultUser.userId}`)
        .send(labelData)
        .expect(201);

      const duplicateLabelData = { title: "duplicate", color: "#222222" };
      const res = await request(app)
        .post(`/api/labels/${defaultUser.userId}`)
        .send(duplicateLabelData)
        .expect(400);

      expect(res.body.error).toBe("Label already exists.");
    });
  });

  // ---------------------------
  // Reorder labels
  // ---------------------------
  describe("PUT /api/labels/:userId/reorder", () => {
    it("should update the order of labels", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [
        { title: "First", color: "#111111", order: 0 },
        { title: "Second", color: "#222222", order: 1 },
        { title: "Third", color: "#333333", order: 2 },
      ];
      await user.save();

      const newOrder = [
        { _id: user.labels[2]._id, title: "Third", color: "#333333", order: 0 },
        {
          _id: user.labels[1]._id,
          title: "Second",
          color: "#222222",
          order: 1,
        },
        { _id: user.labels[0]._id, title: "First", color: "#111111", order: 2 },
      ];

      const res = await request(app)
        .put(`/api/labels/${defaultUser.userId}/reorder`)
        .send({ labels: newOrder })
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0].title).toBe("Third");
      expect(res.body[0].order).toBe(0);
      expect(res.body[2].title).toBe("First");
      expect(res.body[2].order).toBe(2);
    });

    it("should return 404 if user not found", async () => {
      await request(app)
        .put(`/api/labels/nonexistentUser/reorder`)
        .send({ labels: [] })
        .expect(404);
    });
  });

  // ---------------------------
  // Update a label
  // ---------------------------
  describe("PUT /api/labels/:userId/:labelId", () => {
    it("should update a label's title, color, and order", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [{ title: "Old Label", color: "#000000", order: 0 }];
      await user.save();
      const labelId = user.labels[0]._id;

      const updateData = {
        title: "Updated Label",
        color: "#ffffff",
        order: 1,
      };

      const res = await request(app)
        .put(`/api/labels/${defaultUser.userId}/${labelId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.title).toBe("Updated Label");
      expect(res.body.color).toBe("#ffffff");
      expect(res.body.order).toBe(1);
    });

    it("should update tasks that contain the label", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [{ title: "LabelToChange", color: "#000000", order: 0 }];
      await user.save();
      const labelId = user.labels[0]._id;

      const task = await Task.create({
        title: "Task with Label",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        labels: [{ _id: labelId, title: "LabelToChange", color: "#000000" }],
      });

      const updateData = {
        title: "New Label Title",
        color: "#111111",
      };

      const res = await request(app)
        .put(`/api/labels/${defaultUser.userId}/${labelId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.title).toBe("New Label Title");
      expect(res.body.color).toBe("#111111");

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.labels[0].title).toBe("New Label Title");
      expect(updatedTask.labels[0].color).toBe("#111111");
    });

    it("should return 400 if updating a label's title to a duplicate value", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [
        { title: "Label One", color: "#000000", order: 0 },
        { title: "Label Two", color: "#111111", order: 1 },
      ];
      await user.save();

      const labelId = user.labels[1]._id;

      const updateData = { title: "label one" };

      const res = await request(app)
        .put(`/api/labels/${defaultUser.userId}/${labelId}`)
        .send(updateData)
        .expect(400);

      expect(res.body.error).toBe("Label already exists.");
    });

    it("should return 400 if updating a label's title to an empty string", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [{ title: "Label", color: "#000000", order: 0 }];
      await user.save();
      const labelId = user.labels[0]._id;

      const updateData = { title: "   " };
      const res = await request(app)
        .put(`/api/labels/${defaultUser.userId}/${labelId}`)
        .send(updateData)
        .expect(400);
      expect(res.body.error).toBe("Field cannot be empty.");
    });

    it("should return 400 if updating a label's color to an empty string", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [{ title: "Label", color: "#000000", order: 0 }];
      await user.save();
      const labelId = user.labels[0]._id;

      const updateData = { color: "   " };
      const res = await request(app)
        .put(`/api/labels/${defaultUser.userId}/${labelId}`)
        .send(updateData)
        .expect(400);
      expect(res.body.error).toBe("Field cannot be empty.");
    });

    it("should return 404 if user or label is not found", async () => {
      const fakeLabelId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/labels/${defaultUser.userId}/${fakeLabelId}`)
        .send({ title: "Test" })
        .expect(404);
      await request(app)
        .put(`/api/labels/nonexistentUser/${fakeLabelId}`)
        .send({ title: "Test" })
        .expect(404);
    });
  });

  // ---------------------------
  // Delete a label
  // ---------------------------
  describe("DELETE /api/labels/:userId/:labelId", () => {
    it("should delete a label from the user and remove it from tasks", async () => {
      let user = await User.findOne({ userId: defaultUser.userId });
      user.labels = [
        { title: "ToBeDeleted", color: "#000000", order: 0 },
        { title: "KeepMe", color: "#ffffff", order: 1 },
      ];
      await user.save();
      const labelId = user.labels[0]._id;

      const task = await Task.create({
        title: "Task with label to delete",
        priority: "A1",
        userId: defaultUser.userId,
        status: "pending",
        labels: [{ _id: labelId, title: "ToBeDeleted", color: "#000000" }],
      });

      const res = await request(app)
        .delete(`/api/labels/${defaultUser.userId}/${labelId}`)
        .expect(200);

      expect(res.body.message).toBe("Label deleted");

      const updatedUser = await User.findOne({ userId: defaultUser.userId });
      expect(updatedUser.labels).toHaveLength(1);
      expect(updatedUser.labels[0].title).toBe("KeepMe");

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.labels).toHaveLength(0);
    });

    it("should return 404 if user not found", async () => {
      const fakeLabelId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/labels/nonexistentUser/${fakeLabelId}`)
        .expect(404);
    });
  });
});
