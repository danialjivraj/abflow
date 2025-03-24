import React, { createContext, useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { fetchNotifications } from "../services/notificationService";
import { onAuthStateChanged } from "firebase/auth";
import notificationSound from "../assets/notification.mp3";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children, muteNotifications }) => {
  const [notifications, setNotifications] = useState([]);
  const prevNotificationsRef = useRef([]);

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

  useEffect(() => {
    if (notifications.length > prevNotificationsRef.current.length) {
      if (!muteNotifications) {
        const audio = new Audio(notificationSound);
        audio.play().catch(() => {});
      }
    }
    prevNotificationsRef.current = notifications;
  }, [notifications, muteNotifications]);

  return (
    <NotificationsContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
