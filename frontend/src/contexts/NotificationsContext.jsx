import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { fetchNotifications, updateNotification } from "../services/notificationService";
import { onAuthStateChanged } from "firebase/auth";
import notificationSound from "../assets/notification.mp3";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children, muteNotifications }) => {
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

  useEffect(() => {
    const newUnplayed = notifications.filter((n) => !n.read && !n.soundPlayed);

    if (newUnplayed.length > 0 && !muteNotifications) {
      const audio = new Audio(notificationSound);
      audio.play().catch(() => {});

      newUnplayed.forEach(async (notif) => {
        try {
          await updateNotification(notif._id, { soundPlayed: true });
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notif._id ? { ...n, soundPlayed: true } : n
            )
          );
        } catch (error) {
          console.error("Error updating notification soundPlayed:", error);
        }
      });
    }
  }, [notifications, muteNotifications]);

  return (
    <NotificationsContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
