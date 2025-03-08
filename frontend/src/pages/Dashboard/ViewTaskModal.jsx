import React, { useState } from "react";
import TiptapEditor from "../../components/TiptapEditor";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./viewTaskModal.css";

// Helper to format date
function formatDateWithoutGMT(dateValue) {
  if (!dateValue) return "";
  const dateObj = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(dateObj)) return "";

  return dateObj.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Example allowed priorities
const allowedPriorities = [
  "A1", "A2", "A3",
  "B1", "B2", "B3",
  "C1", "C2", "C3",
  "D", "E",
];

// InlineEditable component
const InlineEditable = ({
  value,
  onChange,
  type = "text",
  columns = {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleConfirm = () => {
    setIsEditing(false);
    onChange(localValue);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };

  // Display logic for certain types
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
              style={{ width: "100%", height: "40px", resize: "none" }}
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
            />
          ) : isDropdown ? (
            <select
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onChange(e.target.value);
                setIsEditing(false);
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
            />
          )}
          {/* Only show tick/cross for non-dropdown fields */}
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
        // NON-EDITING VIEW:
        // Separate the scrollbar from the text container:
        <div className="scroll-wrapper">
          <div
            className="text-container"
            onClick={() => setIsEditing(true)}
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

// InlineTiptap component
const InlineTiptap = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const containerStyle = {
    minHeight: "300px",
    minWidth: "600px",
  };

  const handleConfirm = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  return (
    <div
      className={`view-task-field ${isEditing ? "is-editing" : ""}`}
      style={containerStyle}
    >
      {isEditing ? (
        <div style={containerStyle}>
          <TiptapEditor value={localValue} onChange={setLocalValue} />
          <div className="button-container">
            <button className="tick-btn" onClick={handleConfirm}>
              ✔️
            </button>
            <button className="cross-btn" onClick={handleCancel}>
              ❌
            </button>
          </div>
        </div>
      ) : value && value.trim() !== "" ? (
        // NON-EDITING VIEW for Tiptap:
        <div className="scroll-wrapper">
          <div
            className="text-container"
            onClick={() => setIsEditing(true)}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      ) : (
        <div className="scroll-wrapper">
          <div
            className="text-container"
            onClick={() => setIsEditing(true)}
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
}) => {
  if (!isModalOpen || !task) return null;

  const [editableTask, setEditableTask] = useState({ ...task });

  const updateField = (field, value) => {
    setEditableTask((prev) => {
      const updatedTask = { ...prev, [field]: value };
      handleUpdateTask(updatedTask);
      return updatedTask;
    });
  };

  return (
    <div className="view-modal-overlay">
      <div className="view-modal-content">
        <button className="view-close-modal" onClick={closeModal}>
          &times;
        </button>

        <h2 className="modal-title">
          <div className="title-section">
            <h3 className="panel-heading">Title</h3>
            <InlineEditable
              value={editableTask.title || ""}
              onChange={(val) => updateField("title", val)}
              type="title"
            />
          </div>
        </h2>

        <div className="view-modal-body">
          <div className="view-modal-left">
            <h3 className="panel-heading">Description</h3>
            <InlineTiptap
              value={editableTask.description || ""}
              onChange={(val) => updateField("description", val)}
            />
          </div>

          <div className="view-modal-right">
            <h3 className="panel-heading">Details</h3>
            <div className="field-row">
              <label>Priority:</label>
              <InlineEditable
                value={editableTask.priority || ""}
                onChange={(val) => updateField("priority", val)}
                type="priority"
              />
            </div>

            <div className="field-row">
              <label>Status:</label>
              <InlineEditable
                value={editableTask.status || ""}
                onChange={(val) => updateField("status", val)}
                type="status"
                columns={columns}
              />
            </div>

            <div className="field-row">
              <label>Due Date:</label>
              <InlineEditable
                value={editableTask.dueDate || ""}
                onChange={(val) => updateField("dueDate", val)}
                type="date"
              />
            </div>

            <div className="field-row">
              <label>Assigned To:</label>
              <InlineEditable
                value={editableTask.assignedTo || ""}
                onChange={(val) => updateField("assignedTo", val)}
              />
            </div>

            <div className="field-row">
              <label>Story Points:</label>
              <InlineEditable
                value={editableTask.storyPoints || 0}
                onChange={(val) => updateField("storyPoints", val)}
                type="number"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTaskModal;
