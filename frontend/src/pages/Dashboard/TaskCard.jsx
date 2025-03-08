import React from "react";
import { Draggable } from "@hello-pangea/dnd";

const TaskCard = ({
  task,
  index,
  formatDueDate,
  currentTime,
  isTaskHovered,
  setIsTaskHovered,
  isTaskDropdownOpen,
  setIsTaskDropdownOpen,
  dropdownRef,
  deleteTask,
  startTimer,
  stopTimer,
  openViewTaskModal,
}) => {
  const handleClick = (e) => {
    if (e.target.closest(".task-actions")) return;
    openViewTaskModal(task);
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="task-card"
          onClick={handleClick}
          onMouseEnter={() => setIsTaskHovered(task._id)}
          onMouseLeave={() => setIsTaskHovered(null)}
        >
          <span>{task.title}</span>
          <div className="task-bottom">
            {task.dueDate && (
              <span
                className={`due-date ${
                  formatDueDate(task.dueDate, currentTime).isOverdue ? "overdue" : ""
                }`}
              >
                {formatDueDate(task.dueDate, currentTime).text}
              </span>
            )}
            {task.isTimerRunning && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="alarm-clock-icon"
              >
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2" />
                <path d="M5 3L2 6" />
                <path d="M22 6l-3-3" />
                <path d="M6 19l-2 2" />
                <path d="M18 19l2 2" />
              </svg>
            )}
            <b className={`priority-${task.priority.replace(/\s+/g, "")}`}>
              {task.priority}
            </b>
            <div className="task-actions">
              <button
                className={`dots-button ${
                  isTaskHovered === task._id || isTaskDropdownOpen === task._id
                    ? "visible"
                    : ""
                } ${isTaskDropdownOpen === task._id ? "dropdown-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTaskDropdownOpen(
                    isTaskDropdownOpen === task._id ? null : task._id
                  );
                }}
              >
                &#8942;
              </button>
              {isTaskDropdownOpen === task._id && (
                <div className="dropdown-menu open" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      task.isTimerRunning ? stopTimer(task._id) : startTimer(task._id);
                      setIsTaskDropdownOpen(null);
                    }}
                  >
                    {task.isTimerRunning ? "Stop Timer" : "Start Timer"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task._id);
                      setIsTaskDropdownOpen(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
