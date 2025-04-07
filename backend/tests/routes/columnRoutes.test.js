jest.setTimeout(20000);

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Column = require("../../models/Column");
const Task = require("../../models/Task");
const User = require("../../models/User");
const columnRoutes = require("../../routes/columnsRoute");

let app;
let mongoServer;
let defaultUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  defaultUser = await User.create({
    userId: "user1",
    welcomeColumnsAndTask: false,
  });

  app = express();
  app.use(express.json());
  app.use("/api/columns", columnRoutes);
});

beforeEach(async () => {
  await Column.deleteMany({});
  await Task.deleteMany({});
  await User.findOneAndUpdate(
    { userId: defaultUser.userId },
    { welcomeColumnsAndTask: false },
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Column Routes", () => {
  // ---------------------------
  // Column order for a user
  // ---------------------------
  describe("GET /api/columns/order/:userId", () => {
    it("should create default columns (and default task in backlog) for a new user and return column order and names", async () => {
      const res = await request(app)
        .get(`/api/columns/order/${defaultUser.userId}`)
        .expect(200);

      // default columns to be created.
      expect(res.body).toHaveProperty("columnOrder");
      expect(res.body).toHaveProperty("columnNames");
      expect(Array.isArray(res.body.columnOrder)).toBe(true);
      expect(res.body.columnOrder).toEqual(["backlog", "inprogress", "done"]);
      expect(res.body.columnNames).toEqual({
        backlog: "Backlog",
        inprogress: "In Progress",
        done: "Done",
      });

      // default task was created in the backlog.
      const defaultTask = await Task.findOne({
        userId: defaultUser.userId,
        status: "backlog",
      });
      expect(defaultTask).not.toBeNull();
      expect(defaultTask.title).toBe("Click me!");
      expect(defaultTask.priority).toBe("A1");

      const user = await User.findOne({ userId: defaultUser.userId });
      expect(user.welcomeColumnsAndTask).toBe(true);
    });

    it("should return existing columns if they already exist", async () => {
      await Column.insertMany([
        {
          columnId: "col1",
          name: "Column 1",
          order: 0,
          userId: defaultUser.userId,
        },
        {
          columnId: "col2",
          name: "Column 2",
          order: 1,
          userId: defaultUser.userId,
        },
      ]);
      await User.findOneAndUpdate(
        { userId: defaultUser.userId },
        { welcomeColumnsAndTask: true },
      );

      const res = await request(app)
        .get(`/api/columns/order/${defaultUser.userId}`)
        .expect(200);

      expect(res.body.columnOrder).toEqual(["col1", "col2"]);
      expect(res.body.columnNames).toEqual({
        col1: "Column 1",
        col2: "Column 2",
      });
    });
  });

  // ---------------------------
  // Create a new column
  // ---------------------------
  describe("POST /api/columns/create", () => {
    it("should create a new column and return success message", async () => {
      const res = await request(app)
        .post("/api/columns/create")
        .send({ userId: defaultUser.userId, columnName: "New Column" })
        .expect(200);

      expect(res.body.message).toBe("Board created successfully");
      expect(res.body).toHaveProperty("columnId");
      expect(res.body.columnName).toBe("New Column");
    });

    it("should return 400 if userId or columnName is missing", async () => {
      const res = await request(app)
        .post("/api/columns/create")
        .send({ userId: defaultUser.userId })
        .expect(400);
      expect(res.body.error).toBe("Column name cannot be empty.");
    });

    it("should return 400 if columnName is 'Completed' (reserved)", async () => {
      const res = await request(app)
        .post("/api/columns/create")
        .send({ userId: defaultUser.userId, columnName: "Completed" })
        .expect(400);
      expect(res.body.error).toBe("Column name 'Completed' is reserved.");
    });

    it("should return 400 if columnName is 'completed' (case insensitive reserved)", async () => {
      const res = await request(app)
        .post("/api/columns/create")
        .send({ userId: defaultUser.userId, columnName: "cOmPlEtEd" })
        .expect(400);
      expect(res.body.error).toBe("Column name 'Completed' is reserved.");
    });

    it("should return 400 if columnName already exists (duplicate)", async () => {
      // First create a column
      await request(app)
        .post("/api/columns/create")
        .send({ userId: defaultUser.userId, columnName: "Duplicate Column" })
        .expect(200);

      // Attempt to create the same column name (case insensitive)
      const res = await request(app)
        .post("/api/columns/create")
        .send({ userId: defaultUser.userId, columnName: "duplicate column" })
        .expect(400);
      expect(res.body.error).toBe("Column name already exists.");
    });
  });

  // ---------------------------
  // Rename a column
  // ---------------------------
  describe("PUT /api/columns/rename", () => {
    it("should rename an existing column", async () => {
      await Column.create({
        columnId: "colToRename",
        name: "Old Name",
        order: 0,
        userId: defaultUser.userId,
      });

      const res = await request(app)
        .put("/api/columns/rename")
        .send({
          userId: defaultUser.userId,
          columnId: "colToRename",
          newName: "Renamed Column",
        })
        .expect(200);

      expect(res.body.message).toBe("Board renamed successfully");

      const updatedColumn = await Column.findOne({
        userId: defaultUser.userId,
        columnId: "colToRename",
      });
      expect(updatedColumn.name).toBe("Renamed Column");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .put("/api/columns/rename")
        .send({ userId: defaultUser.userId, newName: "Renamed Column" })
        .expect(400);
      expect(res.body.error).toBe("User ID and column ID are required");
    });

    it("should return 400 if newName is 'Completed' (reserved)", async () => {
      await Column.create({
        columnId: "colToRename",
        name: "Old Name",
        order: 0,
        userId: defaultUser.userId,
      });

      const res = await request(app)
        .put("/api/columns/rename")
        .send({
          userId: defaultUser.userId,
          columnId: "colToRename",
          newName: "Completed",
        })
        .expect(400);
      expect(res.body.error).toBe("Column name 'Completed' is reserved.");
    });

    it("should return 400 if newName is 'completed' (case insensitive reserved)", async () => {
      await Column.create({
        columnId: "colToRename",
        name: "Old Name",
        order: 0,
        userId: defaultUser.userId,
      });

      const res = await request(app)
        .put("/api/columns/rename")
        .send({
          userId: defaultUser.userId,
          columnId: "colToRename",
          newName: "CoMpLeTeD",
        })
        .expect(400);
      expect(res.body.error).toBe("Column name 'Completed' is reserved.");
    });

    it("should return 400 if newName already exists in another column (duplicate)", async () => {
      await Column.create({
        columnId: "col1",
        name: "Existing Column",
        order: 0,
        userId: defaultUser.userId,
      });
      await Column.create({
        columnId: "col2",
        name: "Another Column",
        order: 1,
        userId: defaultUser.userId,
      });

      const res = await request(app)
        .put("/api/columns/rename")
        .send({
          userId: defaultUser.userId,
          columnId: "col2",
          newName: "existing column",
        })
        .expect(400);
      expect(res.body.error).toBe("Column name already exists.");
    });

    it("should return 404 when trying to rename a column that doesn’t exist", async () => {
      const res = await request(app)
        .put("/api/columns/rename")
        .send({
          userId: defaultUser.userId,
          columnId: "nonexistentColumn",
          newName: "Ghost Column",
        })
        .expect(404);

      expect(res.body.error).toBe("Column not found");
    });
  });

  // ---------------------------
  // Delete a column and its tasks
  // ---------------------------
  describe("DELETE /api/columns/delete", () => {
    it("should delete a column and its associated tasks", async () => {
      await Column.create({
        columnId: "colToDelete",
        name: "Column To Delete",
        order: 0,
        userId: defaultUser.userId,
      });
      await Task.create({
        title: "Task in Column",
        priority: "C1",
        userId: defaultUser.userId,
        status: "colToDelete",
        order: 0,
      });

      const res = await request(app)
        .delete("/api/columns/delete")
        .send({ userId: defaultUser.userId, columnId: "colToDelete" })
        .expect(200);

      expect(res.body.message).toBe(
        "Board and associated tasks deleted successfully",
      );

      const remainingColumn = await Column.findOne({
        userId: defaultUser.userId,
        columnId: "colToDelete",
      });
      expect(remainingColumn).toBeNull();

      const remainingTasks = await Task.find({
        userId: defaultUser.userId,
        status: "colToDelete",
      });
      expect(remainingTasks.length).toBe(0);
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .delete("/api/columns/delete")
        .send({ userId: defaultUser.userId })
        .expect(400);
      expect(res.body.error).toBe("User ID and column ID are required");
    });
  });

  // ---------------------------
  // Save updated column order
  // ---------------------------
  describe("PUT /api/columns/order", () => {
    it("should update the column order for a user", async () => {
      await Column.insertMany([
        {
          columnId: "col1",
          name: "Column 1",
          order: 0,
          userId: defaultUser.userId,
        },
        {
          columnId: "col2",
          name: "Column 2",
          order: 1,
          userId: defaultUser.userId,
        },
      ]);

      const newOrder = ["col2", "col1"];
      const res = await request(app)
        .put("/api/columns/order")
        .send({ userId: defaultUser.userId, columnOrder: newOrder })
        .expect(200);

      expect(res.body.message).toBe("Column order saved successfully");
      expect(res.body.columnOrder).toEqual(newOrder);

      const columns = await Column.find({ userId: defaultUser.userId }).sort({
        order: 1,
      });
      expect(columns[0].columnId).toBe("col2");
      expect(columns[1].columnId).toBe("col1");
    });

    it("should return 400 if userId or columnOrder is missing", async () => {
      const res = await request(app)
        .put("/api/columns/order")
        .send({ userId: defaultUser.userId })
        .expect(400);
      expect(res.body.error).toBe("User ID and column order required");
    });
  });
});
