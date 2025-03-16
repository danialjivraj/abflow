/**
 * Formats a due date relative to the current time, returning a human-readable string and an overdue flag.
 *
 * @param {string|Date} dueDate - The due date as a string or Date object.
 * @param {Date} currentTime - The current time.
 * @returns {{text: string, isOverdue: boolean}} - An object containing the formatted time text and a flag indicating if it's overdue.
 */
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

/**
 * Formats a duration in seconds into a human-readable string.
 * If the duration is less than a minute, it shows seconds;
 * if less than an hour, it shows minutes and seconds;
 * otherwise, it shows hours and minutes.
 *
 * @param {number} totalSeconds - The total duration in seconds.
 * @returns {string} - The formatted duration string.
 */
export const formatTimeSpent = (totalSeconds) => {
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds !== 1 ? "s" : ""}`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} minute${minutes !== 1 ? "s" : ""}${
      seconds > 0 ? ` and ${seconds} second${seconds !== 1 ? "s" : ""}` : ""
    }`;
  } else {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours} hour${hours !== 1 ? "s" : ""}${
      minutes > 0 ? ` and ${minutes} minute${minutes !== 1 ? "s" : ""}` : ""
    }`;
  }
};

/**
 * Calculates the total time spent on a task.
 * It adds the backend-recorded time to any additional elapsed time if the timer is currently running.
 *
 * @param {number} timeSpent - The time (in seconds) already recorded.
 * @param {boolean} isTimerRunning - Indicates if the timer is running.
 * @param {string} timerStartTime - The ISO string representing when the timer started.
 * @returns {number} - The total time spent in seconds.
 */
export const calculateTotalTimeSpent = (timeSpent, isTimerRunning, timerStartTime) => {
  const backendTimeSpent = timeSpent || 0;
  const frontendElapsedTime = isTimerRunning
    ? Math.floor((new Date() - new Date(timerStartTime)) / 1000)
    : 0;
  return backendTimeSpent + frontendElapsedTime;
};

/**
 * Formats a date into a human-readable string without showing GMT.
 * It converts a date string or Date object into a format like "Month Day, Year, Hour:Minute AM/PM".
 *
 * @param {string|Date} dateValue - The date value to format.
 * @returns {string} - The formatted date string, or an empty string if the date is invalid.
 */
export const formatDateWithoutGMT = (dateValue) => {
  if (!dateValue) return "";
  const dateObj = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(dateObj)) return "";
  
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("en-GB", { month: "long" });
  const year = dateObj.getFullYear();
  const time = dateObj.toLocaleString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  
  return `${day} ${month}, ${year} at ${time}`;
};

/**
 * Formats the completed task's due date message.
 *
 * Compares the due date with the completed date and returns a message like:
 * - "Completed on 12/05/2025 (Overdue by 2 hours)"
 * - "Completed on 12/05/2025 (Completed 30 minutes early)"
 * - "Completed on 12/05/2025 (On time)" if there's no difference.
 *
 * @param {string|Date} dueDate - The task's due date.
 * @param {string|Date} completedAt - The date when the task was completed.
 * @returns {string} - A formatted message indicating how early or late the task was completed.
 */
export const formatCompletedDueDate = (dueDate, completedAt) => {
  const due = new Date(dueDate);
  const completed = new Date(completedAt);
  const diffInMs = completed - due;

  if (Math.abs(diffInMs) < 1000) {
    return `Completed on ${completed.toLocaleDateString('en-GB')} (On time)`;
  }

  const absDiffInMs = Math.abs(diffInMs);
  const diffInSeconds = absDiffInMs / 1000;

  const formatValue = (value, singular, plural) => {
    const formatted = value === Math.floor(value) ? Math.floor(value) : value.toFixed(1);
    const num = formatted.toString().replace(/\.0$/, "");
    return `${num} ${num === "1" ? singular : plural}`;
  };

  let timeText = "";
  if (diffInSeconds < 60) {
    timeText = `${Math.round(diffInSeconds)} second${Math.round(diffInSeconds) === 1 ? "" : "s"}`;
  } else {
    const diffInMinutes = diffInSeconds / 60;
    if (diffInMinutes < 60) {
      timeText = `${Math.round(diffInMinutes)} minute${Math.round(diffInMinutes) === 1 ? "" : "s"}`;
    } else {
      const diffInHours = diffInMinutes / 60;
      if (diffInHours < 24) {
        timeText = formatValue(diffInHours, "hour", "hours");
      } else {
        const diffInDays = diffInHours / 24;
        if (diffInDays < 7) {
          timeText = formatValue(diffInDays, "day", "days");
        } else {
          const diffInWeeks = diffInDays / 7;
          if (diffInWeeks < 4) {
            timeText = formatValue(diffInWeeks, "week", "weeks");
          } else {
            const diffInMonths = diffInDays / 30;
            if (diffInMonths < 12) {
              timeText = formatValue(diffInMonths, "month", "months");
            } else {
              const diffInYears = diffInDays / 365;
              timeText = formatValue(diffInYears, "year", "years");
            }
          }
        }
      }
    }
  }

  const formattedCompletedDate = completed.toLocaleDateString('en-GB');

  if (diffInMs > 0) {
    return `Completed on ${formattedCompletedDate} (Late by ${timeText})`;
  } else {
    return `Completed on ${formattedCompletedDate} (Early by ${timeText})`;
  }
};

/**
 * Checks if two dates fall on the same calendar day.
 *
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Determines the color for the calendar icon based on scheduled times and the current time.
 * Rules:
 *  - Only show the icon if the task is scheduled for TODAY.
 *  - If currentTime < scheduledAt => grey (#aaa)
 *  - If scheduledAt <= currentTime <= scheduledEnd => green (#4caf50)
 *  - Otherwise => null (no icon)
 *
 * @param {string|Date|null} scheduledAt - Start time of the schedule
 * @param {string|Date|null} scheduledEnd - End time of the schedule
 * @param {Date} currentTime - Current date/time
 * @returns {string|null} - A color string if the icon should be displayed, or null if it shouldn't.
 */
export function getCalendarIconColor(scheduledAt, scheduledEnd, currentTime) {
  if (!scheduledAt || !scheduledEnd) return null; // not scheduled => no icon

  const start = new Date(scheduledAt);
  const end = new Date(scheduledEnd);

  // Must be on the same day as currentTime
  if (!isSameDay(start, currentTime)) {
    return null;
  }

  // If it's still in the future (today) => grey
  if (currentTime < start) {
    return "#aaa";
  }

  // If it's currently within [start, end] => green
  if (currentTime >= start && currentTime <= end) {
    return "#4caf50";
  }

  // If it's already past end => no icon
  return null;
}

/**
 * Converts seconds to hours.
 *
 * @param {number} totalSeconds - The total duration in seconds.
 * @returns {string} - The duration in hours.
 */
export const formatTimeSpentInHours = (totalSeconds) => {
  const hours = totalSeconds / 3600; // Convert seconds to hours
  return `${hours}`; // Return the hours as a string
};

/**
 * Formats a numeric value as hours if the provided metric is "timeSpent".
 * Otherwise, returns the value unchanged.
 *
 * @param {number} value - The numeric value (e.g. seconds) to be formatted.
 * @param {string} metric - The metric type (e.g. "timeSpent").
 * @returns {string|number} - Returns a formatted string (e.g. "3.50h") if metric is timeSpent, 
 *                            or the original value for other metrics.
 */
export const formatToHoursIfTimeSpent = (value, metric) => {
  if (metric === "timeSpent") {
    const hours = (value / 3600).toFixed(2);
    return `${hours}h`;
  }
  return value;
};
