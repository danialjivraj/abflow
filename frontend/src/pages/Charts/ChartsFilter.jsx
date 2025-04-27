import { startOfISOWeek, format } from "date-fns";

const allowedPriorities = [
  "A1",
  "A2",
  "A3",
  "B1",
  "B2",
  "B3",
  "C1",
  "C2",
  "C3",
  "D",
  "E",
];

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function computeDateRange({
  timeRangeType,
  customStartDate,
  customEndDate,
  tasks,
}) {
  const today = new Date();
  let startDate, endDate;

  switch (timeRangeType) {
    case "week": {
      startDate = startOfISOWeek(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "2weeks": {
      startDate = startOfISOWeek(
        new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      );
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 13);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "month": {
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      endDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      break;
    }
    case "year": {
      startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
    case "all-time": {
      const validTasks = tasks.filter(
        (task) => task.createdAt || task.completedAt,
      );
      if (validTasks.length > 0) {
        const earliest = new Date(
          Math.min(
            ...validTasks.map(
              (task) => new Date(task.createdAt || task.completedAt),
            ),
          ),
        );
        startDate = earliest;
      } else {
        startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
      }
      endDate = new Date();
      break;
    }
    case "custom":
      startDate = customStartDate ? new Date(customStartDate) : null;
      endDate = customEndDate ? new Date(customEndDate) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      break;
    default:
      break;
  }
  return { startDate, endDate };
}

export function applyAllFilters(tasksList, startDate, endDate, filters) {
  const {
    taskType,
    dueFilter,
    includeNoDueDate,
    priorityFilters,
    dayOfWeekFilters,
    statusFilters,
    labelFilters,
    includeNoneLabel,
    assignedToFilter,
    minStoryPoints,
    minTimeSpent,
    minTimeUnit,
    scheduledOnly,
  } = filters;

  let filtered = tasksList.filter((task) => {
    if (taskType === "active") {
      if (task.taskCompleted) return false;
      if (!task.createdAt) return false;
      const d = new Date(task.createdAt);
      return d >= startDate && d <= endDate;
    } else if (taskType === "completed") {
      if (!task.taskCompleted) return false;
      if (!task.completedAt) return false;
      const d = new Date(task.completedAt);
      return d >= startDate && d <= endDate;
    } else {
      let d;
      if (task.taskCompleted) {
        if (!task.completedAt) return false;
        d = new Date(task.completedAt);
      } else {
        if (!task.createdAt) return false;
        d = new Date(task.createdAt);
      }
      return d >= startDate && d <= endDate;
    }
  });

  if (dueFilter !== "both") {
    const now = new Date();
    filtered = filtered.filter((task) => {
      if (!task.dueDate) {
        return dueFilter === "due" ? includeNoDueDate : false;
      }
      const dueD = new Date(task.dueDate);
      return dueFilter === "due" ? dueD >= now : dueD < now;
    });
  } else if (!includeNoDueDate) {
    filtered = filtered.filter((task) => task.dueDate);
  }

  // priority Filter
  if (priorityFilters.length > 0) {
    filtered = filtered.filter((task) =>
      priorityFilters.includes(task.priority),
    );
  }

  // day of Week Filter
  if (dayOfWeekFilters.length > 0) {
    filtered = filtered.filter((task) => {
      const d = task.taskCompleted
        ? new Date(task.completedAt)
        : new Date(task.createdAt);
      return dayOfWeekFilters.includes(format(d, "EEEE"));
    });
  }

  // status Filter
  if (statusFilters.length > 0) {
    filtered = filtered.filter((task) => statusFilters.includes(task.status));
  }

  // label Filtering (Unified)
  filtered = filtered.filter((task) => {
    const hasLabels = task.labels && task.labels.length > 0;
    if (!hasLabels) {
      return includeNoneLabel;
    }
    if (labelFilters.length === 0) {
      return true;
    }
    return task.labels.some((lbl) => labelFilters.includes(lbl.title));
  });

  // assigned To Filter
  if (assignedToFilter.trim() !== "") {
    const term = assignedToFilter.trim().toLowerCase();
    filtered = filtered.filter(
      (task) => task.assignedTo && task.assignedTo.toLowerCase().includes(term),
    );
  }

  // minimum Story Points Filter
  if (minStoryPoints !== "" && !isNaN(parseInt(minStoryPoints, 10))) {
    const minVal = parseInt(minStoryPoints, 10);
    filtered = filtered.filter((task) => (task.storyPoints || 0) >= minVal);
  }

  // minimum Time Spent Filter (convert unit as needed)
  if (minTimeSpent !== "" && !isNaN(parseFloat(minTimeSpent))) {
    const value = parseFloat(minTimeSpent);
    let threshold = value;
    if (minTimeUnit === "minutes") threshold = value * 60;
    else if (minTimeUnit === "hours") threshold = value * 3600;
    filtered = filtered.filter((task) => (task.timeSpent || 0) >= threshold);
  }

  // scheduled Only Filter
  if (scheduledOnly) {
    filtered = filtered.filter(
      (task) => task.scheduledStart != null && task.scheduledStart !== "",
    );
  }

  return filtered;
}

export function groupTasks(tasksList, filters) {
  const {
    xAxisField,
    columnsMapping,
    labels,
    dayOfWeekFilters,
    priorityFilters,
    statusFilters,
    labelFilters,
    includeNoneLabel,
    includeZeroMetrics,
    taskType,
  } = filters;

  const groupMap = {};

  tasksList.forEach((task) => {
    let key;
    if (xAxisField === "day") {
      const d = task.taskCompleted
        ? new Date(task.completedAt)
        : new Date(task.createdAt);
      key = format(d, "EEEE");
    } else if (xAxisField === "priority") {
      key = task.priority || "None";
    } else if (xAxisField === "status") {
      key = task.taskCompleted
        ? "Completed"
        : columnsMapping[task.status] || task.status;
    }

    if (xAxisField !== "label") {
      if (!groupMap[key]) {
        groupMap[key] = { key, count: 0, timeSpent: 0, storyPoints: 0 };
      }
      groupMap[key].count += 1;
      groupMap[key].timeSpent += task.timeSpent || 0;
      groupMap[key].storyPoints += task.storyPoints || 0;
    } else {
      if (task.labels && task.labels.length > 0) {
        task.labels.forEach((label) => {
          if (labelFilters.length > 0 && !labelFilters.includes(label.title)) {
            return;
          }
          if (!groupMap[label.title]) {
            groupMap[label.title] = {
              key: label.title,
              count: 0,
              timeSpent: 0,
              storyPoints: 0,
              color: label.color,
            };
          }
          groupMap[label.title].count += 1;
          groupMap[label.title].timeSpent += task.timeSpent || 0;
          groupMap[label.title].storyPoints += task.storyPoints || 0;
        });
      } else {
        if (includeNoneLabel) {
          const noneKey = "None";
          if (!groupMap[noneKey]) {
            groupMap[noneKey] = {
              key: noneKey,
              count: 0,
              timeSpent: 0,
              storyPoints: 0,
            };
          }
          groupMap[noneKey].count += 1;
          groupMap[noneKey].timeSpent += task.timeSpent || 0;
          groupMap[noneKey].storyPoints += task.storyPoints || 0;
        }
      }
    }
  });

  if (includeZeroMetrics) {
    let possibleKeys = [];
    if (xAxisField === "day") {
      possibleKeys =
        dayOfWeekFilters.length > 0 ? dayOfWeekFilters : dayOptions;
    } else if (xAxisField === "priority") {
      possibleKeys =
        priorityFilters.length > 0 ? priorityFilters : allowedPriorities;
    } else if (xAxisField === "status") {
      possibleKeys =
        statusFilters.length > 0
          ? statusFilters.map((val) => columnsMapping[val] || val)
          : (() => {
              const keys = columnsMapping ? Object.values(columnsMapping) : [];
              if (!keys.includes("Completed")) {
                keys.push("Completed");
              }
              return Array.from(new Set(keys));
            })();
    } else if (xAxisField === "label") {
      possibleKeys = labels.map((l) => l.title);
    }
    possibleKeys.forEach((key) => {
      if (!groupMap[key]) {
        groupMap[key] = { key, count: 0, timeSpent: 0, storyPoints: 0 };
      }
    });
  }

  let groupedData = Object.values(groupMap);

  if (xAxisField === "status") {
    if (taskType === "active") {
      groupedData = groupedData.filter((item) => item.key !== "Completed");
    } else if (taskType === "completed") {
      groupedData = groupedData.filter((item) => item.key === "Completed");
    }
  }

  return groupedData;
}

export function mergeData(mainData, compData, yAxisMetric) {
  const merged = {};
  mainData.forEach((item) => {
    merged[item.key] = {
      key: item.key,
      mainValue: item[yAxisMetric] || 0,
      compValue: 0,
    };
  });
  compData.forEach((item) => {
    if (merged[item.key]) {
      merged[item.key].compValue = item[yAxisMetric] || 0;
    } else {
      merged[item.key] = {
        key: item.key,
        mainValue: 0,
        compValue: item[yAxisMetric] || 0,
      };
    }
  });

  const mergedArray = Object.values(merged);
  if (yAxisMetric === "timeSpent") {
    return mergedArray.map((item) => ({
      ...item,
      mainValue: item.mainValue / 3600,
      compValue: item.compValue / 3600,
    }));
  }
  return mergedArray;
}
