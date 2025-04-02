import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getCalendarIconColor } from "../../utils/dateUtils";
import TaskLabels from "../boardComponents/TaskLabels";

const ScheduleEditModal = ({
  isModalOpen,
  eventData,
  onSave,
  onClose,
  onUnschedule,
}) => {
  const [start, setStart] = useState(
    eventData?.start ? new Date(eventData.start) : null,
  );
  const [end, setEnd] = useState(
    eventData?.end ? new Date(eventData.end) : null,
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (eventData) {
      if (eventData.start) {
        setStart(new Date(eventData.start));
      }
      if (eventData.end) {
        setEnd(new Date(eventData.end));
      }
    }
  }, [eventData]);

  if (!isModalOpen || !eventData) return null;

  const handleSave = () => {
    if (!start || !end) {
      setErrorMessage("Please select both Start and End time.");
      return;
    }
    if (start.getTime() === end.getTime()) {
      setErrorMessage("Start time and End time cannot be the same.");
      return;
    }
    if (end < start) {
      setErrorMessage("End time cannot be earlier than Start time.");
      return;
    }
    const startDay = start.toISOString().slice(0, 10);
    const endDay = end.toISOString().slice(0, 10);
    if (startDay !== endDay) {
      setErrorMessage("Task must start and end on the same day.");
      return;
    }
    setErrorMessage("");
    const updatedEvent = {
      ...eventData,
      start,
      end,
    };
    onSave(updatedEvent);
  };

  const handleUnschedule = () => {
    onUnschedule(eventData);
  };

  const calendarColor = getCalendarIconColor(
    eventData.start,
    eventData.end,
    new Date(),
  );

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
                className="calendar-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ "--calendar-color": calendarColor }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
          </h2>

          <div className="modal-body">
            {eventData.task.labels && eventData.task.labels.length > 0 && (
              <TaskLabels
                labels={eventData.task.labels}
                hideLabelText={false}
                truncateLength={null}
              />
            )}
            <div className="title-priority">
              <div className="title-container">
                <label className="title-label">Title:</label>
                <div className="title-text">{eventData.title}</div>
              </div>
              <div
                className={`priority-circle priority-${eventData.task.priority?.replace(
                  /\s+/g,
                  "",
                )}`}
              >
                {eventData.task.priority}
              </div>
            </div>

            <label className="time-label">Start Time:</label>
            <div className="date-picker-wrapper">
              <DatePicker
                selected={start}
                onChange={(date) => setStart(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="d MMMM, yyyy h:mm aa"
                className="custom-date-picker"
                placeholderText="Select start time"
              />
            </div>

            <label className="time-label">End Time:</label>
            <div className="date-picker-wrapper">
              <DatePicker
                selected={end}
                onChange={(date) => setEnd(date)}
                timeIntervals={15}
                showTimeSelect
                dateFormat="d MMMM, yyyy h:mm aa"
                className="custom-date-picker"
                placeholderText="Select end time"
              />
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>

          <div className="modal-footer footer-custom">
            <div>
              {!eventData.isUnscheduled && (
                <button className="unschedule-btn" onClick={handleUnschedule}>
                  Unschedule
                </button>
              )}
            </div>
            <div className="button-group">
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
