import React, { useState, useEffect } from "react";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
// Import the DnD addon and its styles
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { updateTask } from "../../services/tasksService"; // API call to update tasks

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const ScheduleView = ({ tasks, updateTaskInState }) => {
  // Map tasks to events.
  // If a task doesn’t have scheduledAt, default to now.
  // If it doesn’t have scheduledEnd, default to 1 hour after scheduledAt.
  const mapTaskToEvent = (task) => {
    const start = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
    const end = task.scheduledEnd
      ? new Date(task.scheduledEnd)
      : new Date(start.getTime() + 60 * 60 * 1000);
    return {
      id: task._id,
      title: task.title,
      start,
      end,
      task, // include the original task for updates
    };
  };

  const [events, setEvents] = useState(() => tasks.map(mapTaskToEvent));

  // Update events if tasks prop changes
  useEffect(() => {
    setEvents(tasks.map(mapTaskToEvent));
  }, [tasks]);

  // Called when an event is dragged to a new time slot.
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      // Update local events state for immediate feedback
      const nextEvents = events.map((evt) =>
        evt.id === event.id ? { ...evt, start, end } : evt
      );
      setEvents(nextEvents);

      // Prepare updated task with new scheduledAt and scheduledEnd
      const updatedTask = {
        ...event.task,
        scheduledAt: start.toISOString(),
        scheduledEnd: end.toISOString(),
      };

      // Update backend and parent state
      await updateTask(updatedTask);
      updateTaskInState(updatedTask);
    } catch (error) {
      console.error("Error updating scheduled task:", error);
    }
  };

  // Called when an event is resized.
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

  return (
    <div style={{ height: "80vh", padding: "1rem", backgroundColor: "#1a1a1a" }}>
      <h2 style={{ color: "#fff" }}>Schedule</h2>
      <DnDCalendar
        localizer={localizer}
        events={events}
        defaultDate={new Date()}
        defaultView="week"
        resizable
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        draggableAccessor={() => true}
        style={{ height: "100%", backgroundColor: "#1a1a1a", color: "#fff" }}
      />
    </div>
  );
};

export default ScheduleView;
