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

const renderWithNotificationsContext = (ui, { notifications, setNotifications } = {}) => {
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
      <NotificationsDropdown notifications={notifications} onClose={jest.fn()} />,
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
      <NotificationsDropdown notifications={notifications} onClose={jest.fn()} />,
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
    const { updateNotification } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown notifications={notifications} onClose={jest.fn()} />,
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
    const { updateNotification } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown notifications={notifications} onClose={jest.fn()} />,
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
    const { deleteNotification } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown notifications={notifications} onClose={jest.fn()} />,
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
    const { updateNotification } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown notifications={notifications} onClose={jest.fn()} />,
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
    const { deleteNotification } = require("../../src/services/notificationService");
    renderWithNotificationsContext(
      <NotificationsDropdown notifications={notifications} onClose={jest.fn()} />,
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
});
