import React, { useState, useRef } from "react";
import TiptapEditor from "../../components/TiptapEditor";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./viewTaskModal.css";
import {
  formatDueDate,
  formatTimeSpent,
  calculateTotalTimeSpent,
  formatDateWithoutGMT,
  formatCompletedDueDate,
} from "../../utils/dateUtils";
import { completeTask } from "../../services/tasksService";

const allowedPriorities = [
  "A1", "A2", "A3",
  "B1", "B2", "B3",
  "C1", "C2", "C3",
  "D", "E",
];

const DropdownField = ({ value, onChange, type = "priority", columns = {} }) => {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {type === "status"
        ? Object.keys(columns).map((columnId) => (
            <option key={columnId} value={columnId}>
              {columns[columnId].name}
            </option>
          ))
        : allowedPriorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
    </select>
  );
};

const InlineTimeEditable = ({ value, onChange, onEditingChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const totalSeconds = parseInt(value, 10) || 0;
  const initialHours = Math.floor(totalSeconds / 3600);
  const initialMinutes = Math.floor((totalSeconds % 3600) / 60);
  const initialSeconds = totalSeconds % 60;
  const [localHours, setLocalHours] = useState(initialHours);
  const [localMinutes, setLocalMinutes] = useState(initialMinutes);
  const [localSeconds, setLocalSeconds] = useState(initialSeconds);

  const createDisplayText = () => {
    return formatTimeSpent(totalSeconds);
  };

  const startEditing = () => {
    setLocalHours(initialHours);
    setLocalMinutes(initialMinutes);
    setLocalSeconds(initialSeconds);
    setIsEditing(true);
    if (onEditingChange) onEditingChange(true);
  };

  const handleConfirm = () => {
    const hours = Math.max(0, parseInt(localHours, 10) || 0);
    const minutes = Math.max(0, Math.min(59, parseInt(localMinutes, 10) || 0));
    const seconds = Math.max(0, Math.min(59, parseInt(localSeconds, 10) || 0));
    const newTotal = hours * 3600 + minutes * 60 + seconds;
    onChange(newTotal);
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };

  const handleCancel = () => {
    setLocalHours(initialHours);
    setLocalMinutes(initialMinutes);
    setLocalSeconds(initialSeconds);
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };

  return (
    <div className="view-task-field">
      {isEditing ? (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="number"
            value={localHours}
            min="0"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setLocalHours(isNaN(val) || val < 0 ? 0 : val);
            }}
            style={{ width: "50px" }}
          />
          <span>h</span>
          <input
            type="number"
            value={localMinutes}
            min="0"
            max="59"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (isNaN(val) || val < 0) {
                setLocalMinutes(0);
              } else if (val > 59) {
                setLocalMinutes(59);
              } else {
                setLocalMinutes(val);
              }
            }}
            style={{ width: "50px" }}
          />
          <span>m</span>
          <input
            type="number"
            value={localSeconds}
            min="0"
            max="59"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (isNaN(val) || val < 0) {
                setLocalSeconds(0);
              } else if (val > 59) {
                setLocalSeconds(59);
              } else {
                setLocalSeconds(val);
              }
            }}
            style={{ width: "50px" }}
          />
          <span>s</span>
          <button className="tick-btn" onClick={handleConfirm}>
            ✔️
          </button>
          <button className="cross-btn" onClick={handleCancel}>
            ❌
          </button>
        </div>
      ) : (
        <div className="scroll-wrapper">
          <div className="text-container" onClick={startEditing}>
            {createDisplayText()}
          </div>
        </div>
      )}
    </div>
  );
};

const InlineEditable = ({
  value,
  onChange,
  type = "text",
  columns = {},
  min,
  onEditingChange,
  ...rest
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleConfirm = () => {
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
    onChange(localValue);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };

  let displayValue = value;
  if (type === "date" && value) {
    displayValue = formatDateWithoutGMT(value);
  } else if (type === "status" && value && columns[value]) {
    displayValue = columns[value].name;
  } else if (!value) {
    displayValue = "";
  }

  const isDropdown = type === "status" || type === "priority";

  return (
    <div className="view-task-field">
      {isEditing ? (
        <>
          {type === "textarea" || type === "title" ? (
            <textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={1}
              style={{ width: "600%", resize: "none" }}
              {...rest}
            />
          ) : type === "date" ? (
            <DatePicker
              selected={localValue ? new Date(localValue) : null}
              onChange={(date) => setLocalValue(date)}
              onKeyDown={handleKeyDown}
              autoFocus
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="custom-datepicker-input"
              disabledKeyboardNavigation
            />
          ) : isDropdown ? (
            <select
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onChange(e.target.value);
                setIsEditing(false);
                if (onEditingChange) onEditingChange(false);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            >
              {type === "status"
                ? Object.keys(columns).map((columnId) => (
                    <option key={columnId} value={columnId}>
                      {columns[columnId].name}
                    </option>
                  ))
                : allowedPriorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
            </select>
          ) : (
            <input
              type={type}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              min={min}
              {...rest}
            />
          )}
          {!isDropdown && (
            <div className="button-container">
              <button className="tick-btn" onClick={handleConfirm}>
                ✔️
              </button>
              <button className="cross-btn" onClick={handleCancel}>
                ❌
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="scroll-wrapper">
          <div
            className="text-container title-text-container"
            onClick={() => {
              setIsEditing(true);
              if (onEditingChange) onEditingChange(true);
            }}
          >
            {displayValue && displayValue.toString().trim() !== ""
              ? displayValue.toString()
              : "Click to edit"}
          </div>
        </div>
      )}
    </div>
  );
};

const InlineTiptap = ({ value, onChange, onEditingChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const containerStyle = {
    minHeight: "300px",
    width: "100%",
  };

  const handleConfirm = () => {
    onChange(localValue);
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };

  return (
    <div className={`view-task-field ${isEditing ? "is-editing" : ""}`} style={containerStyle}>
      {isEditing ? (
        <div style={containerStyle}>
          <TiptapEditor value={localValue} onChange={setLocalValue} />
          <div className="button-container description-buttons">
            <button className="tick-btn" onClick={handleConfirm}>
              ✔️
            </button>
            <button className="cross-btn" onClick={handleCancel}>
              ❌
            </button>
          </div>
        </div>
      ) : value && value.trim() !== "" ? (
        <div className="scroll-wrapper">
          <div
            className="text-container"
            onClick={() => {
              setIsEditing(true);
              if (onEditingChange) onEditingChange(true);
            }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      ) : (
        <div className="scroll-wrapper">
          <div
            className="text-container"
            onClick={() => {
              setIsEditing(true);
              if (onEditingChange) onEditingChange(true);
            }}
          >
            Click to edit description
          </div>
        </div>
      )}
    </div>
  );
};

const ViewTaskModal = ({
  isModalOpen,
  closeModal,
  task,
  handleUpdateTask,
  columns,
  startTimer,
  stopTimer,
  setCompletedTasks,
}) => {
  if (!isModalOpen || !task) return null;
  const modalContentRef = useRef(null);
  const [editableTask, setEditableTask] = useState({ ...task });
  const [editingCount, setEditingCount] = useState(0);

  const handleCompleteTask = async () => {
    try {
      if (editableTask.isTimerRunning) {
        await stopTimer(editableTask._id);
      }
      const response = await completeTask(task._id);
      const updatedTask = response.data;
      handleUpdateTask(updatedTask);
      if (setCompletedTasks) {
        setCompletedTasks((prevCompleted) => {
          if (!prevCompleted.some((t) => t._id === updatedTask._id)) {
            return [...prevCompleted, updatedTask];
          }
          return prevCompleted.map((t) =>
            t._id === updatedTask._id ? updatedTask : t
          );
        });
      }
      closeModal();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleEditingChange = (isEditing) => {
    setEditingCount((prev) => (isEditing ? prev + 1 : Math.max(prev - 1, 0)));
  };

  const updateField = (field, value) => {
    if (field === "timeSpent") {
      const updatedTask = { ...editableTask, timeSpent: value };
      if (editableTask.isTimerRunning) {
        updatedTask.timerStartTime = new Date().toISOString();
      }
      setEditableTask(updatedTask);
      handleUpdateTask(updatedTask);
    } else if (field === "status") {
      const newColumnItems = columns[value]?.items || [];
      const newOrder = newColumnItems.reduce(
        (max, t) => Math.max(max, t.order || 0),
        -1
      ) + 1;
      const updatedTask = { ...editableTask, status: value, order: newOrder };
      setEditableTask(updatedTask);
      handleUpdateTask(updatedTask);
    } else {
      setEditableTask((prev) => {
        const updatedTask = { ...prev, [field]: value };
        handleUpdateTask(updatedTask);
        return updatedTask;
      });
    }
  };

  const referenceDate =
    editableTask.status === "completed" && editableTask.completedAt
      ? new Date(editableTask.completedAt)
      : new Date();

  const toggleTimer = async () => {
    if (editableTask.isTimerRunning) {
      try {
        const response = await stopTimer(editableTask._id);
        const updatedTask = response.data;
        setEditableTask((prev) => ({
          ...prev,
          isTimerRunning: false,
          timerStartTime: null,
          timeSpent: updatedTask.timeSpent,
        }));
        handleUpdateTask({
          ...editableTask,
          isTimerRunning: false,
          timerStartTime: null,
          timeSpent: updatedTask.timeSpent,
        });
      } catch (error) {
        console.error("Error stopping timer:", error);
      }
    } else {
      try {
        const response = await startTimer(editableTask._id);
        const updatedTask = response.data;
        setEditableTask((prev) => ({
          ...prev,
          isTimerRunning: true,
          timerStartTime: updatedTask.timerStartTime || new Date().toISOString(),
        }));
        handleUpdateTask({
          ...editableTask,
          isTimerRunning: true,
          timerStartTime: updatedTask.timerStartTime || new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error starting timer:", error);
      }
    }
  };

  const getTotalTimeSpent = () => {
    return calculateTotalTimeSpent(
      editableTask.timeSpent,
      editableTask.isTimerRunning,
      editableTask.timerStartTime
    );
  };

  const handleMoveToBoards = () => {
    const newStatus = Object.keys(columns)[0] || "backlog";
    updateField("status", newStatus);
    closeModal();
  };

  const handleOverlayClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      if (editingCount > 0) {
        const confirmClose = window.confirm("You have unsaved edits. Are you sure you want to close?");
        if (confirmClose) {
          closeModal();
        }
      } else {
        closeModal();
      }
    }
  };

  let dueStatusText = "";
  let dueStatusClass = "";
  if (editableTask.dueDate) {
    if (editableTask.status === "completed" && editableTask.completedAt) {
      dueStatusText = formatCompletedDueDate(editableTask.dueDate, editableTask.completedAt);
      const due = new Date(editableTask.dueDate);
      const completed = new Date(editableTask.completedAt);
      dueStatusClass = completed > due ? "overdue" : "";
    } else {
      const formatted = formatDueDate(editableTask.dueDate, referenceDate);
      dueStatusText = formatted.text;
      dueStatusClass = formatted.isOverdue ? "overdue" : "";
    }
  }

  return (
    <div className="view-modal-overlay" onClick={handleOverlayClick}>
      <div className="view-modal-content" ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
        <button className="view-close-modal" onClick={closeModal}>
          &times;
        </button>

        <div className="modal-header">
          <h2>Task Overview</h2>
        </div>
        <div className="view-modal-body">
          <div className="view-modal-left">
            <div className="title-block">
              <h3 className="panel-heading">Title</h3>
              <InlineEditable
                value={editableTask.title || ""}
                onChange={(val) => updateField("title", val)}
                type="title"
                onEditingChange={handleEditingChange}
              />
            </div>
            <div className="description-block">
              <h3 className="panel-heading">Description</h3>
              <InlineTiptap
                value={editableTask.description || ""}
                onChange={(val) => updateField("description", val)}
                onEditingChange={handleEditingChange}
              />
            </div>
          </div>

          <div className="view-modal-right">
            <h3 className="panel-heading">Details</h3>
            <div className="field-row">
              <label>Created At:</label>
              <div className="view-task-field non-editable-field">
                <div className="scroll-wrapper">
                  <div className="text-container">
                    {editableTask.createdAt
                      ? formatDateWithoutGMT(editableTask.createdAt)
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
            <div className="field-row">
              <label>Priority:</label>
              <div className="view-task-field">
                <DropdownField
                  value={editableTask.priority || ""}
                  onChange={(val) => updateField("priority", val)}
                  type="priority"
                />
              </div>
            </div>

            <div className="field-row">
              <label>Status:</label>
              {editableTask.status === "completed" ? (
                <div className="view-task-field non-editable-field">
                  <div className="scroll-wrapper">
                    <div className="text-container">
                      {columns[editableTask.status] ? columns[editableTask.status].name : "Completed"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="view-task-field">
                  <DropdownField
                    value={editableTask.status || ""}
                    onChange={(val) => updateField("status", val)}
                    type="status"
                    columns={columns}
                  />
                </div>
              )}
            </div>

            <div className="field-row">
              <label>Due Date:</label>
              {editableTask.status === "completed" ? (
                <div className="view-task-field non-editable-field">
                  <div className="scroll-wrapper">
                    <div className="text-container">
                      {editableTask.dueDate
                        ? formatDateWithoutGMT(editableTask.dueDate)
                        : "No due date"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="view-task-field">
                  <InlineEditable
                    value={editableTask.dueDate || ""}
                    onChange={(val) => updateField("dueDate", val)}
                    type="date"
                    onEditingChange={handleEditingChange}
                  />
                </div>
              )}
            </div>

            <div className="field-row due-status-row">
              <label className="empty-label"></label>
              <div className={`due-status-text ${dueStatusClass}`}>
                {editableTask.dueDate
                  ? dueStatusText
                  : "No due date"}
              </div>
            </div>

            <div className="field-row">
              <label>Assigned To:</label>
              <InlineEditable
                value={editableTask.assignedTo || ""}
                onChange={(val) => updateField("assignedTo", val)}
                onEditingChange={handleEditingChange}
              />
            </div>
            <div className="field-row">
              <label>Story Points:</label>
              <InlineEditable
                value={editableTask.storyPoints || 0}
                onChange={(val) => updateField("storyPoints", val)}
                type="number"
                min="0"
                onEditingChange={handleEditingChange}
              />
            </div>

            <div className="field-row">
              <label>Timer:</label>
              <div className="view-task-field">
              {editableTask.status === "completed" ? (
                <div className="timer-toggle-container off disabled" style={{ cursor: "not-allowed" }}>
                  <span className="toggle-label-left">OFF</span>
                  <div className="toggle-slider">
                    <div className="toggle-knob">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="clock-icon"
                      >
                        <circle cx="12" cy="13" r="8" />
                        <path d="M12 9v4l2 2" />
                        <path d="M5 3L2 6" />
                        <path d="M22 6l-3-3" />
                        <path d="M6 19l-2 2" />
                        <path d="M18 19l2 2" />
                      </svg>
                    </div>
                  </div>
                  <span className="toggle-label-right">ON</span>
                </div>
                ) : (
                  <div
                    className={`timer-toggle-container ${editableTask.isTimerRunning ? "on" : "off"}`}
                    onClick={toggleTimer}
                    role="switch"
                    aria-checked={editableTask.isTimerRunning}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        toggleTimer();
                      }
                    }}
                  >
                    <span className="toggle-label-left">OFF</span>
                    <div className={`toggle-slider ${editableTask.isTimerRunning ? "active" : ""}`}>
                      <div className="toggle-knob">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={editableTask.isTimerRunning ? "#fff" : "#666"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="clock-icon"
                        >
                          <circle cx="12" cy="13" r="8" />
                          <path d="M12 9v4l2 2" />
                          <path d="M5 3L2 6" />
                          <path d="M22 6l-3-3" />
                          <path d="M6 19l-2 2" />
                          <path d="M18 19l2 2" />
                        </svg>
                      </div>
                    </div>
                    <span className="toggle-label-right">ON</span>
                  </div>
                )}
              </div>
            </div>

            <div className="field-row">
              <label>Time Spent:</label>
              <InlineTimeEditable
                value={getTotalTimeSpent()}
                onChange={(val) => updateField("timeSpent", val)}
                onEditingChange={handleEditingChange}
              />
            </div>

            <div className="view-modal-footer">
              {task.status === "completed" ? (
                <button className="back-to-boards-button" onClick={handleMoveToBoards}>
                  Back to Boards
                </button>
              ) : (
                <button className="complete-task-button" onClick={handleCompleteTask}>
                  Complete Task
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTaskModal;
