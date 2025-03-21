import {
    formatDueDate,
    formatTimeSpent,
    calculateTotalTimeSpent,
    formatDateWithoutGMT,
    formatCompletedDueDate,
  } from "../../src/utils/dateUtils";
  
  // formatDueDate
  describe("dateUtils - formatDueDate", () => {
    const currentTime = new Date("2022-01-01T00:00:00.000Z");
  
    test("returns 'Due in 10 seconds' for a 10-second difference", () => {
      const dueDate = new Date(currentTime.getTime() + 10 * 1000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 10 seconds");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Due in 1 second' for exactly 1 second difference", () => {
      const dueDate = new Date(currentTime.getTime() + 1000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 1 second");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Due in 1 minute' for a 60-second difference", () => {
      const dueDate = new Date(currentTime.getTime() + 60000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 1 minute");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Due in 1.5 hours' for a 1.5-hour difference", () => {
      const dueDate = new Date(currentTime.getTime() + 1.5 * 3600000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 1.5 hours");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Due in 2 days' for a 2-day difference", () => {
      const dueDate = new Date(currentTime.getTime() + 2 * 86400000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 2 days");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Due in 1 week' for a 7-day difference", () => {
      const dueDate = new Date(currentTime.getTime() + 7 * 86400000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 1 week");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Due in 1.5 months' for a 45-day difference", () => {
      const dueDate = new Date(currentTime.getTime() + 45 * 86400000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 1.5 months");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Due in 1.1 years' for a 400-day difference", () => {
      const dueDate = new Date(currentTime.getTime() + 400 * 86400000);
      const result = formatDueDate(dueDate, currentTime);
      expect(result.text).toBe("Due in 1.1 years");
      expect(result.isOverdue).toBe(false);
    });
  
    test("returns 'Overdue by 1 minute' when dueDate is in the past", () => {
      const pastTime = new Date(currentTime.getTime() - 60000);
      const result = formatDueDate(pastTime, currentTime);
      expect(result.text).toBe("Overdue by 1 minute");
      expect(result.isOverdue).toBe(true);
    });
  });
  
  // formatTimeSpent
  describe("dateUtils - formatTimeSpent", () => {
    test("formats seconds correctly", () => {
      expect(formatTimeSpent(45)).toBe("45 seconds");
      expect(formatTimeSpent(1)).toBe("1 second");
    });
  
    test("formats minutes and seconds correctly", () => {
      expect(formatTimeSpent(75)).toBe("1 minute and 15 seconds");
      expect(formatTimeSpent(120)).toBe("2 minutes");
    });
  
    test("formats hours and minutes correctly", () => {
      expect(formatTimeSpent(3660)).toBe("1 hour and 1 minute");
      expect(formatTimeSpent(7200)).toBe("2 hours");
    });
  });
  
  // calculateTotalTimeSpent
  describe("dateUtils - calculateTotalTimeSpent", () => {
    beforeAll(() => {
      jest.useFakeTimers("modern");
    });
    afterAll(() => {
      jest.useRealTimers();
    });
  
    test("returns backend time when timer is not running", () => {
      const result = calculateTotalTimeSpent(100, false, "2022-01-01T00:00:00.000Z");
      expect(result).toBe(100);
    });
  
    test("returns sum of backend time and elapsed time when timer is running", () => {
      const startTime = new Date("2022-01-01T00:00:00.000Z").toISOString();
      jest.setSystemTime(new Date("2022-01-01T00:00:05.000Z"));
      const result = calculateTotalTimeSpent(100, true, startTime);
      expect(result).toBe(105);
    });
  });
  
  // formatDateWithoutGMT
  describe("dateUtils - formatDateWithoutGMT", () => {
    test("formats valid date string correctly", () => {
      const expected = "5 January, 2022 at 10:00 am";
      const formatted = formatDateWithoutGMT("2022-01-05T10:00:00.000Z");
      expect(formatted).toBe(expected);
    });
  
    test("returns empty string for invalid dates", () => {
      expect(formatDateWithoutGMT("not-a-date")).toBe("");
      expect(formatDateWithoutGMT(null)).toBe("");
    });
  });
  
  // ormatCompletedDueDate
  describe("dateUtils - formatCompletedDueDate", () => {
    test("returns on time message if completed nearly at dueDate", () => {
      const dueDate = "2022-01-05T10:00:00.000Z";
      const completedAt = "2022-01-05T10:00:00.500Z"; // less than 1 second difference
      const result = formatCompletedDueDate(dueDate, completedAt);
      expect(result).toBe("Completed on 05/01/2022 (On time)");
    });
  
    test("returns late message if completed after dueDate", () => {
      const dueDate = "2022-01-05T10:00:00.000Z";
      const completedAt = "2022-01-05T11:00:00.000Z"; // 1 hour late
      const result = formatCompletedDueDate(dueDate, completedAt);
      expect(result).toBe("Completed on 05/01/2022 (Late by 1 hour)");
    });
  
    test("returns early message if completed before dueDate", () => {
      const dueDate = "2022-01-05T10:00:00.000Z";
      const completedAt = "2022-01-05T09:30:00.000Z"; // 30 minutes early
      const result = formatCompletedDueDate(dueDate, completedAt);
      expect(result).toBe("Completed on 05/01/2022 (Early by 30 minutes)");
    });
  });
  