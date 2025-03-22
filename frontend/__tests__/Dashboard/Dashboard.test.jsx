import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard, { getBaseRoute } from "../../src/pages/Dashboard/Dashboard";
import { NotificationsContext } from "../../src/contexts/NotificationsContext";

jest.mock("../../src/firebase", () => ({
  auth: { currentUser: { uid: "test-user" } },
}));

jest.mock("../../src/services/tasksService", () => ({
  fetchTasks: jest.fn(() => Promise.resolve({ data: [] })),
  createTask: jest.fn(() => Promise.resolve({ data: {} })),
  updateTask: jest.fn(() => Promise.resolve({ data: {} })),
  completeTask: jest.fn(() => Promise.resolve({ data: {} })),
  deleteTaskAPI: jest.fn(() => Promise.resolve({})),
  startTimerAPI: jest.fn(() => Promise.resolve({ data: {} })),
  stopTimerAPI: jest.fn(() => Promise.resolve({ data: {} })),
  reorderTasks: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../../src/services/columnsService", () => ({
  fetchColumnOrder: jest.fn(() =>
    Promise.resolve({ data: { columnOrder: [], columnNames: {} } })
  ),
  createBoard: jest.fn(() => Promise.resolve({ data: {} })),
  saveColumnOrder: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../../src/components/navigation/Layout", () => {
  return ({ children, openModal }) => (
    <div data-testid="layout">
      <div data-testid="layout-openModal">{openModal ? "true" : "false"}</div>
      {children}
    </div>
  );
});

jest.mock("../../src/components/navigation/TopBar", () => {
  return ({ buttons, openModal, navigate }) => (
    <div data-testid="topbar">
      {buttons.map((btn, index) => (
        <button key={index} data-testid="topbar-button">
          {btn.label}
        </button>
      ))}
    </div>
  );
});

jest.mock("../../src/config/topBarConfig", () => ({
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

jest.mock("../../src/components/modals/CreateTaskModal", () => {
  return ({ isModalOpen, closeModal }) => (
    <div data-testid="create-task-modal">{isModalOpen ? "open" : "closed"}</div>
  );
});

jest.mock("../../src/components/modals/ViewTaskModal", () => {
  return ({ isModalOpen, closeModal }) => (
    <div data-testid="view-task-modal">{isModalOpen ? "open" : "closed"}</div>
  );
});

jest.mock("../../src/components/modals/ScheduleEditModal", () => {
  return ({ isModalOpen, onSave, onUnschedule, onClose }) => (
    <div data-testid="schedule-edit-modal">
      {isModalOpen ? "open" : "closed"}
    </div>
  );
});

jest.mock("../../src/pages/Dashboard/BoardsView", () => {
  return (props) => <div data-testid="boards-view">BoardsView</div>;
});

jest.mock("../../src/pages/Dashboard/CompletedTasks", () => {
  return (props) => <div data-testid="completed-tasks">CompletedTasks</div>;
});

jest.mock("../../src/pages/Dashboard/ScheduleView", () => {
  return (props) => <div data-testid="schedule-view">ScheduleView</div>;
});

const notificationsProviderValue = { setNotifications: jest.fn() };

const Wrapper = ({ children }) => (
  <NotificationsContext.Provider value={notificationsProviderValue}>
    {children}
  </NotificationsContext.Provider>
);

// --- Tests ---
describe("Dashboard Component", () => {
  test("renders Layout, TopBar, and BoardsView for /dashboard/boards route", async () => {
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.getByTestId("boards-view")).toBeInTheDocument();

    expect(screen.getByTestId("create-task-modal")).toHaveTextContent("closed");
    expect(screen.getByTestId("view-task-modal")).toHaveTextContent("closed");
    expect(screen.getByTestId("schedule-edit-modal")).toHaveTextContent(
      "closed"
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
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );
    expect(screen.getByTestId("completed-tasks")).toBeInTheDocument();
  });

  test("renders ScheduleView when route is /dashboard/schedule", () => {
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/schedule"]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );
    expect(screen.getByTestId("schedule-view")).toBeInTheDocument();
  });

  test("opens CreateTaskModal when route is /dashboard/boards/createtask", async () => {
    const path = "/dashboard/boards/createtask";
    expect(getBaseRoute(path)).toBe("/dashboard/boards");

    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent("open")
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("opens CreateTaskModal when route is /dashboard/schedule/createtask", async () => {
    const path = "/dashboard/schedule/createtask";
    expect(getBaseRoute(path)).toBe("/dashboard/schedule");

    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent("open")
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("opens CreateTaskModal when route is /dashboard/completedtasks/createtask", async () => {
    const path = "/dashboard/completedtasks/createtask";
    expect(getBaseRoute(path)).toBe("/dashboard/completedtasks");

    render(
      <Wrapper>
        <MemoryRouter initialEntries={[path]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent("open")
    );
    expect(screen.getByTestId("layout-openModal")).toHaveTextContent("true");
  });

  test("getBaseRoute returns '/dashboard/boards' for an invalid base route", () => {
    expect(getBaseRoute("/dashboard/schedulebadroute/createtask")).toBe(
      "/dashboard/boards"
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
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );
    await waitFor(() =>
      expect(screen.getByTestId("create-task-modal")).toHaveTextContent(
        "closed"
      )
    );
  });

  test("opens ViewTaskModal when route is /dashboard/boards/viewtask/123 and matching task exists", async () => {
    const { fetchTasks } = require("../../src/services/tasksService");
    const { fetchColumnOrder } = require("../../src/services/columnsService");
    fetchTasks.mockImplementationOnce(() =>
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
      })
    );
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({
        data: { columnOrder: ["inbox"], columnNames: { inbox: "Inbox" } },
      })
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards/viewtask/123"]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );
    await waitFor(() =>
      expect(screen.getByTestId("view-task-modal")).toHaveTextContent("open")
    );
  });

  test("opens ScheduleEditModal when route is /dashboard/schedule/editevent/123 and matching task exists", async () => {
    const { fetchTasks } = require("../../src/services/tasksService");
    const { fetchColumnOrder } = require("../../src/services/columnsService");
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
      })
    );
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          columnOrder: ["someStatus"],
          columnNames: { someStatus: "Column 1" },
        },
      })
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/schedule/editevent/123"]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );
    await waitFor(() =>
      expect(screen.getByTestId("schedule-edit-modal")).toHaveTextContent(
        "open"
      )
    );
  });

  test("does not open ViewTaskModal when no matching task exists", async () => {
    const { fetchTasks } = require("../../src/services/tasksService");
    const { fetchColumnOrder } = require("../../src/services/columnsService");
    fetchTasks.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({ data: { columnOrder: [], columnNames: {} } })
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/boards/viewtask/999"]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );
    await waitFor(() =>
      expect(screen.getByTestId("view-task-modal")).toHaveTextContent("closed")
    );
  });

  test("does not open ScheduleEditModal when no matching task exists", async () => {
    const { fetchTasks } = require("../../src/services/tasksService");
    const { fetchColumnOrder } = require("../../src/services/columnsService");
    fetchTasks.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    fetchColumnOrder.mockImplementationOnce(() =>
      Promise.resolve({ data: { columnOrder: [], columnNames: {} } })
    );
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/dashboard/schedule/editevent/999"]}>
          <Dashboard />
        </MemoryRouter>
      </Wrapper>
    );
    await waitFor(() =>
      expect(screen.getByTestId("schedule-edit-modal")).toHaveTextContent(
        "closed"
      )
    );
  });
});
