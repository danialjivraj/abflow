import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { fetchNotifications } from "../services/notificationService";
import { onAuthStateChanged } from "firebase/auth";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async (userId) => {
    try {
      const res = await fetchNotifications(userId);
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadNotifications(user.uid);
      }
    });

    const interval = setInterval(() => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        loadNotifications(currentUser.uid);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
