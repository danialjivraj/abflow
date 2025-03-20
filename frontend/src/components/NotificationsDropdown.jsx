import React, { useContext, useState } from "react";
import { NotificationsContext } from "../contexts/NotificationsContext";
import { formatDateWithoutGMT } from "../utils/dateUtils";
import { updateNotification, deleteNotification } from "../services/notificationService";
import { FaEnvelopeOpen, FaEnvelope } from "react-icons/fa";
import "./notificationsDropdown.css";

const renderNotificationMessage = (message) => {
  const prefixMap = {
    "Weekly Insight:": "notification-title-insight",
    "Alert:": "notification-title-alert",
    "Reminder:": "notification-title-reminder",
    "Warning:": "notification-title-warning"
  };

  for (const prefix in prefixMap) {
    if (message.startsWith(prefix)) {
      const cssClass = prefixMap[prefix];
      const restOfMessage = message.slice(prefix.length);
      return (
        <span>
          <span className={cssClass}>{prefix}</span>
          {restOfMessage}
        </span>
      );
    }
  }
  return <span>{message}</span>;
};

const NotificationsDropdown = ({ notifications, onClose }) => {
  const { setNotifications } = useContext(NotificationsContext);
  const [expandedIds, setExpandedIds] = useState([]);

  const markAsRead = async (index) => {
    const notif = notifications[index];
    if (!notif.read) {
      try {
        await updateNotification(notif._id, { read: true });
        setNotifications((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], read: true };
          return updated;
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const updatedNotifications = await Promise.all(
        notifications.map(async (notif) => {
          if (!notif.read) {
            await updateNotification(notif._id, { read: true });
            return { ...notif, read: true };
          }
          return notif;
        })
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const removeNotificationItem = async (index) => {
    const notifToRemove = notifications[index];
    try {
      await deleteNotification(notifToRemove._id);
      setNotifications((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const toggleExpand = (notificationId) => {
    setExpandedIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const clearAllNotifications = async () => {
    try {
      for (const notif of notifications) {
        await deleteNotification(notif._id);
      }
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <div className="header-content">
          <h4>Notifications</h4>
          <button className="mark-all-read-header" onClick={markAllAsRead}>
            Mark All as Read
          </button>
        </div>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      {notifications.length === 0 ? (
        <p className="no-notifications">No notifications</p>
      ) : (
        <ul>
          {notifications.map((notif, index) => {
            const dateStr = formatDateWithoutGMT(new Date(notif.createdAt));
            const isExpanded = expandedIds.includes(notif._id);
            return (
              <li
                key={notif._id}
                className={`notification-item ${notif.read ? "read" : "unread"} ${isExpanded ? "expanded" : ""}`}
                onClick={async () => {
                  if (!notif.read) {
                    await markAsRead(index);
                  }
                  toggleExpand(notif._id);
                }}
              >
                <div className="notification-content">
                  <div className="notification-timestamp">{dateStr}</div>
                  <div className="notification-message">
                    {renderNotificationMessage(notif.message)}
                  </div>
                </div>
                <div className="notification-actions">
                  <button
                    className="notification-envelope-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      (async () => {
                        if (!notif.read) {
                          await markAsRead(index);
                        }
                        toggleExpand(notif._id);
                      })();
                    }}
                  >
                    {notif.read ? (
                      <FaEnvelopeOpen className="read-icon" />
                    ) : (
                      <FaEnvelope className="unread-icon" />
                    )}
                  </button>
                  <button
                    className="notification-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotificationItem(index);
                    }}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {notifications.length > 0 && (
        <div className="clear-all-container">
          <button className="clear-all-btn" onClick={clearAllNotifications}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
