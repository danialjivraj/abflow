import React, { useState, useEffect } from "react";

const ScheduleEditModal = ({ eventData, onSave, onClose, onUnschedule }) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

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

      setStart(formatDateTime(eventData.start));
      setEnd(formatDateTime(eventData.end));
    }
  }, [eventData]);

  const handleSave = () => {
    const updatedEvent = {
      ...eventData,
      start: new Date(start),
      end: new Date(end),
    };
    onSave(updatedEvent);
  };

  const handleUnschedule = () => {
    onUnschedule(eventData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>
          &times;
        </button>
        <h2>Edit Scheduled Task</h2>

        <div className="modal-body" style={{ flexDirection: "column" }}>
          {/* Title Row with badge to the far right */}
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
                  whiteSpace: "normal",    // allow line breaks
                  wordBreak: "break-word", // break long words if needed
                }}
              >
                {eventData.title}
              </div>
            </div>

            {/* Priority badge on the far right */}
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

          {/* Start/End Time fields */}
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
        </div>

        <div className="modal-footer" style={{ marginTop: "16px" }}>
          <button className="create-task-btn" onClick={handleSave}>
            Save
          </button>
          <button className="unschedule-btn" onClick={handleUnschedule}>
            Unschedule
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditModal;
