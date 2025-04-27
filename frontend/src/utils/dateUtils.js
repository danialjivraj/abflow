export const formatDueDate = (dueDate, currentTime) => {
  const due = new Date(dueDate);
  const diffInMs = due - currentTime;

  const formatValue = (value, singular, plural) => {
    const formatted =
      value === Math.floor(value) ? Math.floor(value) : value.toFixed(1);
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
    return {
      diffInSeconds,
      diffInMinutes,
      diffInHours,
      diffInDays,
      diffInWeeks,
      diffInMonths,
      diffInYears,
    };
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
      text: generateText(
        calculateTimeDifference(Math.abs(diffInMs)),
        "Overdue by",
      ),
      isOverdue: true,
    };
  }
  return {
    text: generateText(calculateTimeDifference(diffInMs), "Due in"),
    isOverdue: false,
  };
};

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

export const calculateTotalTimeSpent = (
  timeSpent,
  isTimerRunning,
  timerStartTime,
) => {
  const backendTimeSpent = timeSpent || 0;
  const frontendElapsedTime = isTimerRunning
    ? Math.floor((new Date() - new Date(timerStartTime)) / 1000)
    : 0;
  return backendTimeSpent + frontendElapsedTime;
};

export const formatDateWithoutGMT = (dateValue) => {
  if (!dateValue) return "";
  const dateObj =
    typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(dateObj)) return "";

  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("en-GB", { month: "long" });
  const year = dateObj.getFullYear();
  const time = dateObj.toLocaleString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${day} ${month}, ${year} at ${time}`;
};

export const formatCompletedDueDate = (dueDate, completedAt) => {
  const due = new Date(dueDate);
  const completed = new Date(completedAt);
  const diffInMs = completed - due;

  if (Math.abs(diffInMs) < 1000) {
    return `Completed on ${completed.toLocaleDateString("en-GB")} (On time)`;
  }

  const absDiffInMs = Math.abs(diffInMs);
  const diffInSeconds = absDiffInMs / 1000;

  const formatValue = (value, singular, plural) => {
    const formatted =
      value === Math.floor(value) ? Math.floor(value) : value.toFixed(1);
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

  const formattedCompletedDate = completed.toLocaleDateString("en-GB");

  if (diffInMs > 0) {
    return `Completed on ${formattedCompletedDate} (Late by ${timeText})`;
  } else {
    return `Completed on ${formattedCompletedDate} (Early by ${timeText})`;
  }
};

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getCalendarIconColor(
  scheduledStart,
  scheduledEnd,
  currentTime,
) {
  if (!scheduledStart || !scheduledEnd) return null; // not scheduled => no icon

  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  // must be on the same day as currentTime
  if (!isSameDay(start, currentTime)) {
    return null;
  }

  // if it's still in the future (today) => grey
  if (currentTime < start) {
    return "#aaa";
  }

  // if it's currently within [start, end] => green
  if (currentTime >= start && currentTime <= end) {
    return "#4caf50";
  }

  // if it's already past end => no icon
  return null;
}

export const formatTimeSpentInHours = (totalSeconds) => {
  const hours = totalSeconds / 3600;
  return `${hours}`;
};

export const formatToHoursIfTimeSpent = (value, metric) => {
  if (metric === "timeSpent") {
    const hours = (value / 3600).toFixed(2);
    return `${hours}h`;
  }
  return value;
};
