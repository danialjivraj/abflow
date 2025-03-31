import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DragDropContext } from "@hello-pangea/dnd";
import TaskCard from "../../../src/components/boardComponents/TaskCard";
import { createBaseTask } from "../../../_testUtils/createBaseTask";
import { toast } from "react-toastify";

jest.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }) => <div>{children}</div>,
  Draggable: ({ children, draggableId }) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({
        innerRef: jest.fn(),
        draggableProps: {},
        dragHandleProps: {},
      })}
    </div>
  ),
  Droppable: ({ children, droppableId }) => (
    <div data-testid={`droppable-${droppableId}`}>
      {children({
        innerRef: jest.fn(),
        droppableProps: {},
      })}
    </div>
  ),
}));

const dateUtils = require("../../../src/utils/dateUtils");
jest.mock("../../../src/utils/dateUtils", () => ({
  formatDueDate: jest.fn(() => ({ text: "Due Soon", isOverdue: false })),
  formatCompletedDueDate: jest.fn(() => "Formatted Completed Due"),
  getCalendarIconColor: jest.fn(() => "red"),
}));

jest.mock(
  "../../../src/components/modals/DeleteConfirmationModal",
  () => (props) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="delete-modal">
        <span>{`Delete ${props.entityType}: ${props.entityName}`}</span>
        <button onClick={props.onConfirm}>Confirm Delete</button>
        <button onClick={props.onClose}>Cancel Delete</button>
      </div>
    );
  }
);

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const renderWithDnd = (ui) => {
  return render(<DragDropContext onDragEnd={() => {}}>{ui}</DragDropContext>);
};

const defaultTask = createBaseTask({
  _id: "task-1",
  title: "Task 1",
  priority: "A1",
  status: "in-progress",
  dueDate: "2022-01-05T10:00:00.000Z",
  scheduledStart: "2022-01-01T09:00:00.000Z",
  scheduledEnd: "2022-01-01T11:00:00.000Z",
  isTimerRunning: false,
});
const defaultProps = {
  task: defaultTask,
  index: 0,
  draggable: true,
  currentTime: new Date(),
  isTaskHovered: null,
  setIsTaskHovered: jest.fn(),
  isTaskDropdownOpen: null,
  setIsTaskDropdownOpen: jest.fn(),
  deleteTask: jest.fn(),
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  openViewTaskModal: jest.fn(),
  handleCompleteTask: jest.fn(() => Promise.resolve()),
  handleBackToBoards: jest.fn(),
  hideDots: false,
};

// =======================
// UNIT TESTS
// =======================
describe("TaskCard - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Rendering Tests ---
  test("renders task title", () => {
    renderWithDnd(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
  });

  test("renders due date text when task has dueDate", () => {
    renderWithDnd(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Due Soon")).toBeInTheDocument();
  });

  test("renders calendar icon if getCalendarIconColor returns a value", () => {
    renderWithDnd(<TaskCard {...defaultProps} />);
    const calendarIcon = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "svg" &&
        node.classList.contains("calendar-icon")
    );
    expect(calendarIcon).toBeDefined();
  });

  test("does not render calendar icon if getCalendarIconColor returns falsy", () => {
    dateUtils.getCalendarIconColor.mockImplementationOnce(() => null);
    renderWithDnd(<TaskCard {...defaultProps} />);
    expect(
      screen.queryByText(
        (content, node) =>
          node.tagName.toLowerCase() === "svg" &&
          node.classList.contains("calendar-icon")
      )
    ).toBeNull();
  });

  test("renders timer icon when task.isTimerRunning is true", () => {
    renderWithDnd(
      <TaskCard
        {...defaultProps}
        task={{ ...defaultTask, isTimerRunning: true }}
      />
    );
    const timerIcon = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "svg" &&
        node.classList.contains("alarm-clock-icon")
    );
    expect(timerIcon).toBeDefined();
  });

  describe("TaskCard - Priority Rendering Tests", () => {
    const priorities = [
      { value: "A1", expectedTitle: "A: Very Important" },
      { value: "A2", expectedTitle: "A: Very Important" },
      { value: "A3", expectedTitle: "A: Very Important" },
      { value: "B1", expectedTitle: "B: Important" },
      { value: "B2", expectedTitle: "B: Important" },
      { value: "B3", expectedTitle: "B: Important" },
      { value: "C1", expectedTitle: "C: Nice to do" },
      { value: "C2", expectedTitle: "C: Nice to do" },
      { value: "C3", expectedTitle: "C: Nice to do" },
      { value: "D", expectedTitle: "D: Delegate" },
      { value: "E", expectedTitle: "E: Eliminate" },
    ];

    priorities.forEach(({ value, expectedTitle }) => {
      test(`renders priority ${value} with correct tooltip`, () => {
        const task = createBaseTask({
          _id: "task-priority",
          title: "Task Priority",
          priority: value,
        });
        renderWithDnd(<TaskCard {...defaultProps} task={task} />);
        const priorityEl = screen.getByText(value);
        expect(priorityEl).toBeInTheDocument();
        expect(priorityEl).toHaveAttribute("title", expectedTitle);
      });
    });
  });

  test("does not render dots (actions) when hideDots is true", () => {
    renderWithDnd(<TaskCard {...defaultProps} hideDots={true} />);
    expect(screen.queryByText("⋮")).toBeNull();
  });

  // --- Due/Overdue Date for Completed Task ---
  test("renders formatted completed early date text when task is completed early", () => {
    const completedTask = createBaseTask({
      _id: "task-3",
      title: "Task 3",
      status: "completed",
      dueDate: "2022-01-05T10:00:00.000Z",
      completedAt: "2022-01-05T09:30:00.000Z", // Completed 30 minutes early
    });
    dateUtils.formatCompletedDueDate.mockImplementationOnce(
      () => "Completed on 05/01/2022 (Early by 30 minutes)"
    );
    renderWithDnd(<TaskCard {...defaultProps} task={completedTask} />);
    expect(
      screen.getByText("Completed on 05/01/2022 (Early by 30 minutes)")
    ).toBeInTheDocument();
  });

  test("renders formatted completed overdue date text when task is completed and overdue", () => {
    const completedTask = createBaseTask({
      _id: "task-1",
      title: "Task 1",
      status: "completed",
      dueDate: "2022-01-05T10:00:00.000Z",
      completedAt: "2022-01-05T11:00:00.000Z", // Completed 1 hour late
    });
    dateUtils.formatCompletedDueDate.mockImplementationOnce(
      () => "Completed on 05/01/2022 (Late by 1 hour)"
    );
    renderWithDnd(<TaskCard {...defaultProps} task={completedTask} />);
    expect(
      screen.getByText("Completed on 05/01/2022 (Late by 1 hour)")
    ).toBeInTheDocument();
  });

  test("renders formatted completed on time date text when task is completed on time", () => {
    const completedTask = createBaseTask({
      _id: "task-4",
      title: "Task 4",
      status: "completed",
      dueDate: "2022-01-05T10:00:00.000Z",
      completedAt: "2022-01-05T10:00:00.500Z",
    });
    dateUtils.formatCompletedDueDate.mockImplementationOnce(
      () => "Completed on 05/01/2022 (On time)"
    );
    renderWithDnd(<TaskCard {...defaultProps} task={completedTask} />);
    expect(
      screen.getByText("Completed on 05/01/2022 (On time)")
    ).toBeInTheDocument();
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("TaskCard - Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Card Click & Hover ---
  test("calls openViewTaskModal when card (outside actions) is clicked", () => {
    renderWithDnd(<TaskCard {...defaultProps} />);
    const card = screen.getByText("Task 1").closest(".task-card");
    fireEvent.click(card);
    expect(defaultProps.openViewTaskModal).toHaveBeenCalledWith(defaultTask);
  });

  test("sets isTaskHovered on mouse enter and clears on mouse leave", () => {
    renderWithDnd(<TaskCard {...defaultProps} />);
    const card = screen.getByText("Task 1").closest(".task-card");
    fireEvent.mouseEnter(card);
    expect(defaultProps.setIsTaskHovered).toHaveBeenCalledWith(defaultTask._id);
    fireEvent.mouseLeave(card);
    expect(defaultProps.setIsTaskHovered).toHaveBeenCalledWith(null);
  });

  // --- Dropdown Actions ---
  test("toggles dropdown when dots button is clicked", () => {
    renderWithDnd(<TaskCard {...defaultProps} />);
    const dotsButton = screen.getByText("⋮");
    fireEvent.click(dotsButton);
    expect(defaultProps.setIsTaskDropdownOpen).toHaveBeenCalledWith(
      defaultTask._id
    );
  });

  test("calls handleCompleteTask when 'Complete Task' button is clicked", async () => {
    renderWithDnd(
      <TaskCard {...defaultProps} isTaskDropdownOpen={defaultTask._id} />
    );
    const completeButton = screen.getByText("Complete Task");
    fireEvent.click(completeButton);
    await waitFor(() =>
      expect(defaultProps.handleCompleteTask).toHaveBeenCalledWith(defaultTask)
    );
    expect(defaultProps.setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  test("plays sound and shows toast on successful task completion", async () => {
    const playMock = jest.fn();

    global.Audio = jest.fn(() => ({
      play: playMock,
    }));

    const mockComplete = jest.fn(() => Promise.resolve());

    renderWithDnd(
      <TaskCard
        {...defaultProps}
        isTaskDropdownOpen={defaultTask._id}
        handleCompleteTask={mockComplete}
      />
    );

    const completeButton = screen.getByText("Complete Task");
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(defaultTask);
      expect(toast.success).toHaveBeenCalledWith("Task completed!");
      expect(playMock).toHaveBeenCalled();
    });
  });

  test("shows error toast and does not play sound on task completion failure", async () => {
    const playMock = jest.fn();
    window.HTMLMediaElement.prototype.play = playMock;

    const mockComplete = jest.fn(() => Promise.reject(new Error("fail")));
    renderWithDnd(
      <TaskCard
        {...defaultProps}
        isTaskDropdownOpen={defaultTask._id}
        handleCompleteTask={mockComplete}
      />
    );

    const completeButton = screen.getByText("Complete Task");
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(defaultTask);
      expect(toast.error).toHaveBeenCalledWith("Error completing task.");
      expect(playMock).not.toHaveBeenCalled();
    });
  });

  test("calls startTimer when task is not running and timer button is clicked", () => {
    renderWithDnd(
      <TaskCard {...defaultProps} isTaskDropdownOpen={defaultTask._id} />
    );
    const timerButton = screen.getByText("Start Timer");
    fireEvent.click(timerButton);
    expect(defaultProps.startTimer).toHaveBeenCalledWith(defaultTask._id);
    expect(defaultProps.setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  test("calls stopTimer when task is running and timer button is clicked", () => {
    renderWithDnd(
      <TaskCard
        {...defaultProps}
        task={{ ...defaultTask, isTimerRunning: true }}
        isTaskDropdownOpen={defaultTask._id}
      />
    );
    const timerButton = screen.getByText("Stop Timer");
    fireEvent.click(timerButton);
    expect(defaultProps.stopTimer).toHaveBeenCalledWith(defaultTask._id);
    expect(defaultProps.setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  test("dropdown shows only correct options for non-completed task", () => {
    const activeTask = createBaseTask({
      _id: "task-active",
      title: "Active Task",
      status: "in-progress",
      isTimerRunning: false,
    });
  
    renderWithDnd(
      <TaskCard
        {...defaultProps}
        task={activeTask}
        isTaskDropdownOpen={activeTask._id}
      />
    );
  
    const dropdownButtons = screen
      .getByRole("button", { name: "⋮" })
      .closest(".task-card")
      .querySelectorAll(".dropdown-menu.open button");
  
    const actualOptions = Array.from(dropdownButtons).map((btn) =>
      btn.textContent.trim()
    );
  
    const expectedOptions = ["Complete Task", "Start Timer", "Labels", "Duplicate", "Delete"];
  
    expect(actualOptions).toEqual(expectedOptions);
  });

  test("dropdown shows only fewer options for completed tasks", () => {
    const completedTask = createBaseTask({
      _id: "task-completed",
      title: "Completed Task",
      status: "completed",
      completedAt: "2022-01-05T12:00:00.000Z",
    });

    renderWithDnd(
      <TaskCard
        {...defaultProps}
        task={completedTask}
        isTaskDropdownOpen={completedTask._id}
      />
    );

    const dropdownButtons = screen
      .getByRole("button", { name: "⋮" })
      .closest(".task-card")
      .querySelectorAll(".dropdown-menu.open button");

    const actualOptions = Array.from(dropdownButtons).map((btn) =>
      btn.textContent.trim()
    );

    const expectedOptions = ["Back to Boards", "Labels", "Delete"];

    expect(actualOptions).toEqual(expectedOptions);
  });

  // --- Duplicate Task ---
  test("calls duplicateTask when duplicate button is clicked and passes the original task", () => {
    const duplicateTaskMock = jest.fn();
    const taskWithTimer = {
      ...defaultTask,
      _id: "task-with-timer",
      title: "Task with Timer",
      timeSpent: 120,
      isTimerRunning: true,
      timerStartTime: "2022-01-05T09:00:00.000Z",
      order: 2,
    };

    renderWithDnd(
      <TaskCard
        {...defaultProps}
        task={taskWithTimer}
        isTaskDropdownOpen={taskWithTimer._id}
        duplicateTask={duplicateTaskMock}
      />
    );

    const duplicateButton = screen.getByText("Duplicate");
    fireEvent.click(duplicateButton);

    expect(duplicateTaskMock).toHaveBeenCalledTimes(1);
    expect(duplicateTaskMock).toHaveBeenCalledWith(taskWithTimer);
  });

  test("calls handleBackToBoards when 'Back to Boards' is clicked for a completed task", () => {
    const completedTask = createBaseTask({
      _id: "task-1",
      title: "Task 1",
      status: "completed",
      completedAt: "2022-01-05T12:00:00.000Z",
    });
    renderWithDnd(
      <TaskCard
        {...defaultProps}
        task={completedTask}
        isTaskDropdownOpen={completedTask._id}
      />
    );
    const backToBoardsButton = screen.getByText("Back to Boards");
    fireEvent.click(backToBoardsButton);
    expect(defaultProps.handleBackToBoards).toHaveBeenCalledWith(completedTask);
    expect(defaultProps.setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  // --- Delete Modal ---
  test("does not open delete confirmation modal when confirmBeforeDeleteTask is false", () => {
    renderWithDnd(
      <TaskCard
        {...defaultProps}
        isTaskDropdownOpen={defaultTask._id}
        confirmBeforeDeleteTask={false}
      />
    );
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(screen.queryByTestId("delete-modal")).toBeNull();
    expect(defaultProps.deleteTask).toHaveBeenCalledWith(defaultTask._id);
  });

  test("opens delete confirmation modal when confirmBeforeDeleteTask is true", () => {
    renderWithDnd(
      <TaskCard
        {...defaultProps}
        isTaskDropdownOpen={defaultTask._id}
        confirmBeforeDeleteTask={true}
      />
    );
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
  });

  test("opens delete confirmation modal when 'Delete' is clicked", () => {
    renderWithDnd(
      <TaskCard {...defaultProps} isTaskDropdownOpen={defaultTask._id} />
    );
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
  });

  test("confirms deletion and calls deleteTask", async () => {
    renderWithDnd(
      <TaskCard {...defaultProps} isTaskDropdownOpen={defaultTask._id} />
    );
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    const confirmButton = screen.getByText("Confirm Delete");
    fireEvent.click(confirmButton);
    await waitFor(() => {
      expect(defaultProps.deleteTask).toHaveBeenCalledWith(defaultTask._id);
    });
  });

  // --- Non-Draggable Mode ---
  test("renders correctly in non-draggable mode", () => {
    const nonDraggableProps = { ...defaultProps, draggable: false };
    renderWithDnd(<TaskCard {...nonDraggableProps} />);
    const card = screen.getByText("Task 1");
    expect(card).toBeInTheDocument();
  });

  // --- Due Date Formatting Tests ---
  describe("Due Date Formatting Tests", () => {
    test("does not render due date span when task has no due date", () => {
      const taskWithoutDueDate = { ...defaultTask, dueDate: null };
      const { container } = renderWithDnd(
        <TaskCard {...defaultProps} task={taskWithoutDueDate} />
      );
      expect(container.querySelector(".due-date")).toBeNull();
    });

    const baseCurrentTime = new Date("2022-01-01T00:00:00.000Z");

    test("Due in 1 second", () => {
      const diff = 1000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1 second",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1 second")).toBeInTheDocument();
    });

    test("Due in 30 seconds", () => {
      const diff = 30000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 30 seconds",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 30 seconds")).toBeInTheDocument();
    });

    test("Due in 1 minute", () => {
      const diff = 60000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1 minute",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1 minute")).toBeInTheDocument();
    });

    test("Due in 30 minutes", () => {
      const diff = 30 * 60000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 30 minutes",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 30 minutes")).toBeInTheDocument();
    });

    test("Due in 1 hour", () => {
      const diff = 3600000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1 hour",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1 hour")).toBeInTheDocument();
    });

    test("Due in 1.5 hours", () => {
      const diff = 1.5 * 3600000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1.5 hours",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1.5 hours")).toBeInTheDocument();
    });

    test("Due in 1 day", () => {
      const diff = 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1 day",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1 day")).toBeInTheDocument();
    });

    test("Due in 4.7 days", () => {
      const diff = 4.7 * 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 4.7 days",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 4.7 days")).toBeInTheDocument();
    });

    test("Due in 1 week", () => {
      const diff = 7 * 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1 week",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1 week")).toBeInTheDocument();
    });

    test("Due in 3.7 weeks", () => {
      const diff = 3.7 * 7 * 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 3.7 weeks",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 3.7 weeks")).toBeInTheDocument();
    });

    test("Due in 1 month", () => {
      const diff = 30 * 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1 month",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1 month")).toBeInTheDocument();
    });

    test("Due in 7.8 months", () => {
      const diff = 7.8 * 30 * 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 7.8 months",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 7.8 months")).toBeInTheDocument();
    });

    test("Due in 1 year", () => {
      const diff = 365 * 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1 year",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1 year")).toBeInTheDocument();
    });

    test("Due in 1.1 years", () => {
      const diff = 1.1 * 365 * 86400000;
      const dueDate = new Date(baseCurrentTime.getTime() + diff).toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Due in 1.1 years",
        isOverdue: false,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={baseCurrentTime}
        />
      );
      expect(screen.getByText("Due in 1.1 years")).toBeInTheDocument();
    });

    // --- Overdue Tests ---
    test("Overdue by 1 second", () => {
      const diff = 1000;
      const currentTime = new Date("2022-01-01T00:00:01.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1 second",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1 second")).toBeInTheDocument();
    });

    test("Overdue by 30 seconds", () => {
      const diff = 30000;
      const currentTime = new Date("2022-01-01T00:00:30.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 30 seconds",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 30 seconds")).toBeInTheDocument();
    });

    test("Overdue by 1 minute", () => {
      const diff = 60000;
      const currentTime = new Date("2022-01-01T00:01:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1 minute",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1 minute")).toBeInTheDocument();
    });

    test("Overdue by 30 minutes", () => {
      const diff = 30 * 60000;
      const currentTime = new Date("2022-01-01T00:30:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 30 minutes",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 30 minutes")).toBeInTheDocument();
    });

    test("Overdue by 1 hour", () => {
      const diff = 3600000;
      const currentTime = new Date("2022-01-01T01:00:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1 hour",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1 hour")).toBeInTheDocument();
    });

    test("Overdue by 1.5 hours", () => {
      const diff = 1.5 * 3600000;
      const currentTime = new Date("2022-01-01T01:30:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1.5 hours",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1.5 hours")).toBeInTheDocument();
    });

    test("Overdue by 1 day", () => {
      const diff = 86400000;
      const currentTime = new Date("2022-01-02T00:00:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1 day",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1 day")).toBeInTheDocument();
    });

    test("Overdue by 4.7 days", () => {
      const diff = 4.7 * 86400000;
      const currentTime = new Date("2022-01-06T00:00:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 4.7 days",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 4.7 days")).toBeInTheDocument();
    });

    test("Overdue by 1 week", () => {
      const diff = 7 * 86400000;
      const currentTime = new Date("2022-01-08T00:00:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1 week",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1 week")).toBeInTheDocument();
    });

    test("Overdue by 3.7 weeks", () => {
      const diff = 3.7 * 7 * 86400000;
      const currentTime = new Date("2022-02-01T00:00:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 3.7 weeks",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 3.7 weeks")).toBeInTheDocument();
    });

    test("Overdue by 1 month", () => {
      const diff = 30 * 86400000;
      const currentTime = new Date("2022-02-01T00:00:00.000Z");
      const dueDate = new Date("2022-01-02T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1 month",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1 month")).toBeInTheDocument();
    });

    test("Overdue by 7.8 months", () => {
      const diff = 7.8 * 30 * 86400000;
      const currentTime = new Date("2023-08-01T00:00:00.000Z");
      const dueDate = new Date("2022-12-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 7.8 months",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 7.8 months")).toBeInTheDocument();
    });

    test("Overdue by 1 year", () => {
      const diff = 365 * 86400000;
      const currentTime = new Date("2023-01-01T00:00:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1 year",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1 year")).toBeInTheDocument();
    });

    test("Overdue by 1.1 years", () => {
      const diff = 1.1 * 365 * 86400000;
      const currentTime = new Date("2023-02-01T00:00:00.000Z");
      const dueDate = new Date("2022-01-01T00:00:00.000Z").toISOString();
      dateUtils.formatDueDate.mockImplementationOnce(() => ({
        text: "Overdue by 1.1 years",
        isOverdue: true,
      }));
      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={{ ...defaultTask, dueDate }}
          currentTime={currentTime}
        />
      );
      expect(screen.getByText("Overdue by 1.1 years")).toBeInTheDocument();
    });
  });

  describe("TaskCard - Label Tests", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test("renders multiple labels in the task card", () => {
      const longTitle =
        "Third Label With A Very Long Title That Will Be Truncated";
      const taskWithMultipleLabels = {
        ...defaultTask,
        labels: [
          { title: "Label One", color: "#111111" },
          { title: "Another Label", color: "#222222" },
          { title: longTitle, color: "#333333" },
        ],
      };

      renderWithDnd(
        <TaskCard {...defaultProps} task={taskWithMultipleLabels} />
      );

      const labelOne = screen.getByText("Label One");
      expect(labelOne).toBeInTheDocument();
      expect(labelOne).toHaveStyle("background-color: #111111");

      const anotherLabel = screen.getByText("Another Label");
      expect(anotherLabel).toBeInTheDocument();
      expect(anotherLabel).toHaveStyle("background-color: #222222");

      const expectedTruncated = longTitle.slice(0, 29) + "...";
      const truncatedLabel = screen.getByText(expectedTruncated);
      expect(truncatedLabel).toBeInTheDocument();
      expect(truncatedLabel).toHaveStyle("background-color: #333333");
    });

    test("truncates label title if longer than truncateLength", () => {
      const longTitle =
        "This label title is definitely longer than twenty-nine characters";
      const expectedTruncated = longTitle.slice(0, 29) + "...";
      const taskWithLongLabel = {
        ...defaultTask,
        labels: [{ title: longTitle, color: "#123456" }],
      };

      renderWithDnd(<TaskCard {...defaultProps} task={taskWithLongLabel} />);
      const labelSpan = screen.getByText(expectedTruncated);
      expect(labelSpan).toBeInTheDocument();
      expect(labelSpan).toHaveStyle("background-color: #123456");
    });

    test("does not truncate label title if shorter than truncateLength", () => {
      const shortTitle = "Short label";
      const taskWithShortLabel = {
        ...defaultTask,
        labels: [{ title: shortTitle, color: "#123456" }],
      };

      renderWithDnd(<TaskCard {...defaultProps} task={taskWithShortLabel} />);
      const labelSpan = screen.getByText(shortTitle);
      expect(labelSpan).toBeInTheDocument();
      expect(labelSpan).toHaveStyle("background-color: #123456");
    });

    test("hides label text when userSettings.hideLabelText is true", () => {
      const visibleTitle = "Visible Label";
      const taskWithLabel = {
        ...defaultTask,
        labels: [{ title: visibleTitle, color: "#abcdef" }],
      };

      renderWithDnd(
        <TaskCard
          {...defaultProps}
          task={taskWithLabel}
          userSettings={{ hideLabelText: true }}
        />
      );
      expect(screen.queryByText(visibleTitle)).toBeNull();

      const labelSpans = screen.getAllByText("", {
        selector: ".task-labels span",
      });
      expect(labelSpans.length).toBeGreaterThan(0);
      expect(labelSpans[0]).toHaveStyle("background-color: #abcdef");
    });
  });
});
