import { useState, useEffect } from "react";
import TaskCard from "../../components/boardComponents/TaskCard";
import { formatDueDate } from "../../utils/dateUtils";
import FilterBar from "../../components/boardComponents/FilterBar";

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
        const offset = (day + 6) % 7;
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
  hideOldCompletedTasksDays = 365,
  hideOldCompletedTasksNever = true,
  currentTime,
  openViewTaskModal,
  deleteTask,
  startTimer,
  stopTimer,
  isTaskHovered,
  setIsTaskHovered,
  isTaskDropdownOpen,
  setIsTaskDropdownOpen,
  handleBackToBoards,
  userSettings,
  availableLabels,
}) => {
  const [localCompletedTasks, setLocalCompletedTasks] =
    useState(completedTasks);
  const [activeFilter, setActiveFilter] = useState("week");

  const [filters, setFilters] = useState({
    taskName: "",
    priority: [],
    assignedTo: "",
    storyPoints: "",
    timerRunning: null,
    dueStatus: null,
    today: null,
    startDate: null,
    endDate: null,
    labels: [],
  });

  useEffect(() => {
    setLocalCompletedTasks(completedTasks);
  }, [completedTasks]);

  const tasksAfterDateFilter = hideOldCompletedTasksNever
    ? localCompletedTasks
    : localCompletedTasks.filter((task) => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        const diffDays = (currentTime - completedDate) / (1000 * 60 * 60 * 24);
        return diffDays <= hideOldCompletedTasksDays;
      });

  const filterCompletedTasks = (tasks) => {
    return tasks.filter((task) => {
      // Task Name
      if (
        filters.taskName &&
        !task.title.toLowerCase().includes(filters.taskName.toLowerCase())
      ) {
        return false;
      }

      // Priority
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(task.priority)
      ) {
        return false;
      }

      if (filters.labels && filters.labels.length > 0) {
        const taskLabelTitles = task.labels?.map((label) => label.title) || [];
        const matchesAll = filters.labels.every((filterLabel) =>
          taskLabelTitles.includes(filterLabel)
        );
        if (!matchesAll) return false;
      }

      // Assigned To
      if (
        filters.assignedTo &&
        (!task.assignedTo ||
          !task.assignedTo
            .toLowerCase()
            .includes(filters.assignedTo.toLowerCase()))
      ) {
        return false;
      }

      // Story Points
      if (
        filters.storyPoints &&
        task.storyPoints !== Number(filters.storyPoints)
      ) {
        return false;
      }

      // Timer Running
      if (
        filters.timerRunning !== undefined &&
        filters.timerRunning !== null &&
        task.isTimerRunning !== filters.timerRunning
      ) {
        return false;
      }

      // Due Status
      if (filters.dueStatus) {
        if (filters.dueStatus === "none") {
          if (task.dueDate) return false;
        } else if (task.dueDate) {
          const now = new Date();
          const dueDate = new Date(task.dueDate);

          if (filters.dueStatus === "due" && dueDate < now) {
            return false;
          }
          if (filters.dueStatus === "overdue" && dueDate >= now) {
            return false;
          }
        } else {
          return false;
        }
      }

      // Date Range (startDate/endDate)
      if (filters.startDate) {
        const taskDate = new Date(task.completedAt);
        if (taskDate < filters.startDate) {
          return false;
        }
      }
      if (filters.endDate) {
        const taskDate = new Date(task.completedAt);
        if (taskDate > filters.endDate) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredTasks = filterCompletedTasks(
    tasksAfterDateFilter.filter((task) => task.completedAt)
  );

  const groupedTasks = groupTasksByFilter(filteredTasks, activeFilter);

  return (
    <div className="completed-tasks-page">
      <h1 className="page-title">Completed Tasks</h1>

      {/* Completed Tasks FilterBar */}
      <div className="completed-filter-bar">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          showTimer={false}
          rangeFilter={true}
          showCalendar={false}
          availableLabels={availableLabels}
        />
      </div>

      {/* Grouping filter options */}
      <div className="filter-container">
        {["day", "week", "month", "year"].map((filter) => (
          <div
            key={filter}
            className={`filter-option ${
              activeFilter === filter ? "active" : ""
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </div>
        ))}
      </div>

      {/* Completed tasks container */}
      <div className="completed-tasks-container">
        {groupedTasks.length === 0 ? (
          <div className="no-tasks-message">There are no completed tasks.</div>
        ) : (
          groupedTasks.map((group) => (
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
                  handleBackToBoards={handleBackToBoards}
                  userSettings={userSettings}
                  availableLabels={availableLabels}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompletedTasks;
