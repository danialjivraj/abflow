import React from "react";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../src/pages/Dashboard/Dashboard";
import { NotificationsContext } from "../src/contexts/NotificationsContext";
import * as tasksService from "../src/services/tasksService";
import * as columnsService from "../src/services/columnsService";

jest.mock("../src/services/tasksService");
jest.mock("../src/services/columnsService");

jest.mock("../src/firebase", () => ({
  auth: {
    currentUser: { uid: "testUser" },
    signOut: jest.fn(),
  },
}));

const notificationsContextValue = {
  notifications: [],
  setNotifications: jest.fn(),
};

describe("Dashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tasksService.fetchTasks.mockResolvedValue({ data: [] });
    columnsService.fetchColumnOrder.mockResolvedValue({
      data: {
        columnOrder: ["backlog"],
        columnNames: { backlog: "Backlog" },
      },
    });
  });

  // ---------------------------
  // TopBar and Layout Rendering
  // ---------------------------
  test("renders TopBar and Layout components", async () => {
    render(
      <NotificationsContext.Provider value={notificationsContextValue}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Dashboard />
        </MemoryRouter>
      </NotificationsContext.Provider>
    );
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(tasksService.fetchTasks).toHaveBeenCalledWith("testUser");
    });
  });

  // ---------------------------
  // CreateTaskModal Opening
  // ---------------------------
  test("opens CreateTaskModal when route is /dashboard/createtask", async () => {
    render(
      <NotificationsContext.Provider value={notificationsContextValue}>
        <MemoryRouter initialEntries={["/dashboard/createtask"]}>
          <Dashboard />
        </MemoryRouter>
      </NotificationsContext.Provider>
    );
    const heading = await screen.findByText("Create New Task");
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/Task Title:/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter Task Title/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  // ---------------------------
  // API Calls on Component Mount
  // ---------------------------
  test("fetches tasks and board configuration on mount", async () => {
    render(
      <NotificationsContext.Provider value={notificationsContextValue}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Dashboard />
        </MemoryRouter>
      </NotificationsContext.Provider>
    );
    await waitFor(() => {
      expect(tasksService.fetchTasks).toHaveBeenCalledTimes(1);
      expect(columnsService.fetchColumnOrder).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------
  // Sidebar and Top Bar Structure
  // ---------------------------
  test("renders sidebar and top bar with expected elements and Dashboard is active", async () => {
    const { container } = render(
      <NotificationsContext.Provider value={notificationsContextValue}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Dashboard />
        </MemoryRouter>
      </NotificationsContext.Provider>
    );
    // Sidebar
    expect(screen.getByText("ABFlow")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Charts")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Logout/i })
    ).toBeInTheDocument();

    const dashboardElement = screen.getByText("Dashboard");
    expect(dashboardElement).toHaveClass("active");
    const chartsElement = screen.getByText("Charts");
    expect(chartsElement).not.toHaveClass("active");
    const profileElement = screen.getByText("Profile");
    expect(profileElement).not.toHaveClass("active");

    // Topbar
    expect(
      screen.getByRole("button", { name: /Boards/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Schedule/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Completed Tasks/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Task/i })
    ).toBeInTheDocument();
    const notificationsButton = container.querySelector(".notification-button");
    expect(notificationsButton).toBeInTheDocument();
  });

  // ---------------------------
  // TopBar Navigation with CreateTaskModal
  // ---------------------------
  test("navigates to /createtask appended to each dashboard sub-route and marks appropriate top bar button active", async () => {
    const routes = [
      { route: "/dashboard/boards/createtask", activeButton: "Boards" },
      { route: "/dashboard/schedule/createtask", activeButton: "Schedule" },
      {
        route: "/dashboard/completedtasks/createtask",
        activeButton: "Completed Tasks",
      },
    ];
    for (const { route, activeButton } of routes) {
      const { container, unmount } = render(
        <NotificationsContext.Provider value={notificationsContextValue}>
          <MemoryRouter initialEntries={[route]}>
            <Dashboard />
          </MemoryRouter>
        </NotificationsContext.Provider>
      );
      const heading = await screen.findByText("Create New Task");
      expect(heading).toBeInTheDocument();

      const topBar = container.querySelector(".top-bar");
      const matchingButtons = within(topBar).getAllByRole("button", {
        name: new RegExp(activeButton, "i"),
      });
      const activeTopButton = matchingButtons.find((btn) =>
        btn.classList.contains("active")
      );
      expect(activeTopButton).toBeDefined();

      const allTopButtons = ["Boards", "Schedule", "Completed Tasks"];
      allTopButtons.forEach((btnName) => {
        const buttons = within(topBar).getAllByRole("button", {
          name: new RegExp(btnName, "i"),
        });
        buttons.forEach((button) => {
          if (btnName === activeButton) {
            expect(button).toHaveClass("active");
          } else {
            expect(button).not.toHaveClass("active");
          }
        });
      });
      unmount();
    }
  });

  // ---------------------------
  // Notifications Rendering and Updating
  // ---------------------------
  test("updates notifications count when one notification becomes unread", async () => {
    const initialNotifications = [
      { _id: "1", read: true },
      { _id: "2", read: true },
    ];
    const { container, rerender } = render(
      <NotificationsContext.Provider
        value={{
          notifications: initialNotifications,
          setNotifications: jest.fn(),
        }}
      >
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard />
        </MemoryRouter>
      </NotificationsContext.Provider>
    );
    let notificationCountElement = container.querySelector(
      ".notification-count"
    );
    expect(notificationCountElement).toBeNull();

    const updatedNotifications = [
      { _id: "1", read: false },
      { _id: "2", read: true },
    ];
    rerender(
      <NotificationsContext.Provider
        value={{
          notifications: updatedNotifications,
          setNotifications: jest.fn(),
        }}
      >
        <MemoryRouter initialEntries={["/dashboard/boards"]}>
          <Dashboard />
        </MemoryRouter>
      </NotificationsContext.Provider>
    );

    notificationCountElement = container.querySelector(".notification-count");
    expect(notificationCountElement).toBeInTheDocument();
    expect(notificationCountElement.textContent).toBe("1");
  });

  // ---------------------------
  // Additional Tests
  // ---------------------------

  describe("Error Handling", () => {
    test("displays console error when fetchTasks fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      tasksService.fetchTasks.mockRejectedValue(new Error("Fetch tasks failed"));

      render(
        <NotificationsContext.Provider value={notificationsContextValue}>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Dashboard />
          </MemoryRouter>
        </NotificationsContext.Provider>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching data:",
          expect.any(Error)
        );
      });
      consoleErrorSpy.mockRestore();
    });

    test("displays console error when fetchColumnOrder fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      columnsService.fetchColumnOrder.mockRejectedValue(
        new Error("Fetch column order failed")
      );

      render(
        <NotificationsContext.Provider value={notificationsContextValue}>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Dashboard />
          </MemoryRouter>
        </NotificationsContext.Provider>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching data:",
          expect.any(Error)
        );
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("User Interaction in CreateTaskModal", () => {
    test("prompts for unsaved changes when closing modal with non-empty task title", async () => {
      // Spy on window.confirm
      const confirmSpy = jest.spyOn(window, "confirm").mockImplementation(() => true);

      // Render modal with non-empty task title (simulate unsaved change)
      render(
        <NotificationsContext.Provider value={notificationsContextValue}>
          <MemoryRouter initialEntries={["/dashboard/createtask"]}>
            <Dashboard />
          </MemoryRouter>
        </NotificationsContext.Provider>
      );

      // Wait for modal to appear
      const taskTitleInput = await screen.findByPlaceholderText(/Enter Task Title/i);
      // Simulate typing a task title
      fireEvent.change(taskTitleInput, { target: { value: "Test unsaved task" } });

      // Locate the modal overlay by finding the "Create New Task" heading and its closest overlay element.
      const heading = screen.getByText("Create New Task");
      const overlay = heading.closest(".modal-overlay");
      expect(overlay).toBeInTheDocument();

      // Simulate clicking the overlay (which should trigger confirm if unsaved changes exist)
      fireEvent.click(overlay);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    test("validates that Create button does nothing when required fields are empty", async () => {
      render(
        <NotificationsContext.Provider value={notificationsContextValue}>
          <MemoryRouter initialEntries={["/dashboard/createtask"]}>
            <Dashboard />
          </MemoryRouter>
        </NotificationsContext.Provider>
      );
      // Wait for modal to appear
      await screen.findByText("Create New Task");
      // Ensure task title is empty and click Create
      const createButton = screen.getByText("Create");
      fireEvent.click(createButton);
      // If the form validation works, an error message should be rendered
      expect(screen.getByText(/Task Title is required/i)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    test("renders board creation UI when no boards exist", async () => {
      // Simulate no boards by returning an empty columnOrder and empty columnNames
      columnsService.fetchColumnOrder.mockResolvedValue({
        data: { columnOrder: [], columnNames: {} },
      });
      // Render Dashboard at the createtask route to force the modal open
      render(
        <NotificationsContext.Provider value={notificationsContextValue}>
          <MemoryRouter initialEntries={["/dashboard/createtask"]}>
            <Dashboard />
          </MemoryRouter>
        </NotificationsContext.Provider>
      );
      // Expect to see the message that instructs to create a board before creating tasks
      const noBoardMsg = await screen.findByText(/You need to create a board before you can create tasks/i);
      expect(noBoardMsg).toBeInTheDocument();
    });

    test("handles unexpected API response data gracefully", async () => {
      // Simulate an unexpected response from columns API (e.g., missing columnOrder)
      columnsService.fetchColumnOrder.mockResolvedValue({
        data: { wrongKey: [] },
      });
      // Render Dashboard and ensure that the component still renders without crashing
      render(
        <NotificationsContext.Provider value={notificationsContextValue}>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Dashboard />
          </MemoryRouter>
        </NotificationsContext.Provider>
      );
      // Expect default text to be rendered (such as Dashboard heading) even if columns are not correctly loaded.
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });
});
