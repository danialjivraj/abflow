import React, { useState, useEffect } from "react";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { FiList, FiX } from "react-icons/fi";
import { updateTask, updateTaskSchedule } from "../../services/tasksService";
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const ScheduleView = ({ tasks, updateTaskInState, onCreateTaskShortcut }) => {
  const navigate = useNavigate();

  const mapTaskToEvent = (task) => {
    const start = task.scheduledStart
      ? new Date(task.scheduledStart)
      : new Date();
    const end = task.scheduledEnd
      ? new Date(task.scheduledEnd)
      : new Date(start.getTime() + 60 * 60 * 1000);

    return {
      id: task._id,
      title: task.title,
      start,
      end,
      priority: task.priority,
      task,
    };
  };

  const [events, setEvents] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [showUnscheduledPanel, setShowUnscheduledPanel] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropPosition, setDropPosition] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentView, setCurrentView] = useState("week");

  useEffect(() => {
    const scheduledTasks = tasks.filter((task) => task.scheduledStart);
    const unscheduled = tasks.filter((task) => !task.scheduledStart);
    setEvents(scheduledTasks.map(mapTaskToEvent));
    setUnscheduledTasks(unscheduled);
  }, [tasks]);

  const CustomEvent = ({ event }) => {
    const priorityColor = event.priority
      ? `var(--priority-${event.priority})`
      : "#555";
    const eventTime = `${moment(event.start).format("h:mm A")} - ${moment(
      event.end
    ).format("h:mm A")}`;

    return (
      <div className="custom-event">
        <span className="event-time">{eventTime}</span>
        <span>{event.title}</span>
        <div
          className="priority-strip"
          style={{ backgroundColor: priorityColor }}
        >
          <span className="priority-label">{event.priority}</span>
        </div>
      </div>
    );
  };

  const CustomEventForMonth = ({ event }) => {
    const priorityColor = event.priority
      ? `var(--priority-${event.priority})`
      : "#555";
    const eventTime = `${moment(event.start).format("h:mm A")} - ${moment(
      event.end
    ).format("h:mm A")}`;

    return (
      <div className="custom-event-month">
        <span className="event-time">{eventTime}</span>
        <span>{event.title}</span>
        <div
          className="priority-strip"
          style={{ backgroundColor: priorityColor }}
        >
          <span className="priority-label">{event.priority}</span>
        </div>
      </div>
    );
  };

  const CustomAgendaEvent = ({ event }) => {
    const priorityColor = event.priority
      ? `var(--priority-${event.priority})`
      : "#555";
    const eventTime = `${moment(event.start).format("h:mm A")} - ${moment(
      event.end
    ).format("h:mm A")}`;

    return (
      <div className="custom-agenda-event">
        <span className="event-time">{eventTime}</span>
        <span>{event.title}</span>
        <div
          className="priority-strip"
          style={{ backgroundColor: priorityColor }}
        >
          <span className="priority-label">{event.priority}</span>
        </div>
      </div>
    );
  };

  const filteredUnscheduledTasks = unscheduledTasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  useEffect(() => {
    if (!showUnscheduledPanel) {
      setSearchQuery("");
    }
  }, [showUnscheduledPanel]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleEventDrop = async ({ event, start, end }) => {
    const startDay = start.toISOString().slice(0, 10);
    const endDay = end.toISOString().slice(0, 10);

    // Prevent multi-day events
    if (startDay !== endDay) {
      console.warn("Drop results in a multi-day event; ignoring drop.");
      return;
    }

    // Prevent events with the same start and end time
    if (start.getTime() === end.getTime()) {
      console.warn(
        "Drop results in an event with the same start and end time; ignoring drop."
      );
      return;
    }

    try {
      const nextEvents = events.map((evt) =>
        evt.id === event.id ? { ...evt, start, end } : evt
      );
      setEvents(nextEvents);

      const updatedSchedule = {
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
      };

      const updatedTask = (await updateTaskSchedule(event.id, updatedSchedule))
        .data;
      updateTaskInState(updatedTask);
    } catch (error) {
      console.error("Error updating scheduled task:", error);
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    const startDay = start.toISOString().slice(0, 10);
    const endDay = end.toISOString().slice(0, 10);

    // Prevent multi-day events
    if (startDay !== endDay) {
      console.warn("Resize results in a multi-day event; ignoring resize.");
      return;
    }

    // Prevent events with the same start and end time
    if (start.getTime() === end.getTime()) {
      console.warn(
        "Resize results in an event with the same start and end time; ignoring resize."
      );
      return;
    }

    try {
      const nextEvents = events.map((evt) =>
        evt.id === event.id ? { ...evt, start, end } : evt
      );
      setEvents(nextEvents);

      const updatedSchedule = {
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
      };

      const updatedTask = (await updateTaskSchedule(event.id, updatedSchedule))
        .data;
      updateTaskInState(updatedTask);
    } catch (error) {
      console.error("Error resizing event:", error);
    }
  };

  const handleDropFromOutside = ({ start, end }) => {
    if (!draggedTask) return;

    const startDay = start.toISOString().slice(0, 10);
    const endDay = end.toISOString().slice(0, 10);
    if (startDay !== endDay) {
      console.warn(
        "Drop from outside results in a multi-day event; ignoring drop."
      );
      return;
    }

    const newEvent = mapTaskToEvent({
      ...draggedTask,
      scheduledStart: start,
      scheduledEnd: end,
    });

    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setUnscheduledTasks((prev) =>
      prev.filter((t) => t._id !== draggedTask._id)
    );

    const updatedTask = {
      ...draggedTask,
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
    };
    updateTask(updatedTask)
      .then(() => {
        updateTaskInState(updatedTask);
      })
      .catch((error) => {
        console.error("Error updating task:", error);
      });

    setRefreshKey((prev) => prev + 1);
    setDraggedTask(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropPosition(null);
  };

  const handleSelectEvent = (event) => {
    navigate(`/dashboard/schedule/editevent/${event.id}`);
  };

  const handleUnscheduledTaskClick = (task) => {
    navigate(`/dashboard/schedule/editevent/${task._id}`);
  };

  return (
    <>
      <div className="schedule-header">
        <h1 className="page-title">Schedule</h1>
        <button
          onClick={() => setShowUnscheduledPanel(!showUnscheduledPanel)}
          className="unscheduled-panel-toggle-button"
        >
          {showUnscheduledPanel ? <FiX /> : <FiList />}
          {showUnscheduledPanel ? "Close" : "Unscheduled Tasks"}
        </button>
      </div>

      <div className="schedule-view-container">
        {showUnscheduledPanel && (
          <div className="unscheduled-panel">
            <h3 className="unscheduled-panel-heading">Unscheduled Tasks</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="unscheduled-panel-search"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="clear-search-button"
                >
                  <FiX />
                </button>
              )}
            </div>
            <ul className="unscheduled-tasks-list">
              {filteredUnscheduledTasks.map((task) => {
                const maxLength = 200;
                const truncatedTitle =
                  task.title.length > maxLength
                    ? `${task.title.slice(0, maxLength)}...`
                    : task.title;

                return (
                  <li
                    key={task._id}
                    className="unscheduled-task-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("task", JSON.stringify(task));
                      setDraggedTask(task);
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleUnscheduledTaskClick(task)}
                  >
                    {truncatedTitle}
                    <div
                      className={`priority-circle priority-${task.priority}`}
                    >
                      {task.priority}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DnDCalendar
          key={refreshKey}
          localizer={localizer}
          events={events}
          defaultDate={new Date()}
          defaultView="week"
          resizable
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelectEvent={handleSelectEvent}
          selectable
          onSelectSlot={(slotInfo) => {
            if (slotInfo.action !== "select" || currentView === "month") {
              return;
            }
            if (onCreateTaskShortcut) {
              onCreateTaskShortcut(slotInfo.start, slotInfo.end);
            }
          }}
          onView={(view) => setCurrentView(view)}
          draggableAccessor={() => true}
          onDropFromOutside={handleDropFromOutside}
          dragFromOutsideItem={() =>
            draggedTask ? mapTaskToEvent(draggedTask) : null
          }
          className="rbc-calendar"
          components={{
            month: {
              event: CustomEventForMonth,
            },
            week: {
              event: CustomEvent,
            },
            day: {
              event: CustomEvent,
            },
            agenda: {
              event: CustomAgendaEvent,
            },
          }}
        />

        {draggedTask && dropPosition && (
          <div
            className="event-preview"
            style={{ top: dropPosition.y, left: dropPosition.x }}
          >
            {draggedTask.title}
          </div>
        )}
      </div>
    </>
  );
};

export default ScheduleView;