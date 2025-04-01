import React, { useContext, useState } from "react";
import { NotificationsContext } from "../contexts/NotificationsContext";
import { formatDateWithoutGMT } from "../utils/dateUtils";
import {
  updateNotification,
  deleteNotification,
} from "../services/notificationService";
import { FaEnvelopeOpen, FaEnvelope } from "react-icons/fa";
import "./notificationsDropdown.css";

const renderNotificationMessage = (message) => {
  const prefixMap = {
    "Weekly Insight:": "notification-title-insight",
    "Alert:": "notification-title-alert",
    "Reminder:": "notification-title-reminder",
    "Warning:": "notification-title-warning",
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
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((notif) => !notif.read)
      : notifications;

  const markAsRead = async (notif) => {
    if (!notif.read) {
      try {
        await updateNotification(notif._id, { read: true });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  const removeNotificationItem = async (notif) => {
    try {
      await deleteNotification(notif._id);
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
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
          <button
            className="mark-all-read-header"
            onClick={async () => {
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
            }}
          >
            Mark All as Read
          </button>
        </div>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="notifications-tabs">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`tab-btn ${activeTab === "unread" ? "active" : ""}`}
          onClick={() => setActiveTab("unread")}
        >
          Unread
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <p className="no-notifications">No notifications</p>
      ) : (
        <ul>
          {filteredNotifications.map((notif) => {
            const dateStr = formatDateWithoutGMT(new Date(notif.createdAt));
            const isExpanded = expandedIds.includes(notif._id);
            return (
              <li
                key={notif._id}
                className={`notification-item ${
                  notif.read ? "read" : "unread"
                } ${isExpanded ? "expanded" : ""}`}
                onClick={async () => {
                  if (!notif.read) {
                    await markAsRead(notif);
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
                          await markAsRead(notif);
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
                      removeNotificationItem(notif);
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
