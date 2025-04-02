import { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  fetchNotifications,
  updateNotification,
} from "../services/notificationService";
import { onAuthStateChanged } from "firebase/auth";
import notificationSound from "../assets/notification.mp3";
import { toast } from "react-toastify";
import { FaEnvelope } from "react-icons/fa";

export const NotificationsContext = createContext();

const getToastDetails = (notification) => {
  const prefixMap = {
    "Weekly Insight:": {
      keyword: "Weekly Insight",
      className: "notification-title-insight",
      icon: <FaEnvelope style={{ color: "var(--notif-title-insight)" }} />,
      multiline: true,
      article: "a",
    },
    "Alert:": {
      keyword: "Alert",
      className: "notification-title-alert",
      icon: <FaEnvelope style={{ color: "var(--notif-title-alert)" }} />,
      article: "an",
    },
    "Reminder:": {
      keyword: "Reminder",
      className: "notification-title-reminder",
      icon: <FaEnvelope style={{ color: "var(--notif-title-reminder)" }} />,
      article: "a",
    },
    "Warning:": {
      keyword: "Warning",
      className: "notification-title-warning",
      icon: <FaEnvelope style={{ color: "var(--notif-title-warning)" }} />,
      article: "a",
    },
  };

  for (const prefix in prefixMap) {
    if (notification.message.startsWith(prefix)) {
      const details = prefixMap[prefix];
      if (details.multiline) {
        return {
          message: (
            <span style={{ whiteSpace: "nowrap" }}>
              You got {details.article}{" "}
              <span className={details.className}>{details.keyword}</span>
              <br />
              notification!
            </span>
          ),
          icon: details.icon,
        };
      }
      return {
        message: (
          <span style={{ whiteSpace: "nowrap" }}>
            You got {details.article}{" "}
            <span className={details.className}>{details.keyword}</span>
            notification!
          </span>
        ),
        icon: details.icon,
      };
    }
  }

  return {
    message: (
      <span style={{ whiteSpace: "nowrap" }}>You got a new notification!</span>
    ),
    icon: <FaEnvelope style={{ color: "#d1921d" }} />,
  };
};

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

      const toastDetails = getToastDetails(newUnplayed[0]);

      toast.info(toastDetails.message, {
        autoClose: 5000,
        icon: toastDetails.icon,
        onClick: () => {
          if (window.openNotifications) {
            window.openNotifications();
          }
          toast.dismiss();
        },
      });

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
