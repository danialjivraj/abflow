import React, { useContext } from "react";
import { NotificationsContext } from "../contexts/NotificationsContext";
import { formatDateWithoutGMT } from "../utils/dateUtils"; // Reusing your date formatting function
import "./notificationsDropdown.css";

const NotificationsDropdown = ({ notifications, onClose }) => {
  const { setNotifications } = useContext(NotificationsContext);

  // Remove a single notification by index
  const removeNotification = (indexToRemove) => {
    setNotifications((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <h4>Notifications</h4>
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
            return (
              <li key={index}>
                <div className="notification-content">
                  <div className="notification-timestamp">{dateStr}</div>
                  <div className="notification-message">{notif.message}</div>
                </div>
                <button
                  className="notification-remove-btn"
                  onClick={() => removeNotification(index)}
                >
                  ×
                </button>
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
