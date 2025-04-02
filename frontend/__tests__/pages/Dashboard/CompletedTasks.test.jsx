import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CompletedTasks from "../../../src/pages/Dashboard/CompletedTasks";
import { createBaseTask } from "../../../_testUtils/createBaseTask";

jest.mock("../../../src/components/boardComponents/TaskCard", () => (props) => {
  return <div data-testid="task-card">{props.task.title}</div>;
});

describe("CompletedTasks Component", () => {
  const mockOpenViewTaskModal = jest.fn();
  const mockDeleteTask = jest.fn();
  const mockStartTimer = jest.fn();
  const mockStopTimer = jest.fn();
  const mockSetIsTaskHovered = jest.fn();
  const mockSetIsTaskDropdownOpen = jest.fn();
  const mockHandleBackToBoards = jest.fn();

  const currentTime = new Date("2025-03-23T10:00:00.000Z");

  const completedTask1 = createBaseTask({
    _id: "1",
    title: "Task 1",
    completedAt: "2025-03-22T12:00:00.000Z",
  });

  const completedTask2 = createBaseTask({
    _id: "2",
    title: "Task 2",
    completedAt: "2025-03-22T14:00:00.000Z",
  });

  const incompleteTask = createBaseTask({
    _id: "3",
    title: "Incomplete Task",
    completedAt: null,
  });

  const defaultProps = {
    completedTasks: [completedTask1, completedTask2, incompleteTask],
    currentTime,
    openViewTaskModal: mockOpenViewTaskModal,
    deleteTask: mockDeleteTask,
    startTimer: mockStartTimer,
    stopTimer: mockStopTimer,
    isTaskHovered: false,
    setIsTaskHovered: mockSetIsTaskHovered,
    isTaskDropdownOpen: false,
    setIsTaskDropdownOpen: mockSetIsTaskDropdownOpen,
    handleBackToBoards: mockHandleBackToBoards,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders heading and filter options", () => {
    render(<CompletedTasks {...defaultProps} />);
    expect(screen.getByText("Completed Tasks")).toBeInTheDocument();
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Month")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  test("renders tasks grouped by default 'week' filter", () => {
    render(<CompletedTasks {...defaultProps} />);
    expect(screen.getByText("17/03/2025 - 23/03/2025")).toBeInTheDocument();
    const taskCards = screen.getAllByTestId("task-card");
    expect(taskCards.length).toBe(2);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.queryByText("Incomplete Task")).not.toBeInTheDocument();
  });

  test("changes grouping when filter is switched to 'Day'", () => {
    render(<CompletedTasks {...defaultProps} />);
    expect(screen.getByText("17/03/2025 - 23/03/2025")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Day"));
    expect(screen.getByText("22/03/2025")).toBeInTheDocument();
    expect(
      screen.queryByText("17/03/2025 - 23/03/2025")
    ).not.toBeInTheDocument();
  });

  test("changes grouping when filter is switched to 'Month'", () => {
    render(<CompletedTasks {...defaultProps} />);
    fireEvent.click(screen.getByText("Month"));
    expect(screen.getByText("03/2025")).toBeInTheDocument();
  });

  test("changes grouping when filter is switched to 'Year'", () => {
    render(<CompletedTasks {...defaultProps} />);
    fireEvent.click(screen.getByText("Year"));
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  test("updates localCompletedTasks when completedTasks prop changes", () => {
    const { rerender } = render(<CompletedTasks {...defaultProps} />);
    expect(screen.getAllByTestId("task-card").length).toBe(2);
    const newProps = {
      ...defaultProps,
      completedTasks: [completedTask1],
    };
    rerender(<CompletedTasks {...newProps} />);
    expect(screen.getAllByTestId("task-card").length).toBe(1);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
  });

  test("renders multiple groups when tasks span different weeks", () => {
    const completedTaskWeek1 = createBaseTask({
      _id: "1",
      title: "Task Week 1",
      completedAt: "2025-03-10T12:00:00.000Z", // Group header: "10/03/2025 - 16/03/2025"
    });
    const completedTaskWeek2 = createBaseTask({
      _id: "2",
      title: "Task Week 2",
      completedAt: "2025-03-22T14:00:00.000Z", // Group header: "17/03/2025 - 23/03/2025"
    });
    const props = {
      ...defaultProps,
      completedTasks: [completedTaskWeek1, completedTaskWeek2],
    };
    render(<CompletedTasks {...props} />);
    expect(screen.getByText("17/03/2025 - 23/03/2025")).toBeInTheDocument();
    expect(screen.getByText("10/03/2025 - 16/03/2025")).toBeInTheDocument();
  });

  test("applies active class to filter option when clicked", () => {
    render(<CompletedTasks {...defaultProps} />);
    const dayFilter = screen.getByText("Day");
    expect(screen.getByText("Week").className).toContain("active");
    fireEvent.click(dayFilter);
    expect(dayFilter.className).toContain("active");
    expect(screen.getByText("Week").className).not.toContain("active");
  });

  test("renders empty tasks container when no completed tasks exist", () => {
    const props = {
      ...defaultProps,
      completedTasks: [
        createBaseTask({ _id: "1", title: "Task 1", completedAt: null }),
      ],
    };
    render(<CompletedTasks {...props} />);
    expect(screen.queryByTestId("task-card")).not.toBeInTheDocument();
  });

  test("groups are sorted in descending order", () => {
    const taskRecent = createBaseTask({
      _id: "1",
      title: "Recent Task",
      completedAt: "2025-03-25T12:00:00.000Z", // "24/03/2025 - 30/03/2025"
    });
    const taskOlder = createBaseTask({
      _id: "2",
      title: "Older Task",
      completedAt: "2025-03-15T12:00:00.000Z", // "10/03/2025 - 16/03/2025"
    });
    const props = {
      ...defaultProps,
      completedTasks: [taskOlder, taskRecent],
    };
    const { container } = render(<CompletedTasks {...props} />);
    const groupHeadings = container.querySelectorAll(".task-group-heading");
    expect(groupHeadings[0].textContent).toBe("24/03/2025 - 30/03/2025");
    expect(groupHeadings[1].textContent).toBe("10/03/2025 - 16/03/2025");
  });
});
