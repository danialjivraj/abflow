import React from "react";
import { useLocation } from "react-router-dom";
import "./topBar.css";

const TopBar = ({ buttons, openModal, navigate }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="top-bar">
      {buttons.map((button, index) => {
        let activeClass = "";
        if (button.label === "Boards" && isActive("/dashboard/boards")) {
          activeClass = "active";
        } else if (
          button.label === "Completed Tasks" &&
          isActive("/dashboard/completedtasks")
        ) {
          activeClass = "active";
        } else if (button.label === "Schedule" && isActive("/dashboard/schedule")) {
          activeClass = "active";
        }

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
