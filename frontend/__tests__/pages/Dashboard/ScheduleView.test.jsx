import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScheduleView from "../../../src/pages/Dashboard/ScheduleView";
import { BrowserRouter } from "react-router-dom";
import { createBaseTask } from "../../../_testUtils/createBaseTask";
import {
  getLabelVariant,
  generatePattern,
} from "../../../src/components/boardComponents/TaskLabels";

const fixedStart = "2025-03-22T10:00:00.000Z";
const fixedEnd = "2025-03-22T11:00:00.000Z";

const scheduledTask = createBaseTask({
  _id: "1",
  title: "Scheduled Task",
  priority: "A1",
  scheduledStart: fixedStart,
  scheduledEnd: fixedEnd,
});

const unscheduledTask = createBaseTask({
  _id: "2",
  title: "Unscheduled Task",
  priority: "B1",
  scheduledStart: null,
  scheduledEnd: null,
});

const tasks = [scheduledTask, unscheduledTask];

jest.mock("../../../src/services/tasksService", () => ({
  updateTask: jest.fn(() =>
    Promise.resolve({
      data: {
        _id: "2",
        title: "Unscheduled Task",
        priority: "B1",
        scheduledStart: "2025-03-22T14:00:00.000Z",
        scheduledEnd: "2025-03-22T15:00:00.000Z",
      },
    }),
  ),
  updateTaskSchedule: jest.fn(() =>
    Promise.resolve({
      data: {
        _id: "1",
        title: "Scheduled Task",
        priority: "A1",
        scheduledStart: "2025-03-22T12:00:00.000Z",
        scheduledEnd: "2025-03-22T13:00:00.000Z",
      },
    }),
  ),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("react-big-calendar/lib/addons/dragAndDrop", () => {
  const React = require("react");
  const moment = require("moment");
  return () => {
    return (props) => (
      <div data-testid="dnd-calendar">
        <div data-testid="calendar-events">
          {props.events &&
            props.events.map((event) => {
              const duration = moment(event.end).diff(
                moment(event.start),
                "minutes",
              );
              return (
                <div key={event.id} data-testid="calendar-event">
                  {duration <= 30 ? (
                    <div className="custom-event-min-height">
                      <span className="event-title">{event.title}</span>
                      <span className="event-start">
                        {moment(event.start).format("h:mm A")}
                      </span>
                      <div className="priority-strip">
                        <span className="priority-label">{event.priority}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="custom-event">
                      <span className="event-time">
                        {moment(event.start).format("h:mm A")} -{" "}
                        {moment(event.end).format("h:mm A")}
                      </span>
                      <span className="event-title">{event.title}</span>
                      <div className="priority-strip">
                        <span className="priority-label">{event.priority}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        <button
          onClick={() =>
            props.onEventDrop({
              event: props.events[0],
              start: new Date("2025-03-22T12:00:00.000Z"),
              end: new Date("2025-03-22T13:00:00.000Z"),
            })
          }
        >
          Trigger Valid Event Drop
        </button>
        <button
          onClick={() =>
            props.onEventDrop({
              event: props.events[0],
              start: new Date("2025-03-22T12:00:00.000Z"),
              end: new Date("2025-03-23T13:00:00.000Z"), // multi-day drop
            })
          }
        >
          Trigger Invalid Multi-day Drop
        </button>
        <button
          onClick={() =>
            props.onEventDrop({
              event: props.events[0],
              start: new Date("2025-03-22T12:00:00.000Z"),
              end: new Date("2025-03-22T12:00:00.000Z"), // same start and end
            })
          }
        >
          Trigger Invalid Same Time Drop
        </button>
        <button
          onClick={() =>
            props.onEventResize({
              event: props.events[0],
              start: new Date("2025-03-22T12:00:00.000Z"),
              end: new Date("2025-03-22T13:00:00.000Z"),
            })
          }
        >
          Trigger Valid Event Resize
        </button>
        <button
          onClick={() =>
            props.onEventResize({
              event: props.events[0],
              start: new Date("2025-03-22T12:00:00.000Z"),
              end: new Date("2025-03-23T13:00:00.000Z"), // multi-day resize
            })
          }
        >
          Trigger Invalid Event Resize
        </button>
        <button
          onClick={() =>
            props.onDropFromOutside({
              start: new Date("2025-03-22T14:00:00.000Z"),
              end: new Date("2025-03-22T15:00:00.000Z"),
            })
          }
        >
          Trigger Valid Drop From Outside
        </button>
        <button
          onClick={() =>
            props.onDropFromOutside({
              start: new Date("2025-03-22T14:00:00.000Z"),
              end: new Date("2025-03-23T15:00:00.000Z"), // multi-day drop
            })
          }
        >
          Trigger Invalid Drop From Outside
        </button>
        <button
          onClick={() =>
            props.onSelectSlot({
              start: new Date("2025-03-22T16:00:00.000Z"),
              end: new Date("2025-03-22T17:00:00.000Z"),
              action: "select",
            })
          }
        >
          Trigger Slot Selection (Week)
        </button>
        <button onClick={() => props.onView("month")}>Set Month View</button>
        <button
          onClick={() =>
            props.onSelectSlot({
              start: new Date("2025-03-22T16:00:00.000Z"),
              end: new Date("2025-03-22T17:00:00.000Z"),
              action: "select",
            })
          }
        >
          Trigger Slot Selection (Month)
        </button>
      </div>
    );
  };
});

const defaultUserSettings = {
  labelColorblindMode: false,
  hideLabelText: false,
};

const renderScheduleView = (ui) =>
  render(
    <BrowserRouter>
      {React.cloneElement(ui, { userSettings: defaultUserSettings })}
    </BrowserRouter>,
  );

function TestWrapper({ initialTasks }) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const handleUpdateTaskInState = (updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)),
    );
  };
  return (
    <ScheduleView
      tasks={tasks}
      updateTaskInState={handleUpdateTaskInState}
      onCreateTaskShortcut={() => {}}
      userSettings={defaultUserSettings}
    />
  );
}

// =======================
// UNIT TESTS
// =======================
describe("ScheduleView - Unit Tests", () => {
  const dummyUpdateTaskInState = jest.fn();
  const dummyOnCreateTaskShortcut = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    dummyUpdateTaskInState.mockClear();
    dummyOnCreateTaskShortcut.mockClear();
    jest.clearAllMocks();
  });

  test("Valid Event Drop: updates event times and calls updateTaskSchedule and updateTaskInState", async () => {
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByText("Trigger Valid Event Drop"));

    await waitFor(() => {
      expect(
        require("../../../src/services/tasksService").updateTaskSchedule,
      ).toHaveBeenCalledWith(scheduledTask._id, {
        scheduledStart: "2025-03-22T12:00:00.000Z",
        scheduledEnd: "2025-03-22T13:00:00.000Z",
      });
      expect(dummyUpdateTaskInState).toHaveBeenCalledWith({
        _id: "1",
        title: "Scheduled Task",
        priority: "A1",
        scheduledStart: "2025-03-22T12:00:00.000Z",
        scheduledEnd: "2025-03-22T13:00:00.000Z",
      });
    });
  });

  test("Invalid Drop – Multi-day Event: does not update and logs warning", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByText("Trigger Invalid Multi-day Drop"));

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        "Drop results in a multi-day event, ignoring drop.",
      );
      expect(
        require("../../../src/services/tasksService").updateTaskSchedule,
      ).not.toHaveBeenCalled();
    });
    consoleWarnSpy.mockRestore();
  });

  test("Invalid Drop – Same Start and End: does not update and logs warning", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByText("Trigger Invalid Same Time Drop"));

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        "Drop results in an event with the same start and end time, ignoring drop.",
      );
      expect(
        require("../../../src/services/tasksService").updateTaskSchedule,
      ).not.toHaveBeenCalled();
    });
    consoleWarnSpy.mockRestore();
  });

  test("Valid Event Resize: updates event times and calls updateTaskSchedule and updateTaskInState", async () => {
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByText("Trigger Valid Event Resize"));

    await waitFor(() => {
      expect(
        require("../../../src/services/tasksService").updateTaskSchedule,
      ).toHaveBeenCalledWith(scheduledTask._id, {
        scheduledStart: "2025-03-22T12:00:00.000Z",
        scheduledEnd: "2025-03-22T13:00:00.000Z",
      });
      expect(dummyUpdateTaskInState).toHaveBeenCalledWith({
        _id: "1",
        title: "Scheduled Task",
        priority: "A1",
        scheduledStart: "2025-03-22T12:00:00.000Z",
        scheduledEnd: "2025-03-22T13:00:00.000Z",
      });
    });
  });

  test("Invalid Event Resize: does not update and logs warning", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByText("Trigger Invalid Event Resize"));

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        "Resize results in a multi-day event, ignoring resize.",
      );
      expect(
        require("../../../src/services/tasksService").updateTaskSchedule,
      ).not.toHaveBeenCalled();
    });
    consoleWarnSpy.mockRestore();
  });

  test("Valid Drop from Outside: updates task schedule, removes task from unscheduled list, and calls updateTask and updateTaskInState", async () => {
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unscheduled Tasks" }));
    const unscheduledTaskItem = screen.getByText("Unscheduled Task");
    const dataTransfer = { setData: jest.fn() };
    fireEvent.dragStart(unscheduledTaskItem, { dataTransfer });
    fireEvent.click(screen.getByText("Trigger Valid Drop From Outside"));

    await waitFor(() => {
      expect(
        require("../../../src/services/tasksService").updateTask,
      ).toHaveBeenCalledWith({
        ...unscheduledTask,
        scheduledStart: "2025-03-22T14:00:00.000Z",
        scheduledEnd: "2025-03-22T15:00:00.000Z",
      });
      expect(dummyUpdateTaskInState).toHaveBeenCalledWith({
        ...unscheduledTask,
        scheduledStart: "2025-03-22T14:00:00.000Z",
        scheduledEnd: "2025-03-22T15:00:00.000Z",
      });
    });
  });

  test("Invalid Drop from Outside: does not update task schedule and logs warning", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unscheduled Tasks" }));
    const unscheduledTaskItem = screen.getByText("Unscheduled Task");
    const dataTransfer = { setData: jest.fn() };
    fireEvent.dragStart(unscheduledTaskItem, { dataTransfer });
    fireEvent.click(screen.getByText("Trigger Invalid Drop From Outside"));

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        "Drop from outside results in a multi-day event, ignoring drop.",
      );
      expect(
        require("../../../src/services/tasksService").updateTask,
      ).not.toHaveBeenCalled();
    });
    consoleWarnSpy.mockRestore();
  });

  test("Slot Selection in Week View calls onCreateTaskShortcut with correct dates", () => {
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByText("Trigger Slot Selection (Week)"));
    expect(dummyOnCreateTaskShortcut).toHaveBeenCalledWith(
      new Date("2025-03-22T16:00:00.000Z"),
      new Date("2025-03-22T17:00:00.000Z"),
    );
  });

  test("Slot Selection in Month View does not call onCreateTaskShortcut", () => {
    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={dummyUpdateTaskInState}
        onCreateTaskShortcut={dummyOnCreateTaskShortcut}
      />,
    );
    fireEvent.click(screen.getByText("Set Month View"));
    fireEvent.click(screen.getByText("Trigger Slot Selection (Month)"));
    expect(dummyOnCreateTaskShortcut).not.toHaveBeenCalled();
  });

  test("renders a minimal 30-minute event with 'custom-event-min-height', time, and priority", () => {
    const shortEvent = {
      _id: "short1",
      title: "Short Task",
      priority: "A1",
      scheduledStart: "2025-03-22T10:00:00.000Z",
      scheduledEnd: "2025-03-22T10:30:00.000Z",
    };

    const tasks = [shortEvent];

    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={() => {}}
        onCreateTaskShortcut={() => {}}
      />,
    );

    const eventElements = screen.queryAllByTestId("calendar-event");
    expect(eventElements[0]).toHaveTextContent("Short Task");
    expect(eventElements[0]).toHaveTextContent("10:00 AM");
  });

  test("renders a full event layout for an event longer than 30 minutes", () => {
    const longEvent = {
      _id: "long1",
      title: "Long Task",
      priority: "B1",
      scheduledStart: "2025-03-22T10:00:00.000Z",
      scheduledEnd: "2025-03-22T11:00:00.000Z",
    };

    const tasks = [longEvent];

    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={() => {}}
        onCreateTaskShortcut={() => {}}
      />,
    );

    const eventElements = screen.queryAllByTestId("calendar-event");
    expect(eventElements[0]).toHaveTextContent("Long Task");
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("ScheduleView - Integration Tests", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  test("Complete interaction: Calendar initially does not show unscheduled task, then after drop shows it", async () => {
    renderScheduleView(<TestWrapper initialTasks={tasks} />);
    const calendarEvents = screen.getByTestId("calendar-events");
    expect(calendarEvents).toHaveTextContent("Scheduled Task");
    expect(calendarEvents).not.toHaveTextContent("Unscheduled Task");

    fireEvent.click(screen.getByRole("button", { name: "Unscheduled Tasks" }));
    expect(screen.getByText("Unscheduled Task")).toBeInTheDocument();

    const unscheduledTaskItem = screen.getByText("Unscheduled Task");
    const dataTransfer = { setData: jest.fn() };
    fireEvent.dragStart(unscheduledTaskItem, { dataTransfer });

    fireEvent.click(screen.getByText("Trigger Valid Drop From Outside"));

    await waitFor(() => {
      expect(
        require("../../../src/services/tasksService").updateTask,
      ).toHaveBeenCalledWith({
        ...unscheduledTask,
        scheduledStart: "2025-03-22T14:00:00.000Z",
        scheduledEnd: "2025-03-22T15:00:00.000Z",
      });
    });

    await waitFor(() => {
      const updatedCalendarEvents = screen.getByTestId("calendar-events");
      expect(updatedCalendarEvents).toHaveTextContent("Scheduled Task");
      expect(updatedCalendarEvents).toHaveTextContent("Unscheduled Task");
    });

    const unscheduledList = document.querySelector(".unscheduled-tasks-list");
    expect(unscheduledList).not.toHaveTextContent("Unscheduled Task");
  });

  test("does not call onCreateTaskShortcut when disableToCreateTask is true", () => {
    const disableToCreateTask = true;
    const onCreateTaskShortcut = jest.fn();
    const conditionalOnCreateTaskShortcut = (start, end) => {
      if (disableToCreateTask) return;
      onCreateTaskShortcut(start, end);
    };

    renderScheduleView(
      <ScheduleView
        tasks={tasks}
        updateTaskInState={() => {}}
        onCreateTaskShortcut={conditionalOnCreateTaskShortcut}
      />,
    );

    fireEvent.click(screen.getByText("Trigger Slot Selection (Week)"));
    expect(onCreateTaskShortcut).not.toHaveBeenCalled();
  });

  // ---------------------------
  // TaskLabels
  // ---------------------------
  describe("ScheduleView - TaskLabels Integration", () => {
    const taskWithLabel = createBaseTask({
      _id: "3",
      title: "Unscheduled With Label",
      priority: "A1",
      scheduledStart: null,
      scheduledEnd: null,
      labels: [{ title: "Urgent", color: "red" }],
    });

    test("renders TaskLabels with visible text when hideLabelText is false", () => {
      const customSettings = {
        labelColorblindMode: false,
        hideLabelText: false,
      };
      render(
        <BrowserRouter>
          <ScheduleView
            tasks={[taskWithLabel]}
            updateTaskInState={() => {}}
            onCreateTaskShortcut={() => {}}
            userSettings={customSettings}
          />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Unscheduled Tasks"));
      const urgentLabel = screen.getByText("Urgent");
      expect(urgentLabel).toBeInTheDocument();
      expect(urgentLabel.className).not.toContain("colorblind-label");
      expect(urgentLabel.style.getPropertyValue("--pattern-image")).toBe("");
    });

    test("renders TaskLabels with hidden text and colorblind styling when hideLabelText is true and labelColorblindMode is true", async () => {
      const customSettings = { labelColorblindMode: true, hideLabelText: true };
      render(
        <BrowserRouter>
          <ScheduleView
            tasks={[taskWithLabel]}
            updateTaskInState={() => {}}
            onCreateTaskShortcut={() => {}}
            userSettings={customSettings}
          />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Unscheduled Tasks"));
      await waitFor(() => {
        expect(
          document.querySelector(".unscheduled-tasks-list"),
        ).not.toBeNull();
      });
      const unscheduledList = document.querySelector(".unscheduled-tasks-list");
      const labelSpan = unscheduledList.querySelector("span");
      expect(labelSpan).toBeDefined();
      expect(labelSpan.textContent).toBe("");
      expect(labelSpan.className).toContain("colorblind-label");
      const expectedPattern = generatePattern(getLabelVariant("Urgent"));
      expect(labelSpan.style.getPropertyValue("--pattern-image")).toBe(
        expectedPattern,
      );
    });
  });
});
