import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
// import { fetchWeeklySummary } from "../services/tasksService"; // Uncomment if using API

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // For demonstration, create three test notifications with different timestamps.
    const now = new Date();
    const testNotifications = [
      {
        message: "Test notification: Focus more on high priority (A) tasks!",
        createdAt: now,
      },
      {
        message: "Reminder: Check your upcoming deadlines.",
        createdAt: new Date(now.getTime() - 5 * 60000), // 5 minutes ago
      },
      {
        message: "New update available in your task list.",
        createdAt: new Date(now.getTime() - 10 * 60000), // 10 minutes ago
      },
    ];
    setNotifications(testNotifications);

    // Optionally, you can fetch real notifications via an API.
    // const loadNotifications = async () => {
    //   const currentUser = auth.currentUser;
    //   if (currentUser) {
    //     try {
    //       const res = await fetchWeeklySummary(currentUser.uid);
    //       const { recommendation } = res.data;
    //       setNotifications([{ message: recommendation, createdAt: new Date() }]);
    //     } catch (error) {
    //       console.error("Error fetching notifications:", error);
    //     }
    //   }
    // };
    // loadNotifications();
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
