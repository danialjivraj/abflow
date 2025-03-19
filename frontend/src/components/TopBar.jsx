import React, { useState, useRef, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { FiBell } from "react-icons/fi"; // Nice white bell icon
import NotificationsDropdown from "./NotificationsDropdown";
import { NotificationsContext } from "../contexts/NotificationsContext";
import "./topBar.css";

const TopBar = ({ buttons, openModal, navigate, activeChartType }) => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications } = useContext(NotificationsContext);

  const notificationCount = notifications.length;

  const displayCount =
    notificationCount > 99 ? (
      <>
        <span className="notification-numbers">99</span>
        <span className="notification-plus">+</span>
      </>
    ) : (
      notificationCount
    );

  const isActive = (button) => {
    if (button.value) {
      return button.value === activeChartType;
    }
    if (
      button.label === "Boards" &&
      location.pathname.startsWith("/dashboard/boards")
    ) {
      return true;
    } else if (
      button.label === "Completed Tasks" &&
      location.pathname.startsWith("/dashboard/completedtasks")
    ) {
      return true;
    } else if (
      button.label === "Schedule" &&
      location.pathname.startsWith("/dashboard/schedule")
    ) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="top-bar">
      {buttons.map((button, index) => {
        const activeClass = isActive(button) ? "active" : "";
        return (
          <button
            key={index}
            onClick={() => button.onClick(openModal, navigate)}
            className={`${button.className} ${activeClass}`}
          >
            {button.label}
          </button>
        );
      })}

      <div className="notifications-container" ref={dropdownRef}>
        <button
          className={`top-bar-button notification-button ${
            showNotifications ? "active" : ""
          }`}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FiBell size={20} />
          {notificationCount > 0 && (
            <span
              className={`notification-count ${
                notificationCount > 99
                  ? "plus-notification"
                  : "regular-notification"
              }`}
            >
              {displayCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <NotificationsDropdown
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TopBar;
