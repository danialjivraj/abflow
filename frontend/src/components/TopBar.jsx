// TopBar.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import "./topBar.css";

const TopBar = ({ buttons, openModal, navigate, activeChartType }) => {
  const location = useLocation();

  const isActive = (button) => {
    if (button.value) {
      return button.value === activeChartType;
    }
    if (button.label === "Boards" && location.pathname.startsWith("/dashboard/boards")) {
      return true;
    } else if (button.label === "Completed Tasks" && location.pathname.startsWith("/dashboard/completedtasks")) {
      return true;
    } else if (button.label === "Schedule" && location.pathname.startsWith("/dashboard/schedule")) {
      return true;
    }
    return false;
  };

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
    </div>
  );
};

export default TopBar;
