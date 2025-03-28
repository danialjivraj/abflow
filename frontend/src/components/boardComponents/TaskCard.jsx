import React, { useRef, useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { formatDueDate, formatCompletedDueDate, getCalendarIconColor } from "../../utils/dateUtils";
import DeleteConfirmationModal from "../cool/DeleteConfirmationModal";

const priorityMapping = {
  A: "A: Very Important",
  B: "B: Important",
  C: "C: Nice to do",
  D: "D: Delegate",
  E: "E: Eliminate",
};

const TaskCard = ({
  task,
  index,
  draggable = true, // default to true for boards view
  currentTime,
  isTaskHovered,
  setIsTaskHovered,
  isTaskDropdownOpen,
  setIsTaskDropdownOpen,
  deleteTask,
  startTimer,
  stopTimer,
  openViewTaskModal,
  handleCompleteTask,
  handleBackToBoards,
  hideDots,
  confirmBeforeDeleteTask = true,
}) => {
  const dropdownMenuRef = useRef(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        if (isTaskDropdownOpen === task._id) {
          setIsTaskDropdownOpen(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTaskDropdownOpen, setIsTaskDropdownOpen, task._id]);

  const handleClick = (e) => {
    if (e.target.closest(".task-actions")) return;
    openViewTaskModal(task);
  };

  const priorityLetter = task.priority.charAt(0);
  const priorityTitle = priorityMapping[priorityLetter] || task.priority;

  const referenceDate =
    task.status === "completed" && task.completedAt
      ? new Date(task.completedAt)
      : currentTime;

  let dueDateText = "";
  let dueDateClass = "";

  if (task.dueDate) {
    if (task.status === "completed" && task.completedAt) {
      dueDateText = formatCompletedDueDate(task.dueDate, task.completedAt);
      const due = new Date(task.dueDate);
      const completed = new Date(task.completedAt);
      dueDateClass = completed > due ? "overdue" : "completed";
    } else {
      const formatted = formatDueDate(task.dueDate, referenceDate);
      dueDateText = formatted.text;
      dueDateClass = formatted.isOverdue ? "overdue" : "";
    }
  }

  const calendarColor = getCalendarIconColor(task.scheduledStart, task.scheduledEnd, currentTime);

  const cardContent = (
    <>
      <span>{task.title}</span>
      <div className="task-bottom">
        {task.dueDate && (
          <span className={`due-date ${dueDateClass}`}>{dueDateText}</span>
        )}
        {calendarColor && (
          <svg
            className="calendar-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              "--calendar-color": calendarColor,
              marginRight: "4px",
            }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
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
        <b
          className={`priority-${task.priority.replace(/\s+/g, "")}`}
          title={priorityTitle}
        >
          {task.priority}
        </b>
        {!hideDots && (
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
              <div className="dropdown-menu open" ref={dropdownMenuRef}>
                {task.status !== "completed" && handleCompleteTask && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteTask(task);
                      setIsTaskDropdownOpen(null);
                    }}
                  >
                    Complete Task
                  </button>
                )}
                {task.status !== "completed" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      task.isTimerRunning
                        ? stopTimer(task._id)
                        : startTimer(task._id);
                      setIsTaskDropdownOpen(null);
                    }}
                  >
                    {task.isTimerRunning ? "Stop Timer" : "Start Timer"}
                  </button>
                )}
                {task.status === "completed" && handleBackToBoards && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBackToBoards(task);
                      setIsTaskDropdownOpen(null);
                    }}
                  >
                    Back to Boards
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!confirmBeforeDeleteTask) {
                      deleteTask(task._id);
                    } else {
                      setIsDeleteModalOpen(true);
                    }
                    setIsTaskDropdownOpen(null);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (draggable) {
    return (
      <>
        <Draggable draggableId={task._id} index={index}>
          {(provided) => (
            <div
              className="task-card"
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              onClick={handleClick}
              onMouseEnter={() => setIsTaskHovered(task._id)}
              onMouseLeave={() => setIsTaskHovered(null)}
            >
              {cardContent}
            </div>
          )}
        </Draggable>
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            deleteTask(task._id);
            setIsDeleteModalOpen(false);
          }}
          entityType="task"
          entityName={task.title}
        />
      </>
    );
  } else {
    return (
      <>
        <div
          className="task-card"
          onClick={handleClick}
          onMouseEnter={() => setIsTaskHovered(task._id)}
          onMouseLeave={() => setIsTaskHovered(null)}
        >
          {cardContent}
        </div>
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            deleteTask(task._id);
            setIsDeleteModalOpen(false);
          }}
          entityType="task"
          entityName={task.title}
        />
      </>
    );
  }
};

export default TaskCard;
