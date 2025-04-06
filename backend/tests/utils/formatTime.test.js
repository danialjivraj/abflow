const formatTime12Hour = require("../../utils/formatTime");

describe("formatTime12Hour", () => {
  it("should format a date in the afternoon with PM", () => {
    // date at 1:05 PM local time.
    const date = new Date("2025-03-20T13:05:00Z");
    const formatted = formatTime12Hour(date);
    expect(formatted.endsWith("PM")).toBe(true);
  });

  it("should format a date in the morning with AM", () => {
    // date at 7:30 AM local time.
    const date = new Date("2025-03-20T07:30:00Z");
    const formatted = formatTime12Hour(date);
    expect(formatted.endsWith("AM")).toBe(true);
  });

  it("should format minutes as two digits", () => {
    // date where minutes are less than 10.
    const date = new Date("2025-03-20T09:03:00Z");
    const formatted = formatTime12Hour(date);
    expect(formatted.includes(":03")).toBe(true);
  });

  it("should format noon correctly", () => {
    // date representing noon.
    const date = new Date("2025-03-20T12:00:00Z");
    const formatted = formatTime12Hour(date);
    expect(formatted.includes("12:00")).toBe(true);
    expect(formatted.endsWith("PM")).toBe(true);
  });
});
