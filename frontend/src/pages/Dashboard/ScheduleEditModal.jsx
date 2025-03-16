import React, { useState, useEffect } from "react";
import { getCalendarIconColor } from "../../utils/dateUtils";

const ScheduleEditModal = ({ eventData, onSave, onClose, onUnschedule }) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (eventData) {
      const formatDateTime = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      if (eventData.start) {
        setStart(formatDateTime(eventData.start));
      }
      if (eventData.end) {
        setEnd(formatDateTime(eventData.end));
      }
    }
  }, [eventData]);

  const handleSave = () => {
    if (!start || !end) {
      setErrorMessage("Please select both Start and End time.");
      return;
    }

    const startTime = new Date(start);
    const endTime = new Date(end);

    if (startTime.getTime() === endTime.getTime()) {
      setErrorMessage("Start time and End time cannot be the same.");
      return;
    }

    if (endTime < startTime) {
      setErrorMessage("End time cannot be earlier than Start time.");
      return;
    }

    // New validation: Ensure both times fall on the same day.
    const startDay = startTime.toISOString().slice(0, 10);
    const endDay = endTime.toISOString().slice(0, 10);
    if (startDay !== endDay) {
      setErrorMessage("Task must start and end on the same day.");
      return;
    }

    setErrorMessage("");
    const updatedEvent = {
      ...eventData,
      start: startTime,
      end: endTime,
    };
    onSave(updatedEvent);
  };

  const handleUnschedule = () => {
    onUnschedule(eventData);
  };

  const calendarColor = getCalendarIconColor(eventData.start, eventData.end, new Date());

  return (
<div className="modal-overlay" onClick={onClose}>
  <div className="schedule-modal">
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>
          &times;
        </button>
        <h2>
          {eventData.isUnscheduled ? "Schedule Task" : "Edit Scheduled Task"}
          {!eventData.isUnscheduled && calendarColor && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                width: "22.5px",
                height: "22.5px",
                marginLeft: "8px",
                color: calendarColor,
              }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )}
        </h2>

        <div className="modal-body" style={{ flexDirection: "column" }}>
          {/* Title and Priority */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "6px",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  color: "#ddd",
                  fontSize: "16.2px",
                  fontWeight: "bold",
                  marginBottom: "2px",
                  display: "block",
                }}
              >
                Title:
              </label>
              <div
                style={{
                  color: "#fff",
                  fontSize: "14.4px",
                  padding: "4px",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {eventData.title}
              </div>
            </div>
            <div
              className={`priority-circle priority-${eventData.task.priority?.replace(
                /\s+/g,
                ""
              )}`}
              style={{ marginLeft: "20px" }}
            >
              {eventData.task.priority}
            </div>
          </div>

          {/* Start Time Field */}
          <label
            style={{
              color: "#ddd",
              fontSize: "16.2px",
              fontWeight: "bold",
              marginBottom: "2px",
            }}
          >
            Start Time:
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ marginBottom: "10px" }}
          />

          {/* End Time Field */}
          <label
            style={{
              color: "#ddd",
              fontSize: "16.2px",
              fontWeight: "bold",
              marginBottom: "2px",
            }}
          >
            End Time:
          </label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />

          {/* Inline Error Message */}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>

        <div
          className="modal-footer"
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {!eventData.isUnscheduled && (
              <button className="unschedule-btn" onClick={handleUnschedule}>
                Unschedule
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="create-task-btn" onClick={handleSave}>
              {eventData.isUnscheduled ? "Schedule" : "Save"}
            </button>
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
};

export default ScheduleEditModal;
