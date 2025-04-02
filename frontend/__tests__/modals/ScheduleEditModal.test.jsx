import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScheduleEditModal from "../../src/components/modals/ScheduleEditModal";
const { createBaseTask } = require("../../_testUtils/createBaseTask");

jest.mock("react-datepicker", () => {
  return ({ selected, onChange, placeholderText, className }) => (
    <input
      type="text"
      placeholder={placeholderText}
      value={selected ? selected.toString() : ""}
      onChange={(e) => onChange(new Date(e.target.value))}
      className={className}
      data-testid={placeholderText}
    />
  );
});

jest.mock("../../src/utils/dateUtils", () => ({
  getCalendarIconColor: jest.fn(() => "red"),
}));

const baseEventData = {
  start: "2022-01-01T10:00:00.000Z",
  end: "2022-01-01T12:00:00.000Z",
  title: "Test Event",
  isUnscheduled: false,
  task: createBaseTask(),
};

const defaultProps = {
  isModalOpen: true,
  eventData: baseEventData,
  onSave: jest.fn(),
  onClose: jest.fn(),
  onUnschedule: jest.fn(),
};

// =======================
// UNIT TESTS
// =======================
describe("ScheduleEditModal - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("does not render when isModalOpen is false", () => {
    const { container } = render(
      <ScheduleEditModal {...defaultProps} isModalOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("does not render when eventData is not provided", () => {
    const { container } = render(
      <ScheduleEditModal {...defaultProps} eventData={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders the modal when isModalOpen is true and eventData is provided", () => {
    render(<ScheduleEditModal {...defaultProps} />);
    expect(screen.getByText("Edit Scheduled Task")).toBeInTheDocument();
    expect(screen.getByText("Test Event")).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  test("renders header as 'Schedule Task' when eventData.isUnscheduled is true", () => {
    render(
      <ScheduleEditModal
        {...defaultProps}
        eventData={{ ...baseEventData, isUnscheduled: true }}
      />
    );
    expect(screen.getByText("Schedule Task")).toBeInTheDocument();
  });

  test("renders calendar icon when task is scheduled", () => {
    render(<ScheduleEditModal {...defaultProps} />);
    const calendarIcon = document.querySelector(".calendar-icon");
    expect(calendarIcon).toBeInTheDocument();
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("ScheduleEditModal - Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("shows error when start or end time is missing", () => {
    render(
      <ScheduleEditModal
        {...defaultProps}
        eventData={{ ...baseEventData, start: null }}
      />
    );
    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);
    expect(
      screen.getByText("Please select both Start and End time.")
    ).toBeInTheDocument();
  });

  test("shows error when start time and end time are the same", () => {
    const sameTime = "2022-01-01T10:00:00.000Z";
    render(
      <ScheduleEditModal
        {...defaultProps}
        eventData={{ ...baseEventData, start: sameTime, end: sameTime }}
      />
    );
    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);
    expect(
      screen.getByText("Start time and End time cannot be the same.")
    ).toBeInTheDocument();
  });

  test("shows error when end time is earlier than start time", () => {
    render(
      <ScheduleEditModal
        {...defaultProps}
        eventData={{
          ...baseEventData,
          start: "2022-01-01T12:00:00.000Z",
          end: "2022-01-01T10:00:00.000Z",
        }}
      />
    );
    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);
    expect(
      screen.getByText("End time cannot be earlier than Start time.")
    ).toBeInTheDocument();
  });

  test("shows error when start and end are on different days", () => {
    render(
      <ScheduleEditModal
        {...defaultProps}
        eventData={{
          ...baseEventData,
          start: "2022-01-01T23:00:00.000Z",
          end: "2022-01-02T01:00:00.000Z",
        }}
      />
    );
    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);
    expect(
      screen.getByText("Task must start and end on the same day.")
    ).toBeInTheDocument();
  });

  test("calls onSave with updated event data when valid dates are provided", async () => {
    render(<ScheduleEditModal {...defaultProps} />);
    const newStart = new Date("2022-01-01T11:00:00.000Z");
    const newEnd = new Date("2022-01-01T13:00:00.000Z");

    const startInput = screen.getByTestId("Select start time");
    const endInput = screen.getByTestId("Select end time");

    fireEvent.change(startInput, { target: { value: newStart.toISOString() } });
    fireEvent.change(endInput, { target: { value: newEnd.toISOString() } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalled();
      const updatedEvent = defaultProps.onSave.mock.calls[0][0];
      expect(new Date(updatedEvent.start).getTime()).toBe(newStart.getTime());
      expect(new Date(updatedEvent.end).getTime()).toBe(newEnd.getTime());
    });
  });

  test("calls onClose when clicking on the overlay", () => {
    const { container } = render(<ScheduleEditModal {...defaultProps} />);
    const overlay = container.querySelector(".modal-overlay");
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("calls onClose when the close (×) button is clicked", () => {
    render(<ScheduleEditModal {...defaultProps} />);
    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("calls onClose when Cancel button is clicked", () => {
    render(<ScheduleEditModal {...defaultProps} />);
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("calls onUnschedule when Unschedule button is clicked", () => {
    render(<ScheduleEditModal {...defaultProps} />);
    const unscheduleButton = screen.getByText("Unschedule");
    fireEvent.click(unscheduleButton);
    expect(defaultProps.onUnschedule).toHaveBeenCalledWith(
      defaultProps.eventData
    );
  });

  test("does not render Unschedule button when eventData.isUnscheduled is true", () => {
    render(
      <ScheduleEditModal
        {...defaultProps}
        eventData={{ ...baseEventData, isUnscheduled: true }}
      />
    );
    expect(screen.queryByText("Unschedule")).not.toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
  });

  test("updates date picker values when eventData prop changes", () => {
    const { rerender } = render(<ScheduleEditModal {...defaultProps} />);
    const startInput = screen.getByTestId("Select start time");
    const endInput = screen.getByTestId("Select end time");
    expect(startInput.value).toBe(new Date(baseEventData.start).toString());
    expect(endInput.value).toBe(new Date(baseEventData.end).toString());

    const newEventData = {
      ...baseEventData,
      start: "2022-02-01T09:00:00.000Z",
      end: "2022-02-01T11:00:00.000Z",
    };

    rerender(<ScheduleEditModal {...defaultProps} eventData={newEventData} />);
    expect(startInput.value).toBe(new Date(newEventData.start).toString());
    expect(endInput.value).toBe(new Date(newEventData.end).toString());
  });

  test("displays task labels if they exist", () => {
    const eventDataWithLabels = {
      ...baseEventData,
      task: {
        ...baseEventData.task,
        labels: [
          { title: "Urgent", color: "#ff0000" },
          { title: "Important", color: "#00ff00" },
        ],
      },
    };

    render(<ScheduleEditModal {...defaultProps} eventData={eventDataWithLabels} />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Important")).toBeInTheDocument();
  });
});
