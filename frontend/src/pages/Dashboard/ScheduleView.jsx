import React, { useState, useEffect } from "react";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { FiList, FiX } from "react-icons/fi";
import { updateTask } from "../../services/tasksService";
import ScheduleEditModal from "./ScheduleEditModal";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const ScheduleView = ({ tasks, updateTaskInState }) => {
  const mapTaskToEvent = (task) => {
    const start = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
    const end = task.scheduledEnd ? new Date(task.scheduledEnd) : new Date(start.getTime() + 60 * 60 * 1000);
    
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showUnscheduledPanel, setShowUnscheduledPanel] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropPosition, setDropPosition] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const scheduledTasks = tasks.filter((task) => task.scheduledAt);
    const unscheduled = tasks.filter((task) => !task.scheduledAt);
    setEvents(scheduledTasks.map(mapTaskToEvent));
    setUnscheduledTasks(unscheduled);
  }, [tasks]);

  const priorityColors = {
    A1: "#ff4d4d",
    A2: "#ff6666",
    A3: "#ff9999",
    B1: "#4d4dff",
    B2: "#6666ff",
    B3: "#9999ff",
    C1: "#4dff4d",
    C2: "#66ff66",
    C3: "#99ff99",
    D: "#cc66ff",
    E: "#ff9966"
  };

  const CustomEvent = ({ event }) => {
    const priorityColor = priorityColors[event.priority] || "#ffffff";
    return (
      <div className="custom-event">
        <span>{event.title}</span>
        {event.priority && (
          <span
            className="priority-label"
            style={{ background: priorityColor }}
          >
            {event.priority}
          </span>
        )}
      </div>
    );
  };

  function CustomEventForMonth({ event }) {
    const priorityColor = priorityColors[event.priority] || "#fff";
    return (
      <div className="custom-event-month">
        <span>{event.title}</span>
        {event.priority && (
          <span
            className="priority-label"
            style={{ background: priorityColor }}
          >
            {event.priority}
          </span>
        )}
      </div>
    );
  }

  function CustomAgendaEvent({ event }) {
    const priorityColor = priorityColors[event.priority] || "#fff";
    return (
      <div className="custom-agenda-event">
        <span>{event.title}</span>
        {event.priority && (
          <span
            className="priority-label"
            style={{ background: priorityColor }}
          >
            {event.priority}
          </span>
        )}
      </div>
    );
  }

  const filteredUnscheduledTasks = unscheduledTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!showUnscheduledPanel) {
      setSearchQuery("");
    }
  }, [showUnscheduledPanel]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleEventDrop = async ({ event, start, end }) => {
    try {
      const nextEvents = events.map((evt) =>
        evt.id === event.id ? { ...evt, start, end } : evt
      );
      setEvents(nextEvents);

      const updatedTask = {
        ...event.task,
        scheduledAt: start.toISOString(),
        scheduledEnd: end.toISOString(),
      };

      await updateTask(updatedTask);
      updateTaskInState(updatedTask);
    } catch (error) {
      console.error("Error updating scheduled task:", error);
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    try {
      const nextEvents = events.map((evt) =>
        evt.id === event.id ? { ...evt, start, end } : evt
      );
      setEvents(nextEvents);

      const updatedTask = {
        ...event.task,
        scheduledAt: start.toISOString(),
        scheduledEnd: end.toISOString(),
      };
      await updateTask(updatedTask);
      updateTaskInState(updatedTask);
    } catch (error) {
      console.error("Error resizing event:", error);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleModalSave = (updatedEvent) => {
    const nextEvents = events.map((evt) =>
      evt.id === updatedEvent.id ? updatedEvent : evt
    );
    setEvents(nextEvents);

    const updatedTask = {
      ...updatedEvent.task,
      scheduledAt: updatedEvent.start.toISOString(),
      scheduledEnd: updatedEvent.end.toISOString(),
    };
    updateTask(updatedTask)
      .then(() => {
        updateTaskInState(updatedTask);
      })
      .catch((error) => {
        console.error("Error updating task:", error);
      });

    setModalOpen(false);
    setSelectedEvent(null);
  };

  const handleUnscheduleTask = (event) => {
    const updatedTask = {
      ...event.task,
      scheduledAt: null,
      scheduledEnd: null,
    };

    updateTask(updatedTask)
      .then(() => {
        updateTaskInState(updatedTask);
        setEvents(events.filter((evt) => evt.id !== event.id));
        setUnscheduledTasks([...unscheduledTasks, updatedTask]);
      })
      .catch((error) => {
        console.error("Error unscheduling task:", error);
      });

    setModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDropFromOutside = ({ start, end }) => {
    if (!draggedTask) return;
  
    const newEvent = mapTaskToEvent({
      ...draggedTask,
      scheduledAt: start,
      scheduledEnd: end,
    });
    // update the events state with a new array reference
    setEvents([...events, newEvent]);
  
    // remove the task from unscheduled tasks
    setUnscheduledTasks(unscheduledTasks.filter((t) => t._id !== draggedTask._id));
  
    // update the task on the backend
    const updatedTask = {
      ...draggedTask,
      scheduledAt: start.toISOString(),
      scheduledEnd: end.toISOString(),
    };
    updateTask(updatedTask)
      .then(() => {
        updateTaskInState(updatedTask);
      })
      .catch((error) => {
        console.error("Error updating task:", error);
      });
  
    // Force the calendar to re-render by changing the key
    setRefreshKey((prev) => prev + 1);
  
    setDraggedTask(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropPosition(null);
  };

  const handleDragOver = (e) => {
    if (!draggedTask) return;

    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const date = localizer.getSlotDate(
      e.target,
      { x: offsetX, y: offsetY },
      localizer
    );

    setDropPosition(date);
  };

  const dragFromOutsideItem = () => {
    return draggedTask ? mapTaskToEvent(draggedTask) : null;
  };

  return (
    <div className="schedule-view-container">
      <h2 className="schedule-view-heading">Schedule</h2>

      <button
        onClick={() => setShowUnscheduledPanel(!showUnscheduledPanel)}
        className="unscheduled-panel-toggle-button"
      >
        {showUnscheduledPanel ? <FiX /> : <FiList />}
        {showUnscheduledPanel ? "Close" : "Unscheduled Tasks"}
      </button>

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
              <button onClick={handleClearSearch} className="clear-search-button">
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
                >
                  {truncatedTitle}
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
        draggableAccessor={() => true}
        onDropFromOutside={handleDropFromOutside}
        dragFromOutsideItem={dragFromOutsideItem}
        selectable
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
          style={{
            top: dropPosition.y,
            left: dropPosition.x,
          }}
        >
          {draggedTask.title}
        </div>
      )}

      {modalOpen && selectedEvent && (
        <ScheduleEditModal
          eventData={selectedEvent}
          onSave={handleModalSave}
          onUnschedule={handleUnscheduleTask}
          onClose={() => {
            setModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default ScheduleView;
