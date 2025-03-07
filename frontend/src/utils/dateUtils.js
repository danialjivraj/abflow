// src/utils/dateUtils.js

export const formatDueDate = (dueDate, currentTime) => {
    const due = new Date(dueDate);
    const diffInMs = due - currentTime;
  
    const formatValue = (value, singular, plural) => {
      const formatted = value === Math.floor(value) ? Math.floor(value) : value.toFixed(1);
      const num = formatted.toString().replace(/\.0$/, "");
      return `${num} ${num === "1" ? singular : plural}`;
    };
  
    const calculateTimeDifference = (diff) => {
      const diffInSeconds = diff / 1000;
      const diffInMinutes = diffInSeconds / 60;
      const diffInHours = diffInMinutes / 60;
      const diffInDays = diffInHours / 24;
      const diffInWeeks = diffInDays / 7;
      const diffInMonths = diffInDays / 30;
      const diffInYears = diffInDays / 365;
      return { diffInSeconds, diffInMinutes, diffInHours, diffInDays, diffInWeeks, diffInMonths, diffInYears };
    };
  
    const generateText = (diffValues, prefix) => {
      if (diffValues.diffInSeconds < 60) {
        return `${prefix} ${Math.round(diffValues.diffInSeconds)} second${Math.round(diffValues.diffInSeconds) === 1 ? "" : "s"}`;
      } else if (diffValues.diffInMinutes < 60) {
        return `${prefix} ${Math.round(diffValues.diffInMinutes)} minute${Math.round(diffValues.diffInMinutes) === 1 ? "" : "s"}`;
      } else if (diffValues.diffInHours < 24) {
        return `${prefix} ${formatValue(diffValues.diffInHours, "hour", "hours")}`;
      } else if (diffValues.diffInDays < 7) {
        return `${prefix} ${formatValue(diffValues.diffInDays, "day", "days")}`;
      } else if (diffValues.diffInWeeks < 4) {
        return `${prefix} ${formatValue(diffValues.diffInWeeks, "week", "weeks")}`;
      } else if (diffValues.diffInMonths < 12) {
        return `${prefix} ${formatValue(diffValues.diffInMonths, "month", "months")}`;
      } else {
        return `${prefix} ${formatValue(diffValues.diffInYears, "year", "years")}`;
      }
    };
  
    if (diffInMs < 0) {
      return {
        text: generateText(calculateTimeDifference(Math.abs(diffInMs)), "Overdue by"),
        isOverdue: true,
      };
    }
    return {
      text: generateText(calculateTimeDifference(diffInMs), "Due in"),
      isOverdue: false,
    };
  };
  