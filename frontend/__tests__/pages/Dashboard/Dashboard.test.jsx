import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard, {
  getBaseRoute,
} from "../../../src/pages/Dashboard/Dashboard";
import { NotificationsContext } from "../../../src/contexts/NotificationsContext";
import { toast } from "react-toastify";

jest.mock("../../../src/firebase", () => {
  const { createBaseUser } = require("../../../_testUtils/createBaseUser");
  return {
    auth: { currentUser: { uid: createBaseUser().userId } },
  };
});

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../src/services/tasksService", () => ({
  fetchTasks: jest.fn(() => Promise.resolve({ data: [] })),
  createTask: jest.fn(() => Promise.resolve({ data: {} })),
  updateTask: jest.fn(() => Promise.resolve({ data: {} })),
  completeTask: jest.fn(() => Promise.resolve({ data: {} })),
  deleteTaskAPI: jest.fn(() => Promise.resolve({})),
  startTimerAPI: jest.fn(() => Promise.resolve({ data: {} })),
  stopTimerAPI: jest.fn(() => Promise.resolve({ data: {} })),
  reorderTasks: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../../../src/services/columnsService", () => ({
  fetchColumnOrder: jest.fn(() =>
    Promise.resolve({ data: { columnOrder: [], columnNames: {} } }),
  ),
  createBoard: jest.fn(() => Promise.resolve({ data: {} })),
  saveColumnOrder: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../../../src/services/preferencesService", () => ({
  fetchSettingsPreferences: jest.fn(() =>
    Promise.resolve({ data: { settingsPreferences: {} } }),
  ),
}));

jest.mock("../../../src/components/navigation/Layout", () => {
  return ({ children, openModal }) => (
    <div data-testid="layout">
      <div data-testid="layout-openModal">{openModal ? "true" : "false"}</div>
      {children}
    </div>
  );
});

jest.mock("../../../src/components/navigation/TopBar", () => {
  return ({ buttons }) => (
    <div data-testid="topbar">
      {buttons.map((btn, index) => (
        <button key={index} data-testid="topbar-button">
          {btn.label}
        </button>
      ))}
    </div>
  );
});

jest.mock("../../../src/config/topBarConfig", () => ({
  getDashboardTopBarConfig: jest.fn(() => [
    { label: "Boards", route: "/dashboard/boards", active: true },
    {
      label: "Completed Tasks",
      route: "/dashboard/completedtasks",
      active: false,
    },
    { label: "Schedule", route: "/dashboard/schedule", active: false },
  ]),
}));

jest.mock("../../../src/components/modals/CreateTaskModal", () => {
  return ({ isModalOpen }) => (
    <div data-testid="create-task-modal">{isModalOpen ? "open" : "closed"}</div>
  );
});

jest.mock("../../../src/components/modals/LabelsModal", () => {
  return ({ isOpen }) => (
    <div data-testid="labels-modal">{isOpen ? "open" : "closed"}</div>
  );
});

jest.mock("../../../src/components/modals/ViewTaskModal", () => {
  return ({ isModalOpen }) => (
    <div data-testid="view-task-modal">{isModalOpen ? "open" : "closed"}</div>
  );
});

jest.mock("../../../src/components/modals/ScheduleEditModal", () => {
  return ({ isModalOpen }) => (
    <div data-testid="schedule-edit-modal">
      {isModalOpen ? "open" : "closed"}
    </div>
  );
});

jest.mock("../../../src/pages/Dashboard/BoardsView", () => {
  return (props) => (
    <div data-testid="boards-view">
      BoardsView
      {props.deleteTask && (
        <button
          data-testid="delete-task-button-task-1"
          onClick={() => props.deleteTask("task-1")}
        >
          Delete Task
        </button>
      )}
      {props.duplicateTask && (
        <button
          data-testid="duplicate-task-button-task-1"
          onClick={() =>
            props.duplicateTask({
              _id: "task-1",
              title: "Task with Timer",
              priority: "A1",
              status: "in-progress",
              userId: "user1",
              description: "Some description",
              assignedTo: "someone",
              dueDate: "2022-01-05T10:00:00.000Z",
              storyPoints: 3,
              scheduledStart: "2022-01-05T09:00:00.000Z",
              scheduledEnd: "2022-01-05T11:00:00.000Z",
              order: 2,
              timeSpent: 120,
              isTimerRunning: true,
              timerStartTime: "2022-01-05T09:00:00.000Z",
              labels: [{ title: "Urgent", color: "#ff0000" }],
            })
          }
        >
          Duplicate
        </button>
      )}
    </div>
  );
});
jest.mock("../../../src/pages/Dashboard/CompletedTasks", () => {
  return () => <div data-testid="completed-tasks">CompletedTasks</div>;
});

jest.mock("../../../src/pages/Dashboard/ScheduleView", () => {
  return () => <div data-testid="schedule-view">ScheduleView</div>;
});

const defaultUserSettings = {
  darkMode: false,
  defaultPriority: "A1",
  hideOldCompletedTasksDays: 30,
  defaultDashboardView: "boards",
  disableToCreateTask: false,
  confirmBeforeDelete: true,
  notifyNonPriorityGoesOvertime: 60,
  notifyScheduledTaskIsDue: 60,
  themeAccent: "Green",
};

const notificationsProviderValue = { setNotifications: jest.fn() };

const Wrapper = ({ children }) => (
  <NotificationsContext.Provider value={notificationsProviderValue}>
    {children}
  </NotificationsContext.Provider>
);

describe("Dashboard Duplicate Task Integration Toasts", () => {
  const tasksService = require("../../../src/services/tasksService");
  const columnsService = require("../../../src/services/columnsService");

  const originalTask = {
    _id: "task-1",
    title: "Task with Timer",
    priority: "A1",
    status: "in-progress",
    userId: "user1",
    description: "Some description",
    assignedTo: "someone",
    dueDate: "2022-01-05T10:00:00.000Z",
    storyPoints: 3,
    scheduledStart: "2022-01-05T09:00:00.000Z",
    scheduledEnd: "2022-01-05T11:00:00.000Z",
    order: 2,
    timeSpent: 120,
    isTimerRunning: true,
    timerStartTime: "2022-01-05T09:00:00.000Z",
    labels: [{ title: "Urgent", color: "#ff0000" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("displays success toast on successful duplicate", async () => {
    tasksService.fetchTasks.mockImplementationOnce(() =>
      Promise.resolve({ data: [originalTask] }),
    );
    columnsService.fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          columnOrder: ["in-progress"],
          columnNames: { "in-progress": "In Progress" },
        },
      }),
    );

    const duplicateTaskResponse = {
      _id: "task-dup",
      title: "Task with Timer",
      priority: "A1",
      status: "in-progress",
      userId: "user1",
      description: "Some description",
      assignedTo: "someone",
      dueDate: "2022-01-05T10:00:00.000Z",
      storyPoints: 3,
      scheduledStart: null,
      scheduledEnd: null,
      order: originalTask.order + 1, // 3
      timeSpent: 0,
      isTimerRunning: false,
      timerStartTime: null,
      labels: originalTask.labels,
    };
    tasksService.createTask.mockImplementationOnce(() =>
      Promise.resolve({ data: duplicateTaskResponse }),
    );

    render(
      <NotificationsContext.Provider value={{ setNotifications: jest.fn() }}>
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </NotificationsContext.Provider>,
    );

    const duplicateButton = screen.getByTestId("duplicate-task-button-task-1");
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(tasksService.createTask).toHaveBeenCalledTimes(1);
    });

    expect(tasksService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Task with Timer",
        order: originalTask.order + 1,
        timeSpent: 0,
        isTimerRunning: false,
        timerStartTime: null,
        scheduledStart: null,
        scheduledEnd: null,
        labels: originalTask.labels,
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Task duplicated!");
    });
  });

  test("displays error toast when duplicate fails", async () => {
    tasksService.fetchTasks.mockImplementationOnce(() =>
      Promise.resolve({ data: [originalTask] }),
    );
    columnsService.fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          columnOrder: ["in-progress"],
          columnNames: { "in-progress": "In Progress" },
        },
      }),
    );
    tasksService.createTask.mockImplementationOnce(() =>
      Promise.reject(new Error("Duplicate failed")),
    );

    render(
      <NotificationsContext.Provider value={{ setNotifications: jest.fn() }}>
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </NotificationsContext.Provider>,
    );

    const duplicateButton = screen.getByTestId("duplicate-task-button-task-1");
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(tasksService.createTask).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to duplicate task");
    });
  });
});

describe("handleDeleteTask toast messages", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  test("displays success toast on successful task deletion", async () => {
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );

    const deleteButton = screen.getByTestId("delete-task-button-task-1");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Task deleted!");
    });
  });

  test("displays error toast when task deletion fails", async () => {
    const { deleteTaskAPI } = require("../../../src/services/tasksService");
    deleteTaskAPI.mockImplementationOnce(() =>
      Promise.reject(new Error("Delete failed")),
    );

    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );

    const deleteButton = screen.getByTestId("delete-task-button-task-1");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete task!");
    });
  });
});

describe("Dashboard Component", () => {
  test("renders Layout, TopBar, and BoardsView for /dashboard/boards route", async () => {
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.getByTestId("boards-view")).toBeInTheDocument();

    expect(screen.getByTestId("create-task-modal")).toHaveTextContent("closed");
    expect(screen.getByTestId("view-task-modal")).toHaveTextContent("closed");
    expect(screen.getByTestId("schedule-edit-modal")).toHaveTextContent(
      "closed",
    );

    const topbarButtons = screen.getAllByTestId("topbar-button");
    expect(topbarButtons[0]).toHaveTextContent("Boards");
    expect(topbarButtons[1]).toHaveTextContent("Completed Tasks");
    expect(topbarButtons[2]).toHaveTextContent("Schedule");
  });

  test("renders CompletedTasks when route is /dashboard/completedtasks", () => {
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/completedtasks"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    expect(screen.getByTestId("completed-tasks")).toBeInTheDocument();
  });

  test("renders ScheduleView when route is /dashboard/schedule", () => {
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/schedule"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    expect(screen.getByTestId("schedule-view")).toBeInTheDocument();
  });

  test("opens CreateTaskModal when route is /dashboard/boards/createtask", async () => {
    const path = "/dashboard/boards/createtask";
    expect(getBaseRoute(path)).toBe("/dashboard/boards");

    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent("open"),
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("opens CreateTaskModal when route is /dashboard/schedule/createtask", async () => {
    const path = "/dashboard/schedule/createtask";
    expect(getBaseRoute(path)).toBe("/dashboard/schedule");

    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent("open"),
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("opens CreateTaskModal when route is /dashboard/completedtasks/createtask", async () => {
    const path = "/dashboard/completedtasks/createtask";
    expect(getBaseRoute(path)).toBe("/dashboard/completedtasks");

    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent("open"),
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("opens LabelsModal when route is /dashboard/boards/labels", async () => {
    const path = "/dashboard/boards/labels";
    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("labels-modal")).toHaveTextContent("open"),
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("opens LabelsModal when route is /dashboard/schedule/labels", async () => {
    const path = "/dashboard/schedule/labels";
    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("labels-modal")).toHaveTextContent("open"),
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("opens LabelsModal when route is /dashboard/completedtasks/labels", async () => {
    const path = "/dashboard/schedule/labels";
    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("labels-modal")).toHaveTextContent("open"),
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("getBaseRoute returns '/dashboard/boards' for an invalid base route", () => {
    expect(getBaseRoute("/dashboard/schedulebadroute/createtask")).toBe(
      "/dashboard/boards",
    );
  });

  test.each([
    ["/dashboard/boards", "/dashboard/boards"],
    ["/dashboard/completedtasks", "/dashboard/completedtasks"],
    ["/dashboard/schedule", "/dashboard/schedule"],
    ["/dashboard/viewtask/123", "/dashboard/boards"],
    ["/dashboard/createtask", "/dashboard/boards"],
    ["/dashboard/random", "/dashboard/boards"],
    ["/dashboard", "/dashboard/boards"],
  ])("getBaseRoute returns %s → %s", (input, expected) => {
    expect(getBaseRoute(input)).toBe(expected);
  });

  test("does not open CreateTaskModal when route base is invalid", async () => {
    render(
      <Wrapper>
        <MemoryRouter
          initialEntries={["/dashboard/scheduleqeafihjpwe/createtask"]}
        >
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent(
        "closed",
      ),
    );
  });

  test("does not open LabelsModal when route base is invalid", async () => {
    const path = "/dashboard/invalid/labels";
    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("labels-modal")).toHaveTextContent("closed"),
    );
  });

  test("opens ViewTaskModal when route is /dashboard/boards/viewtask/123 and matching task exists", async () => {
    const { fetchTasks } = require("../../../src/services/tasksService");
    const {
      fetchColumnOrder,
    } = require("../../../src/services/columnsService");
    fetchTasks.mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            _id: "123",
            title: "Task for view",
            status: "inbox",
            isTimerRunning: false,
            timerStartTime: null,
          },
        ],
      }),
    );
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({
        data: { columnOrder: ["inbox"], columnNames: { inbox: "Inbox" } },
      }),
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards/viewtask/123"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("view-task-modal")).toHaveTextContent("open"),
    );
  });

  test("opens ScheduleEditModal when route is /dashboard/schedule/editevent/123 and matching task exists", async () => {
    const { fetchTasks } = require("../../../src/services/tasksService");
    const {
      fetchColumnOrder,
    } = require("../../../src/services/columnsService");
    fetchTasks.mockImplementationOnce(() =>
      Promise.resolve({
        data: [
          {
            _id: "123",
            title: "Task for schedule",
            scheduledStart: "2025-03-25T12:00:00.000Z",
            scheduledEnd: "2025-03-25T13:00:00.000Z",
            status: "someStatus",
            isTimerRunning: false,
            timerStartTime: null,
          },
        ],
      }),
    );
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          columnOrder: ["someStatus"],
          columnNames: { someStatus: "Column 1" },
        },
      }),
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/schedule/editevent/123"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("schedule-edit-modal")).toHaveTextContent(
        "open",
      ),
    );
  });

  test("does not open ViewTaskModal when no matching task exists", async () => {
    const { fetchTasks } = require("../../../src/services/tasksService");
    const {
      fetchColumnOrder,
    } = require("../../../src/services/columnsService");
    fetchTasks.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({ data: { columnOrder: [], columnNames: {} } }),
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards/viewtask/999"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("view-task-modal")).toHaveTextContent("closed"),
    );
  });

  test("does not open ScheduleEditModal when no matching task exists", async () => {
    const { fetchTasks } = require("../../../src/services/tasksService");
    const {
      fetchColumnOrder,
    } = require("../../../src/services/columnsService");
    fetchTasks.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({ data: { columnOrder: [], columnNames: {} } }),
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/schedule/editevent/999"]}>
          <Dashboard
            userSettings={defaultUserSettings}
            setUserSettings={jest.fn()}
          />
        </MemoryRouter>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("schedule-edit-modal")).toHaveTextContent(
        "closed",
      ),
    );
  });
});
