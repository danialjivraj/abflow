import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationsDropdown from "../../src/components/NotificationsDropdown";
import { NotificationsContext } from "../../src/contexts/NotificationsContext";
import { createBaseNotification } from "../../_testUtils/createBaseNotification";

jest.mock("../../src/services/notificationService", () => ({
  updateNotification: jest.fn(() => Promise.resolve()),
  deleteNotification: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../src/utils/dateUtils", () => ({
  formatDateWithoutGMT: (date) => date.toLocaleDateString(),
}));

const renderWithNotificationsContext = (
  ui,
  { notifications, setNotifications } = {}
) => {
  return render(
    <NotificationsContext.Provider value={{ notifications, setNotifications }}>
      {ui}
    </NotificationsContext.Provider>
  );
};

const getDefaultNotifications = () => [
  createBaseNotification({
    _id: "notif1",
    message:
      "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week.",
    read: false,
    createdAt: new Date("2022-01-01T12:00:00.000Z").toISOString(),
  }),
  createBaseNotification({
    _id: "notif2",
    message: 'Alert: Your task "Overdue Task" is overdue. Please review it.',
    read: true,
    createdAt: new Date("2022-01-02T12:00:00.000Z").toISOString(),
  }),
  createBaseNotification({
    _id: "notif3",
    message:
      'Reminder: Your scheduled task "Scheduled Task" will start at 17:45 (in 5 minutes).',
    read: false,
    createdAt: new Date("2022-01-03T12:00:00.000Z").toISOString(),
  }),
];

let notifications;
let setNotificationsMock;

beforeEach(() => {
  notifications = getDefaultNotifications();
  setNotificationsMock = jest.fn();
});

// =======================
// UNIT TESTS
// =======================
describe("NotificationsDropdown Component - UNIT TESTS", () => {
  test("renders header with title, mark all as read, and close button", () => {
    renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Mark All as Read")).toBeInTheDocument();
    const closeBtn = document.querySelector(".close-btn");
    expect(closeBtn).toBeInTheDocument();
  });

  test("renders 'No notifications' when notifications array is empty", () => {
    renderWithNotificationsContext(
      <NotificationsDropdown notifications={[]} onClose={jest.fn()} />,
      { notifications: [], setNotifications: setNotificationsMock }
    );
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  test("renders notification items with formatted messages", () => {
    renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    const messageElements = Array.from(
      document.querySelectorAll(".notification-message")
    );

    const notif1Found = messageElements.some(
      (node) =>
        node.textContent.trim() ===
        "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week."
    );
    expect(notif1Found).toBe(true);

    const notif2Found = messageElements.some(
      (node) =>
        node.textContent.trim() ===
        'Alert: Your task "Overdue Task" is overdue. Please review it.'
    );
    expect(notif2Found).toBe(true);

    const notif3Found = messageElements.some(
      (node) =>
        node.textContent.trim() ===
        'Reminder: Your scheduled task "Scheduled Task" will start at 17:45 (in 5 minutes).'
    );
    expect(notif3Found).toBe(true);
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("NotificationsDropdown Component - INTEGRATION TESTS", () => {
  test("clicking a notification item marks it as read if unread and toggles expanded state", async () => {
    const {
      updateNotification,
    } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    const notifItems = screen.getAllByRole("listitem");
    const firstItem = notifItems[0];
    expect(firstItem).toHaveClass("unread");
    fireEvent.click(firstItem);
    await waitFor(() =>
      expect(updateNotification).toHaveBeenCalledWith("notif1", { read: true })
    );
    expect(setNotificationsMock).toHaveBeenCalled();
    await waitFor(() => expect(firstItem).toHaveClass("expanded"));
  });

  test("clicking the envelope button marks as read and toggles expansion", async () => {
    const {
      updateNotification,
    } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    const notifItems = screen.getAllByRole("listitem");
    const thirdItem = notifItems[2];
    expect(thirdItem).toBeInTheDocument();
    const envelopeBtn = thirdItem.querySelector(".notification-envelope-btn");
    fireEvent.click(envelopeBtn);
    await waitFor(() =>
      expect(updateNotification).toHaveBeenCalledWith("notif3", { read: true })
    );
    expect(setNotificationsMock).toHaveBeenCalled();
    await waitFor(() => expect(thirdItem).toHaveClass("expanded"));
  });

  test("clicking the remove button deletes the notification", async () => {
    const {
      deleteNotification,
    } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    const notifItems = screen.getAllByRole("listitem");
    const secondItem = notifItems[1];
    expect(secondItem).toBeInTheDocument();
    const removeBtn = secondItem.querySelector(".notification-remove-btn");
    fireEvent.click(removeBtn);
    await waitFor(() =>
      expect(deleteNotification).toHaveBeenCalledWith("notif2")
    );
    expect(setNotificationsMock).toHaveBeenCalled();
  });

  test("clicking 'Mark All as Read' marks all notifications as read", async () => {
    const {
      updateNotification,
    } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    const markAllBtn = screen.getByText("Mark All as Read");
    fireEvent.click(markAllBtn);
    await waitFor(() => {
      expect(updateNotification).toHaveBeenCalledWith("notif1", { read: true });
      expect(updateNotification).toHaveBeenCalledWith("notif3", { read: true });
    });
    expect(setNotificationsMock).toHaveBeenCalled();
  });

  test("clicking 'Clear All' deletes all notifications", async () => {
    const {
      deleteNotification,
    } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    const clearAllBtn = screen.getByText("Clear All");
    fireEvent.click(clearAllBtn);
    await waitFor(() => {
      expect(deleteNotification).toHaveBeenCalledWith("notif1");
      expect(deleteNotification).toHaveBeenCalledWith("notif2");
      expect(deleteNotification).toHaveBeenCalledWith("notif3");
    });
    expect(setNotificationsMock).toHaveBeenCalledWith([]);
  });

  test("default tab is All and shows all notifications with correct text", () => {
    const { container } = renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    expect(screen.getByText("All")).toHaveClass("active");

    const notifItems = screen.getAllByRole("listitem");
    expect(notifItems).toHaveLength(3);

    expect(notifItems[0].textContent).toContain(
      "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week."
    );
    expect(notifItems[1].textContent).toContain(
      'Alert: Your task "Overdue Task" is overdue. Please review it.'
    );
    expect(notifItems[2].textContent).toContain(
      'Reminder: Your scheduled task "Scheduled Task" will start at 17:45 (in 5 minutes).'
    );
  });

  test("clicking the Unread tab filters notifications to show only unread items with correct text", () => {
    const { container } = renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    const unreadTab = screen.getByText("Unread");
    fireEvent.click(unreadTab);
    expect(unreadTab).toHaveClass("active");

    // There should be only 2 unread notifications (notif1 and notif3)
    const notifItems = screen.getAllByRole("listitem");
    expect(notifItems).toHaveLength(2);

    expect(notifItems[0].textContent).toContain(
      "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week."
    );
    expect(notifItems[1].textContent).toContain(
      'Reminder: Your scheduled task "Scheduled Task" will start at 17:45 (in 5 minutes).'
    );
  });

  test("switching between tabs updates the displayed notifications correctly with text assertions", () => {
    const { container } = renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );
    expect(screen.getByText("All")).toHaveClass("active");
    let notifItems = screen.getAllByRole("listitem");
    expect(notifItems).toHaveLength(3);
    expect(notifItems[0].textContent).toContain(
      "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week."
    );
    expect(notifItems[1].textContent).toContain(
      'Alert: Your task "Overdue Task" is overdue. Please review it.'
    );
    expect(notifItems[2].textContent).toContain(
      'Reminder: Your scheduled task "Scheduled Task" will start at 17:45 (in 5 minutes).'
    );

    const unreadTab = screen.getByText("Unread");
    fireEvent.click(unreadTab);
    expect(unreadTab).toHaveClass("active");
    notifItems = screen.getAllByRole("listitem");
    expect(notifItems).toHaveLength(2);
    expect(notifItems[0].textContent).toContain(
      "Weekly Insight: Great job! You dedicated 100% of your time to high priority tasks last week."
    );
    expect(notifItems[1].textContent).toContain(
      'Reminder: Your scheduled task "Scheduled Task" will start at 17:45 (in 5 minutes).'
    );

    const allTab = screen.getByText("All");
    fireEvent.click(allTab);
    expect(allTab).toHaveClass("active");
    notifItems = screen.getAllByRole("listitem");
    expect(notifItems).toHaveLength(3);
  });

  test("marking an unread notification as read updates the Unread tab with correct notification text", async () => {
    const {
      updateNotification,
    } = require("../../src/services/notificationService");
    const { rerender } = renderWithNotificationsContext(
      <NotificationsDropdown
        notifications={notifications}
        onClose={jest.fn()}
      />,
      { notifications, setNotifications: setNotificationsMock }
    );

    const unreadTab = screen.getByText("Unread");
    fireEvent.click(unreadTab);
    let notifItems = screen.getAllByRole("listitem");
    expect(notifItems).toHaveLength(2);

    fireEvent.click(notifItems[0]);
    await waitFor(() =>
      expect(updateNotification).toHaveBeenCalledWith("notif1", { read: true })
    );
    expect(setNotificationsMock).toHaveBeenCalled();

    const updatedNotifications = notifications.map((n) =>
      n._id === "notif1" ? { ...n, read: true } : n
    );

    rerender(
      <NotificationsContext.Provider
        value={{
          notifications: updatedNotifications,
          setNotifications: setNotificationsMock,
        }}
      >
        <NotificationsDropdown
          notifications={updatedNotifications}
          onClose={jest.fn()}
        />
      </NotificationsContext.Provider>
    );
    notifItems = screen.getAllByRole("listitem");
    // only one unread notification should remain (notif3)
    expect(notifItems).toHaveLength(1);
    expect(notifItems[0].textContent).toContain(
      'Reminder: Your scheduled task "Scheduled Task" will start at 17:45 (in 5 minutes).'
    );
    // notif1 is no longer in the Unread view
    expect(notifItems[0].textContent).not.toContain("Weekly Insight:");
  });
});
