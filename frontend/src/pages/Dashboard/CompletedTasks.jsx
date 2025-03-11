import React, { useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import { formatDueDate } from "../../utils/dateUtils";

const groupTasksByFilter = (tasks, filter) => {
  const groups = {};

  tasks.forEach((task) => {
    if (!task.completedAt) return;

    const date = new Date(task.completedAt);
    let groupKey = "";
    let sortDate = date;

    switch (filter) {
      case "day": {
        const dd = ("0" + date.getDate()).slice(-2);
        const mm = ("0" + (date.getMonth() + 1)).slice(-2);
        const yyyy = date.getFullYear();
        groupKey = `${dd}/${mm}/${yyyy}`;
        sortDate = new Date(yyyy, date.getMonth(), date.getDate());
        break;
      }
      case "week": {
        const day = date.getDay();
        const offset = day >= 5 ? day - 5 : day + 2;
        const start = new Date(date);
        start.setDate(date.getDate() - offset);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const formatDate = (d) => {
          const dd = ("0" + d.getDate()).slice(-2);
          const mm = ("0" + (d.getMonth() + 1)).slice(-2);
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };
        groupKey = `${formatDate(start)} - ${formatDate(end)}`;
        sortDate = start;
        break;
      }
      case "month": {
        const mm = ("0" + (date.getMonth() + 1)).slice(-2);
        const yyyy = date.getFullYear();
        groupKey = `${mm}/${yyyy}`;
        sortDate = new Date(yyyy, date.getMonth(), 1);
        break;
      }
      case "year": {
        groupKey = `${date.getFullYear()}`;
        sortDate = new Date(date.getFullYear(), 0, 1);
        break;
      }
      default:
        break;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = { sortDate, tasks: [] };
    }
    groups[groupKey].tasks.push(task);
  });

  const groupArray = Object.keys(groups).map((key) => ({
    key,
    sortDate: groups[key].sortDate,
    tasks: groups[key].tasks.sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    ),
  }));

  groupArray.sort((a, b) => b.sortDate - a.sortDate);
  return groupArray;
};

const CompletedTasks = ({
  completedTasks,
  currentTime,
  openViewTaskModal,
  deleteTask,
  startTimer,
  stopTimer,
  isTaskHovered,
  setIsTaskHovered,
  isTaskDropdownOpen,
  setIsTaskDropdownOpen,
}) => {
  const [localCompletedTasks, setLocalCompletedTasks] = useState(completedTasks);
  const [activeFilter, setActiveFilter] = useState("week");

  useEffect(() => {
    setLocalCompletedTasks(completedTasks);
  }, [completedTasks]);

  const groupedTasks = groupTasksByFilter(localCompletedTasks, activeFilter);

  return (
    <div className="completed-tasks-page">
      <h1>Completed Tasks</h1>
      {/* Filter Bar */}
      <div className="filter-container">
        {["day", "week", "month", "year"].map((filter) => (
          <div
            key={filter}
            className={`filter-option ${activeFilter === filter ? "active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </div>
        ))}
      </div>

      {/* Centered Tasks Container */}
      <div className="completed-tasks-container">
        {groupedTasks.map((group) => (
          <div key={group.key}>
            <div className="task-group-heading">{group.key}</div>
            {group.tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                draggable={false}
                formatDueDate={formatDueDate}
                currentTime={currentTime}
                isTaskHovered={isTaskHovered}
                setIsTaskHovered={setIsTaskHovered}
                isTaskDropdownOpen={isTaskDropdownOpen}
                setIsTaskDropdownOpen={setIsTaskDropdownOpen}
                deleteTask={deleteTask}
                startTimer={startTimer}
                stopTimer={stopTimer}
                openViewTaskModal={openViewTaskModal}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedTasks;
