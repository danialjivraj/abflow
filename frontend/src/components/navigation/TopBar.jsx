import React, { useState, useRef, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import NotificationsDropdown from "../NotificationsDropdown";
import { NotificationsContext } from "../../contexts/NotificationsContext";
import "./topBar.css";

const TopBar = ({ buttons, openModal, navigate, activeChartType }) => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications } = useContext(NotificationsContext);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayCount =
    unreadCount > 99 ? (
      <>
        <span className="notification-numbers">99</span>
        <span className="notification-plus">+</span>
      </>
    ) : (
      unreadCount
    );

  const isActive = (button) => {
    if (button.path) {
      return location.pathname.startsWith(button.path);
    }
    if (activeChartType && button.value) {
      return button.value === activeChartType;
    }
    return false;
  };

  useEffect(() => {
    window.openNotifications = () => setShowNotifications(true);
    return () => {
      delete window.openNotifications;
    };
  }, []);

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
        if (button.type === "custom") {
          return (
            <div key={index} className="top-bar-custom">
              {button.render()}
            </div>
          );
        }

        const activeClass = isActive(button) ? "active" : "";

        return (
          <button
            key={index}
            onClick={() => button.onClick(openModal, navigate)}
            className={`${button.className} ${activeClass}`}
          >
            {button.icon && <span className="top-bar-icon">{button.icon}</span>}
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
          {unreadCount > 0 && (
            <span
              className={`notification-count ${
                unreadCount > 99 ? "plus-notification" : "regular-notification"
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
