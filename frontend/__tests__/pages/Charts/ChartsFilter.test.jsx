import { format } from "date-fns";
import {
  computeDateRange,
  applyAllFilters,
  groupTasks,
  mergeData,
} from "../../../src/pages/Charts/ChartsFilter";
import { createBaseTask } from "../../../_testUtils/createBaseTask";

const createTask = (overrides = {}) => createBaseTask(overrides);

// ---------------------------
// Compute Date Range Tests
// ---------------------------
describe("computeDateRange", () => {
  const tasks = [
    createTask({ createdAt: "2022-01-01T10:00:00.000Z" }),
    createTask({ createdAt: "2022-01-10T10:00:00.000Z" }),
  ];

  test("should compute week range", () => {
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "week",
      customStartDate: null,
      customEndDate: null,
      tasks,
    });
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(format(startDate, "EEEE")).toBe("Monday");
  });

  test("should compute 2weeks range", () => {
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "2weeks",
      customStartDate: null,
      customEndDate: null,
      tasks,
    });
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    // endDate is set to 23:59:59.999 on the day 13 days after startDate (~14 days difference)
    const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(14, 1);
  });

  test("should compute month range", () => {
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "month",
      customStartDate: null,
      customEndDate: null,
      tasks,
    });
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    // start should be the first day of the current month at 00:00:00
    expect(startDate.getDate()).toBe(1);
    // end should be the last day of the current month (at least 28)
    expect(endDate.getDate()).toBeGreaterThanOrEqual(28);
  });

  test("should compute year range", () => {
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "year",
      customStartDate: null,
      customEndDate: null,
      tasks,
    });
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    // start should be January 1st and end should be December 31st of the current year
    expect(startDate.getMonth()).toBe(0);
    expect(startDate.getDate()).toBe(1);
    expect(endDate.getMonth()).toBe(11);
    expect(endDate.getDate()).toBeGreaterThanOrEqual(28);
  });

  test("should compute custom range", () => {
    const customStart = new Date("2022-02-01T00:00:00.000Z");
    const customEnd = new Date("2022-02-28T23:59:59.999Z");
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "custom",
      customStartDate: customStart,
      customEndDate: customEnd,
      tasks,
    });
    expect(startDate.getTime()).toBe(customStart.getTime());
    expect(endDate.getTime()).toBe(customEnd.getTime());
  });

  test("should compute custom range with both dates null", () => {
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "custom",
      customStartDate: null,
      customEndDate: null,
      tasks,
    });
    expect(startDate).toBeNull();
    expect(endDate).toBeNull();
  });

  test("should compute all-time range", () => {
    const earlyTask = createTask({ createdAt: "2020-01-01T10:00:00.000Z" });
    const tasksAllTime = [earlyTask, ...tasks];
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "all-time",
      customStartDate: null,
      customEndDate: null,
      tasks: tasksAllTime,
    });
    expect(startDate).toBeInstanceOf(Date);
    expect(startDate.getTime()).toBe(
      new Date("2020-01-01T10:00:00.000Z").getTime()
    );
    expect(endDate.getTime()).toBeLessThanOrEqual(Date.now());
  });

  test("should compute all-time range with empty tasks", () => {
    const { startDate, endDate } = computeDateRange({
      timeRangeType: "all-time",
      customStartDate: null,
      customEndDate: null,
      tasks: [],
    });
    expect(startDate).toBeInstanceOf(Date);
    expect(startDate.getMonth()).toBe(0);
    expect(startDate.getDate()).toBe(1);
    expect(endDate.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

// ---------------------------
// Apply All Filters Tests
// ---------------------------
describe("applyAllFilters", () => {
  const baseFilters = {
    taskType: "active",
    dueFilter: "both",
    includeNoDueDate: true,
    priorityFilters: [],
    dayOfWeekFilters: [],
    statusFilters: [],
    labelFilters: [],
    includeNoneLabel: true,
    assignedToFilter: "",
    minStoryPoints: "",
    minTimeSpent: "",
    minTimeUnit: "seconds",
    scheduledOnly: false,
  };

  const startDate = new Date("2022-01-01T00:00:00.000Z");
  const endDate = new Date("2022-01-31T23:59:59.999Z");

  test("should filter active tasks based on createdAt", () => {
    const activeTask = createTask({
      createdAt: "2022-01-15T10:00:00.000Z",
      taskCompleted: false,
    });
    const outOfRangeTask = createTask({
      createdAt: "2021-12-31T10:00:00.000Z",
      taskCompleted: false,
    });
    const filtered = applyAllFilters(
      [activeTask, outOfRangeTask],
      startDate,
      endDate,
      baseFilters
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]._id).toBe(activeTask._id);
  });

  test("should filter completed tasks based on completedAt", () => {
    const completedTask = createTask({
      completedAt: "2022-01-20T10:00:00.000Z",
      taskCompleted: true,
    });
    const incompleteTask = createTask({
      taskCompleted: true,
      completedAt: null,
    });
    const filters = { ...baseFilters, taskType: "completed" };
    const filtered = applyAllFilters(
      [completedTask, incompleteTask],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]._id).toBe(completedTask._id);
  });

  test("should filter tasks for taskType 'both'", () => {
    const activeTask = createTask({
      createdAt: "2022-01-10T10:00:00.000Z",
      taskCompleted: false,
    });
    const completedTask = createTask({
      completedAt: "2022-01-20T10:00:00.000Z",
      taskCompleted: true,
    });
    const filters = { ...baseFilters, taskType: "both" };
    const filtered = applyAllFilters(
      [activeTask, completedTask],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(2);
  });

  test("should filter tasks based on dueFilter 'due'", () => {
    const futureTask = createTask({
      dueDate: new Date(Date.now() + 3600000).toISOString(),
    });
    const pastTask = createTask({
      dueDate: new Date(Date.now() - 3600000).toISOString(),
    });
    const filters = { ...baseFilters, dueFilter: "due" };
    const filtered = applyAllFilters(
      [futureTask, pastTask],
      startDate,
      endDate,
      filters
    );
    if (new Date(futureTask.dueDate) >= new Date()) {
      expect(filtered).toEqual([futureTask]);
    } else {
      expect(filtered).toEqual([]);
    }
  });

  test("should filter tasks based on dueFilter 'overdue'", () => {
    const pastTask = createTask({
      dueDate: new Date(Date.now() - 3600000).toISOString(),
    });
    const futureTask = createTask({
      dueDate: new Date(Date.now() + 3600000).toISOString(),
    });
    const filters = { ...baseFilters, dueFilter: "overdue" };
    const filtered = applyAllFilters(
      [pastTask, futureTask],
      startDate,
      endDate,
      filters
    );
    if (new Date(pastTask.dueDate) < new Date()) {
      expect(filtered).toEqual([pastTask]);
    } else {
      expect(filtered).toEqual([]);
    }
  });

  test("should exclude tasks without dueDate when dueFilter is 'overdue' even if includeNoDueDate is true", () => {
    const overdueTask = createTask({
      dueDate: new Date(Date.now() - 3600000).toISOString(),
    });
    const noDueTask = createTask({ dueDate: null });
    const filters = {
      ...baseFilters,
      dueFilter: "overdue",
      includeNoDueDate: true,
    };
    const filtered = applyAllFilters(
      [overdueTask, noDueTask],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toEqual([overdueTask]);
  });

  test("should filter tasks based on includeNoDueDate flag", () => {
    const noDueTask = createTask({ dueDate: null });
    const withDueTask = createTask({ dueDate: "2022-01-10T10:00:00.000Z" });
    const filters = { ...baseFilters, includeNoDueDate: false };
    const filtered = applyAllFilters(
      [noDueTask, withDueTask],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].dueDate).toBeTruthy();
  });

  test("should filter tasks based on priorityFilters", () => {
    const taskA1 = createTask({ priority: "A1" });
    const taskB2 = createTask({ priority: "B2" });
    const filters = { ...baseFilters, priorityFilters: ["A1"] };
    const filtered = applyAllFilters(
      [taskA1, taskB2],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].priority).toBe("A1");
  });

  test("should filter tasks based on dayOfWeekFilters", () => {
    const mondayTask = createTask({ createdAt: "2022-01-03T10:00:00.000Z" }); // Monday
    const tuesdayTask = createTask({ createdAt: "2022-01-04T10:00:00.000Z" }); // Tuesday
    const filters = { ...baseFilters, dayOfWeekFilters: ["Monday"] };
    const filtered = applyAllFilters(
      [mondayTask, tuesdayTask],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(1);
    expect(format(new Date(filtered[0].createdAt), "EEEE")).toBe("Monday");
  });

  test("should filter tasks based on assignedToFilter", () => {
    const taskJohn = createTask({ assignedTo: "John Doe" });
    const taskJane = createTask({ assignedTo: "Jane Smith" });
    const filters = { ...baseFilters, assignedToFilter: "john" };
    const filtered = applyAllFilters(
      [taskJohn, taskJane],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].assignedTo).toBe("John Doe");
  });

  test("should filter tasks based on minStoryPoints", () => {
    const taskLow = createTask({ storyPoints: 3 });
    const taskHigh = createTask({ storyPoints: 8 });
    const filters = { ...baseFilters, minStoryPoints: "5" };
    const filtered = applyAllFilters(
      [taskLow, taskHigh],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].storyPoints).toBe(8);
  });

  test("should filter tasks based on minTimeSpent with unit conversion", () => {
    const taskLong = createTask({ timeSpent: 3600 });
    const taskShort = createTask({ timeSpent: 1800 });
    const filtersSeconds = {
      ...baseFilters,
      minTimeSpent: "2000",
      minTimeUnit: "seconds",
    };
    const filteredSeconds = applyAllFilters(
      [taskLong, taskShort],
      startDate,
      endDate,
      filtersSeconds
    );
    expect(filteredSeconds).toHaveLength(1);
    expect(filteredSeconds[0].timeSpent).toBe(3600);

    const filtersMinutes = {
      ...baseFilters,
      minTimeSpent: "31",
      minTimeUnit: "minutes",
    };
    const filteredMinutes = applyAllFilters(
      [taskLong, taskShort],
      startDate,
      endDate,
      filtersMinutes
    );
    expect(filteredMinutes).toHaveLength(1);
    expect(filteredMinutes[0].timeSpent).toBe(3600);
  });

  test("should filter tasks when scheduledOnly is true", () => {
    const scheduledTask = createTask({
      scheduledStart: "2022-01-10T10:00:00.000Z",
    });
    const unscheduledTask = createTask({ scheduledStart: null });
    const filters = { ...baseFilters, scheduledOnly: true };
    const filtered = applyAllFilters(
      [scheduledTask, unscheduledTask],
      startDate,
      endDate,
      filters
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].scheduledStart).toBeTruthy();
  });

  describe("Edge cases and combined scenarios", () => {
    test("should ignore non-numeric minStoryPoints", () => {
      const task = createTask({ storyPoints: 5 });
      const filters = { ...baseFilters, minStoryPoints: "abc" };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(1);
    });

    test("should ignore non-numeric minTimeSpent", () => {
      const task = createTask({ timeSpent: 3600 });
      const filters = { ...baseFilters, minTimeSpent: "xyz" };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(1);
    });

    test("should trim and match assignedToFilter case insensitively", () => {
      const task = createTask({ assignedTo: "John Doe" });
      const filters = { ...baseFilters, assignedToFilter: "  JOHN doe  " };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(1);
    });

    test("should exclude tasks with no dueDate when includeNoDueDate is false", () => {
      const taskWithNoDue = createTask({ dueDate: null });
      const taskWithDue = createTask({ dueDate: "2022-01-10T10:00:00.000Z" });
      const filters = { ...baseFilters, includeNoDueDate: false };
      const filtered = applyAllFilters(
        [taskWithNoDue, taskWithDue],
        startDate,
        endDate,
        filters
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].dueDate).toBeTruthy();
    });

    test("should apply combined filters correctly", () => {
      const task = createTask({
        createdAt: "2022-01-15T10:00:00.000Z",
        assignedTo: "Alice",
        priority: "A1",
        storyPoints: 8,
        timeSpent: 4000,
        labels: [{ title: "Urgent", color: "#FF0000" }],
      });
      const filters = {
        ...baseFilters,
        taskType: "active",
        assignedToFilter: "alice",
        priorityFilters: ["A1"],
        minStoryPoints: "5",
        minTimeSpent: "3500",
        minTimeUnit: "seconds",
        labelFilters: ["Urgent"],
        dayOfWeekFilters: [
          format(new Date("2022-01-15T10:00:00.000Z"), "EEEE"),
        ],
      };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(1);
    });

    test("should include tasks without scheduledStart when scheduledOnly is false", () => {
      const task = createTask({ scheduledStart: null });
      const filters = { ...baseFilters, scheduledOnly: false };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(1);
    });

    test("should exclude tasks without scheduledStart when scheduledOnly is true", () => {
      const task = createTask({ scheduledStart: null });
      const filters = { ...baseFilters, scheduledOnly: true };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(0);
    });

    test("should handle missing optional fields gracefully", () => {
      const task = createTask({ assignedTo: undefined, labels: undefined });
      const filters = { ...baseFilters };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(1);
    });

    test("should handle tasks with missing createdAt and completedAt", () => {
      const task = createTask({ createdAt: undefined, completedAt: undefined });
      const filters = { ...baseFilters };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(0);
    });

    test("should handle custom range with only start date provided", () => {
      const tasks = [];
      const customStart = new Date("2022-03-01T00:00:00.000Z");
      const { startDate: cs, endDate: ce } = computeDateRange({
        timeRangeType: "custom",
        customStartDate: customStart,
        customEndDate: null,
        tasks,
      });
      expect(cs.getTime()).toBe(customStart.getTime());
      expect(ce).toBeNull();
    });

    test("should handle custom range with only end date provided", () => {
      const tasks = [];
      const customEnd = new Date("2022-03-31T23:59:59.999Z");
      const { startDate: cs, endDate: ce } = computeDateRange({
        timeRangeType: "custom",
        customStartDate: null,
        customEndDate: customEnd,
        tasks,
      });
      expect(cs).toBeNull();
      expect(ce.getFullYear()).toBe(customEnd.getFullYear());
      expect(ce.getMonth()).toBe(customEnd.getMonth());
      expect(ce.getDate()).toBe(customEnd.getDate());
      expect(ce.getHours()).toBe(23);
      expect(ce.getMinutes()).toBe(59);
      expect(ce.getSeconds()).toBe(59);
      expect(ce.getMilliseconds()).toBe(999);
    });

    test("should return empty array for combined filters that yield no tasks", () => {
      const task = createTask({
        assignedTo: "Alice",
        priority: "A1",
        createdAt: "2022-01-15T10:00:00.000Z",
      });
      const filters = {
        ...baseFilters,
        assignedToFilter: "nonexistent",
        priorityFilters: ["B2"],
      };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(0);
    });

    test("should include tasks exactly on the start and end date boundaries", () => {
      const boundaryStartTask = createTask({
        createdAt: "2022-01-01T00:00:00.000Z",
        taskCompleted: false,
      });
      const boundaryEndTask = createTask({
        createdAt: "2022-01-31T23:59:59.999Z",
        taskCompleted: false,
      });
      const filtered = applyAllFilters(
        [boundaryStartTask, boundaryEndTask],
        startDate,
        endDate,
        baseFilters
      );
      expect(filtered).toHaveLength(2);
    });

    test("should correctly filter tasks with multiple labels", () => {
      const task = createTask({
        labels: [
          { title: "Urgent", color: "#FF0000" },
          { title: "Important", color: "#00FF00" },
        ],
      });
      const filters = { ...baseFilters, labelFilters: ["Urgent"] };
      const filtered = applyAllFilters([task], startDate, endDate, filters);
      expect(filtered).toHaveLength(1);
    });

    test("should handle tasks with missing optional fields", () => {
      const task = createTask({ priority: undefined, assignedTo: "" });
      const filtered = applyAllFilters([task], startDate, endDate, baseFilters);
      expect(filtered).toHaveLength(1);
    });
  });
});

// ---------------------------
// Group Tasks Tests
// ---------------------------
describe("groupTasks", () => {
  const baseGroupFilters = {
    xAxisField: "day",
    columnsMapping: { "in-progress": "In Progress" },
    labels: [
      { title: "Urgent", color: "#FF0000" },
      { title: "Important", color: "#00FF00" },
    ],
    dayOfWeekFilters: [],
    priorityFilters: [],
    statusFilters: [],
    labelFilters: [],
    includeNoneLabel: true,
    includeZeroMetrics: true,
    taskType: "active",
  };

  test("should group tasks by day", () => {
    const mondayTask = createTask({
      createdAt: "2022-01-03T10:00:00.000Z",
      taskCompleted: false,
    });
    const tuesdayTask = createTask({
      createdAt: "2022-01-04T10:00:00.000Z",
      taskCompleted: false,
    });
    const grouped = groupTasks([mondayTask, tuesdayTask], baseGroupFilters);
    const days = grouped.map((g) => g.key);
    expect(days).toEqual(expect.arrayContaining(["Monday", "Tuesday"]));
  });

  test("should group tasks by priority", () => {
    const filters = { ...baseGroupFilters, xAxisField: "priority" };
    const taskA = createTask({ priority: "A1" });
    const taskB = createTask({ priority: "B2" });
    const grouped = groupTasks([taskA, taskB], filters);
    const priorities = grouped.map((g) => g.key);
    expect(priorities).toEqual(expect.arrayContaining(["A1", "B2"]));
  });

  test("should group tasks by status", () => {
    const filters = {
      ...baseGroupFilters,
      xAxisField: "status",
      taskType: "both",
    };
    const activeTask = createTask({
      status: "in-progress",
      taskCompleted: false,
    });
    const completedTask = createTask({
      status: "in-progress",
      taskCompleted: true,
      completedAt: "2022-01-10T10:00:00.000Z",
    });
    const grouped = groupTasks([activeTask, completedTask], filters);
    const statuses = grouped.map((g) => g.key);
    expect(statuses).toEqual(
      expect.arrayContaining(["In Progress", "Completed"])
    );
  });

  test("should group tasks by label when labelFilters is empty", () => {
    const filters = {
      ...baseGroupFilters,
      xAxisField: "label",
      includeZeroMetrics: false,
    };
    const taskWithLabel = createTask({
      labels: [{ title: "Urgent", color: "#FF0000" }],
    });
    const taskWithoutLabel = createTask({ labels: [] });
    const grouped = groupTasks([taskWithLabel, taskWithoutLabel], filters);
    const keys = grouped.map((g) => g.key);
    expect(keys).toEqual(expect.arrayContaining(["Urgent"]));
  });

  test("should group tasks by label when labelFilters is non-empty and includeNoneLabel is false", () => {
    const filters = {
      ...baseGroupFilters,
      xAxisField: "label",
      includeZeroMetrics: false,
      labelFilters: ["Urgent"],
      includeNoneLabel: false,
    };
    const taskWithLabel = createTask({
      labels: [{ title: "Urgent", color: "#FF0000" }],
    });
    const taskWithoutLabel = createTask({ labels: [] });
    const grouped = groupTasks([taskWithLabel, taskWithoutLabel], filters);
    const keys = grouped.map((g) => g.key);
    expect(keys).toEqual(expect.arrayContaining(["Urgent"]));
    expect(keys).not.toContain("None");
  });

  test("should not pre-populate groups when includeZeroMetrics is false", () => {
    const filters = {
      ...baseGroupFilters,
      xAxisField: "day",
      includeZeroMetrics: false,
    };
    const mondayTask = createTask({
      createdAt: "2022-01-03T10:00:00.000Z",
      taskCompleted: false,
    });
    const grouped = groupTasks([mondayTask], filters);
    const days = grouped.map((g) => g.key);
    expect(days).toEqual(["Monday"]);
  });

  test("should return pre-populated groups for empty tasks when includeZeroMetrics is true", () => {
    const filters = {
      ...baseGroupFilters,
      xAxisField: "day",
      includeZeroMetrics: true,
    };
    const grouped = groupTasks([], filters);

    const days = grouped.map((g) => g.key);
    expect(days).toEqual(
      expect.arrayContaining([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ])
    );
  });

  test("should handle unexpected xAxisField gracefully", () => {
    const filters = { ...baseGroupFilters, xAxisField: "unknown" };
    const task = createTask({
      createdAt: "2022-01-03T10:00:00.000Z",
      storyPoints: 5,
      timeSpent: 1800,
    });
    const grouped = groupTasks([task], filters);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].key).toBeUndefined();
  });

  test("should update multiple groups when task has multiple labels", () => {
    const filters = {
      ...baseGroupFilters,
      xAxisField: "label",
      includeZeroMetrics: false,
    };
    const task = createTask({
      labels: [
        { title: "Urgent", color: "#FF0000" },
        { title: "Important", color: "#00FF00" },
      ],
    });
    const grouped = groupTasks([task], filters);
    const keys = grouped.map((g) => g.key);
    expect(keys).toEqual(expect.arrayContaining(["Urgent", "Important"]));
  });

  test("should group task with missing priority as 'None' when grouping by priority", () => {
    const filters = { ...baseGroupFilters, xAxisField: "priority" };
    const task = createTask({ priority: undefined });
    const grouped = groupTasks([task], filters);
    const keys = grouped.map((g) => g.key);
    expect(keys).toContain("None");
  });
});

// ---------------------------
// Merge Data Tests
// ---------------------------
describe("mergeData", () => {
  test("should merge main and comparison groups correctly for 'count' metric", () => {
    const mainData = [
      { key: "Group1", count: 5, timeSpent: 3600, storyPoints: 5 },
      { key: "Group2", count: 3, timeSpent: 1800, storyPoints: 3 },
    ];
    const compData = [
      { key: "Group1", count: 2, timeSpent: 7200, storyPoints: 2 },
      { key: "Group3", count: 4, timeSpent: 3600, storyPoints: 4 },
    ];
    const mergedCount = mergeData(mainData, compData, "count");
    const group1 = mergedCount.find((d) => d.key === "Group1");
    const group2 = mergedCount.find((d) => d.key === "Group2");
    const group3 = mergedCount.find((d) => d.key === "Group3");

    expect(group1.mainValue).toBe(5);
    expect(group1.compValue).toBe(2);
    expect(group2.mainValue).toBe(3);
    expect(group2.compValue).toBe(0);
    expect(group3.mainValue).toBe(0);
    expect(group3.compValue).toBe(4);
  });

  test("should merge main and comparison groups correctly for 'timeSpent' metric", () => {
    const mainData = [
      { key: "Group1", count: 5, timeSpent: 3600, storyPoints: 5 },
      { key: "Group2", count: 3, timeSpent: 1800, storyPoints: 3 },
    ];
    const compData = [
      { key: "Group1", count: 2, timeSpent: 7200, storyPoints: 2 },
      { key: "Group3", count: 4, timeSpent: 3600, storyPoints: 4 },
    ];
    const mergedTime = mergeData(mainData, compData, "timeSpent");
    const group1Time = mergedTime.find((d) => d.key === "Group1");
    expect(group1Time.mainValue).toBeCloseTo(1); // 1 hr
    expect(group1Time.compValue).toBeCloseTo(2); // 2 hr
  });

  test("should merge when mainData is empty", () => {
    const mainData = [];
    const compData = [
      { key: "Group1", count: 2, timeSpent: 7200, storyPoints: 2 },
      { key: "Group2", count: 4, timeSpent: 3600, storyPoints: 4 },
    ];
    const merged = mergeData(mainData, compData, "count");
    const group1 = merged.find((d) => d.key === "Group1");
    const group2 = merged.find((d) => d.key === "Group2");
    expect(group1.mainValue).toBe(0);
    expect(group1.compValue).toBe(2);
    expect(group2.mainValue).toBe(0);
    expect(group2.compValue).toBe(4);
  });

  test("should merge when compData is empty", () => {
    const mainData = [
      { key: "Group1", count: 5, timeSpent: 3600, storyPoints: 5 },
      { key: "Group2", count: 3, timeSpent: 1800, storyPoints: 3 },
    ];
    const compData = [];
    const merged = mergeData(mainData, compData, "count");
    const group1 = merged.find((d) => d.key === "Group1");
    const group2 = merged.find((d) => d.key === "Group2");
    expect(group1.mainValue).toBe(5);
    expect(group1.compValue).toBe(0);
    expect(group2.mainValue).toBe(3);
    expect(group2.compValue).toBe(0);
  });

  test("should merge with completely non-overlapping keys", () => {
    const mainData = [
      { key: "Group1", count: 5, timeSpent: 3600, storyPoints: 5 },
    ];
    const compData = [
      { key: "Group2", count: 4, timeSpent: 3600, storyPoints: 4 },
    ];
    const merged = mergeData(mainData, compData, "count");
    const group1 = merged.find((d) => d.key === "Group1");
    const group2 = merged.find((d) => d.key === "Group2");
    expect(group1.mainValue).toBe(5);
    expect(group1.compValue).toBe(0);
    expect(group2.mainValue).toBe(0);
    expect(group2.compValue).toBe(4);
  });

  test("should merge main and comparison groups correctly for 'storyPoints' metric", () => {
    const mainData = [
      { key: "Group1", count: 5, timeSpent: 3600, storyPoints: 10 },
      { key: "Group2", count: 3, timeSpent: 1800, storyPoints: 6 },
    ];
    const compData = [
      { key: "Group1", count: 2, timeSpent: 7200, storyPoints: 4 },
      { key: "Group3", count: 4, timeSpent: 3600, storyPoints: 8 },
    ];
    const merged = mergeData(mainData, compData, "storyPoints");
    const group1 = merged.find((d) => d.key === "Group1");
    const group2 = merged.find((d) => d.key === "Group2");
    const group3 = merged.find((d) => d.key === "Group3");
    expect(group1.mainValue).toBe(10);
    expect(group1.compValue).toBe(4);
    expect(group2.mainValue).toBe(6);
    expect(group2.compValue).toBe(0);
    expect(group3.mainValue).toBe(0);
    expect(group3.compValue).toBe(8);
  });

  test("should correctly merge when metrics include zero or negative values", () => {
    const mainData = [
      { key: "Group1", count: 0, timeSpent: 0, storyPoints: -5 },
    ];
    const compData = [
      { key: "Group1", count: -2, timeSpent: 0, storyPoints: 0 },
    ];
    const merged = mergeData(mainData, compData, "count");
    const group1 = merged.find((d) => d.key === "Group1");
    expect(group1.mainValue).toBe(0);
    expect(group1.compValue).toBe(-2);
  });
});

// ---------------------------
// Simulated Minimum Task Count (Post-Grouping)
// ---------------------------
describe("Simulated Minimum Task Count Filtering (Post Grouping)", () => {
  test("should filter out groups below a minimum task count", () => {
    const groupedData = [
      { key: "Group1", count: 5, timeSpent: 3600, storyPoints: 5 },
      { key: "Group2", count: 2, timeSpent: 1800, storyPoints: 3 },
      { key: "Group3", count: 10, timeSpent: 7200, storyPoints: 8 },
    ];
    const minTaskCount = 3;
    const filteredGroups = groupedData.filter(
      (item) => item.count >= minTaskCount
    );
    expect(filteredGroups).toHaveLength(2);
    expect(filteredGroups.map((item) => item.key)).toEqual(
      expect.arrayContaining(["Group1", "Group3"])
    );
  });
});
