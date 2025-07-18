import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import ViewTaskModal from "../../src/components/modals/ViewTaskModal";
import { createBaseTask } from "../../_testUtils/createBaseTask";
import { createBaseColumn } from "../../_testUtils/createBaseColumn";
import {
  getLabelVariant,
  generatePattern,
} from "../../src/components/boardComponents/TaskLabels";

jest.mock("../../src/components/TiptapEditor", () => {
  return ({ value, onChange }) => (
    <div data-testid="tiptap-editor">
      <button onClick={() => onChange("updated description")}>
        Update Editor
      </button>
      <span>{value}</span>
    </div>
  );
});

jest.mock("../../src/services/tasksService", () => ({
  completeTask: jest.fn(() =>
    Promise.resolve({
      data: { _id: "1", title: "Test Task", status: "completed" },
    }),
  ),
  updateTask: jest.fn(() =>
    Promise.resolve({ data: { _id: "1", title: "Moved Task" } }),
  ),
}));

jest.mock("../../src/utils/dateUtils", () => ({
  formatDueDate: jest.fn(() => ({ text: "Formatted Due", isOverdue: false })),
  formatTimeSpent: jest.fn((seconds) => `Time: ${seconds}`),
  calculateTotalTimeSpent: jest.fn(() => 3600),
  formatDateWithoutGMT: jest.fn(() => "Formatted Date"),
  formatCompletedDueDate: jest.fn(() => "Formatted Completed Due"),
  getCalendarIconColor: jest.fn(() => "red"),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const { completeTask } = require("../../src/services/tasksService");
const { toast } = require("react-toastify");

const defaultProps = {
  isModalOpen: true,
  closeModal: jest.fn(),
  task: createBaseTask(),
  handleUpdateTask: jest.fn(),
  columns: {
    "in-progress": {
      ...createBaseColumn({ columnId: "in-progress", name: "In Progress" }),
    },
    completed: {
      ...createBaseColumn({ columnId: "completed", name: "Completed" }),
    },
  },
  startTimer: jest.fn(() =>
    Promise.resolve({ data: { timerStartTime: new Date().toISOString() } }),
  ),
  stopTimer: jest.fn(() => Promise.resolve({ data: { timeSpent: 3600 } })),
  setCompletedTasks: jest.fn(),
  readOnly: false,
  userSettings: { labelColorblindMode: false },
};

// =======================
// UNIT TESTS
// =======================
describe("ViewTaskModal - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("does not render when isModalOpen is false", () => {
    const { container } = render(
      <ViewTaskModal {...defaultProps} isModalOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("does not render when task is not provided", () => {
    const { container } = render(
      <ViewTaskModal {...defaultProps} task={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders the modal with header 'Task Overview'", () => {
    render(<ViewTaskModal {...defaultProps} />);
    const header = screen.getByRole("heading", { level: 2 });
    expect(header.textContent).toContain("Task Overview");
  });

  test("displays read-only title, description, and created date", () => {
    render(<ViewTaskModal {...defaultProps} readOnly={true} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("This is a test description.")).toBeInTheDocument();
    expect(screen.getAllByText("Formatted Date").length).toBeGreaterThan(0);
  });

  test("displays read-only priority via DropdownField", () => {
    render(<ViewTaskModal {...defaultProps} readOnly={true} />);
    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  test("calls closeModal when clicking the close (×) button", () => {
    render(<ViewTaskModal {...defaultProps} />);
    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);
    expect(defaultProps.closeModal).toHaveBeenCalled();
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("ViewTaskModal - Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("closes modal when overlay is clicked and unsaved edits are confirmed", () => {
    window.confirm = jest.fn(() => true);
    render(<ViewTaskModal {...defaultProps} readOnly={false} />);
    const titleField = screen.getByText("Test Task");
    fireEvent.click(titleField);
    const overlay = document.querySelector(".view-modal-overlay");
    fireEvent.click(overlay);
    expect(defaultProps.closeModal).toHaveBeenCalled();
  });

  test("does not close modal when unsaved edits confirmation is canceled", () => {
    window.confirm = jest.fn(() => false);
    render(<ViewTaskModal {...defaultProps} readOnly={false} />);
    const titleField = screen.getByText("Test Task");
    fireEvent.click(titleField);
    const overlay = document.querySelector(".view-modal-overlay");
    fireEvent.click(overlay);
    expect(defaultProps.closeModal).not.toHaveBeenCalled();
  });

  // Group 1: Normal Task (Editable, not completed)
  describe("Normal Task Inline Editing (Editable, not completed)", () => {
    const normalTask = createBaseTask({
      status: "in-progress",
      completedAt: null,
    });
    beforeEach(() => {
      render(
        <ViewTaskModal {...defaultProps} task={normalTask} readOnly={false} />,
      );
    });

    test("allows inline editing of title and confirms on Enter key", () => {
      const titleField = screen.getByText("Test Task");
      fireEvent.click(titleField);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Updated Title" } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("allows inline editing of time spent and confirms with Enter key", async () => {
      render(<ViewTaskModal {...defaultProps} readOnly={false} />);
      const timeDisplays = screen.getAllByText("Time: 3600");
      const timeDisplay = timeDisplays[0];
      fireEvent.click(timeDisplay);
      const hourInput = screen.getByDisplayValue("1");
      fireEvent.change(hourInput, { target: { value: "2" } });
      fireEvent.keyDown(hourInput, { key: "Enter", code: "Enter" });
      await waitFor(() => {
        expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
      });
    });

    test("allows inline editing of description using TiptapEditor and confirms on tick", () => {
      const descriptionField = screen.getByText("This is a test description.");
      fireEvent.click(descriptionField);
      const updateEditorButton = screen.getByText("Update Editor");
      fireEvent.click(updateEditorButton);
      const tickButton = screen.getByTestId("tick-icon");
      fireEvent.click(tickButton);
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("allows inline editing of assignedTo and confirms with Enter key", () => {
      const assignedToField = screen.getByText("John Doe");
      fireEvent.click(assignedToField);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Jane Smith" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("allows inline editing of storyPoints and confirms with Enter key", () => {
      const storyPointsField = screen.getByText("5");
      fireEvent.click(storyPointsField);
      const numberInput = screen.getByRole("spinbutton");
      fireEvent.change(numberInput, { target: { value: "8" } });
      fireEvent.keyDown(numberInput, { key: "Enter", code: "Enter" });
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("allows inline editing of due date and confirms with Enter key", () => {
      const dueDateLabel = screen.getByText("Due Date:");
      const dueDateRow = dueDateLabel.parentElement;
      const { getByText: getByTextWithin } = within(dueDateRow);
      const dueDateField = getByTextWithin("Formatted Date");
      fireEvent.click(dueDateField);
      const dateInput = screen.getByRole("textbox", { name: "" });
      fireEvent.change(dateInput, {
        target: { value: "2022-01-06T10:00:00.000Z" },
      });
      fireEvent.keyDown(dateInput, { key: "Enter", code: "Enter" });
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("renders editable priority dropdown and updates selection", () => {
      const priorityDropdown = screen.getByDisplayValue("A1");
      fireEvent.change(priorityDropdown, { target: { value: "B2" } });
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("renders editable status dropdown and updates selection", () => {
      const taskWithStatus = createBaseTask({ status: "in-progress" });
      render(
        <ViewTaskModal
          {...defaultProps}
          task={taskWithStatus}
          readOnly={false}
        />,
      );
      const statusDropdown = screen.getAllByDisplayValue("In Progress")[0];
      fireEvent.change(statusDropdown, { target: { value: "completed" } });
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });
  });

  // Group 2: Completed Task (Partially Editable)
  describe("Completed Task Inline Editing (Completed Task)", () => {
    const completedTask = createBaseTask({
      status: "completed",
      completedAt: "2022-01-05T12:00:00.000Z",
    });
    beforeEach(() => {
      render(
        <ViewTaskModal
          {...defaultProps}
          task={completedTask}
          readOnly={false}
        />,
      );
    });

    test("displays status as 'Completed' and prevents inline editing of status", () => {
      const statusElement = screen.getByText("Completed");
      expect(statusElement.tagName).toBe("DIV");
    });

    test("does not allow inline editing of due date for a completed task", () => {
      const dueDateLabel = screen.getByText("Due Date:");
      const dueDateRow = dueDateLabel.parentElement;
      const { getByText: getByTextWithin } = within(dueDateRow);
      expect(getByTextWithin("Formatted Date")).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "" })).toBeNull();
    });

    test("does not allow timer toggle for a completed task", () => {
      const timerContainer = screen.getByText("OFF").parentElement;
      expect(timerContainer).toHaveClass("disabled");
    });

    test("allows inline editing of title for a completed task", () => {
      const titleField = screen.getByText("Test Task");
      fireEvent.click(titleField);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "New Completed Title" } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("allows inline editing of description for a completed task", () => {
      const descriptionField = screen.getByText("This is a test description.");
      fireEvent.click(descriptionField);
      const updateEditorButton = screen.getByText("Update Editor");
      fireEvent.click(updateEditorButton);
      const tickButton = screen.getByTestId("tick-icon");
      fireEvent.click(tickButton);
      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();
    });

    test("does not allow inline editing of status for a completed task", () => {
      const statusElement = screen.getByText("Completed");
      fireEvent.click(statusElement);
      expect(statusElement.tagName).toBe("DIV");
    });
  });

  // Group 3: Read-Only Mode (No Inline Editing)
  describe("Read-Only Mode Inline Editing Prevention", () => {
    beforeEach(() => {
      render(<ViewTaskModal {...defaultProps} readOnly={true} />);
    });

    test("does not allow inline editing of title", () => {
      const titleField = screen.getByText("Test Task");
      fireEvent.click(titleField);
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    test("does not allow inline editing of assignedTo", () => {
      const assignedToField = screen.getByText("John Doe");
      fireEvent.click(assignedToField);
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    test("does not allow inline editing of storyPoints", () => {
      const storyPointsField = screen.getByText("5");
      fireEvent.click(storyPointsField);
      expect(screen.queryByRole("spinbutton")).toBeNull();
    });

    test("does not allow inline editing of due date", () => {
      const dueDateLabel = screen.getByText("Due Date:");
      const dueDateRow = dueDateLabel.parentElement;
      const { getByText: getByTextWithin } = within(dueDateRow);
      expect(getByTextWithin("Formatted Date")).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "" })).toBeNull();
    });

    test("does not allow inline editing of description", () => {
      const descriptionField = screen.getByText("This is a test description.");
      fireEvent.click(descriptionField);
      expect(screen.queryByTestId("tiptap-editor")).toBeNull();
    });

    test("does not render dropdown for priority in read-only mode", () => {
      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.queryByRole("combobox")).toBeNull();
    });

    test("does not render dropdown for status in read-only mode", () => {
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.queryByRole("combobox")).toBeNull();
    });
  });

  // timer toggle tests
  test("displays timer toggle as disabled in readOnly mode", () => {
    render(<ViewTaskModal {...defaultProps} readOnly={true} />);
    const timerContainer = screen.getByText("OFF").parentElement;
    expect(timerContainer).toHaveClass("disabled");
  });

  test("toggles timer when not readOnly via keyboard (Enter key)", async () => {
    const task = createBaseTask({ isTimerRunning: false });
    const props = { ...defaultProps, readOnly: false, task };
    render(<ViewTaskModal {...props} />);
    const timerToggle = screen.getByRole("switch");
    fireEvent.keyDown(timerToggle, { key: "Enter", code: "Enter" });
    await waitFor(() => {
      expect(props.startTimer).toHaveBeenCalledWith(task._id);
    });
  });

  test("handles error when toggling timer fails", async () => {
    const task = createBaseTask({ isTimerRunning: false });
    const props = {
      ...defaultProps,
      readOnly: false,
      task,
      startTimer: jest.fn(() => Promise.reject("Error")),
    };
    render(<ViewTaskModal {...props} />);
    const timerToggle = screen.getByRole("switch");
    fireEvent.click(timerToggle);
    await waitFor(() => {
      expect(props.startTimer).toHaveBeenCalledWith(task._id);
    });
  });

  // move to boards / complete task tests
  test("calls handleUpdateTask when 'Back to Boards' is clicked for a completed task and shows success toast", async () => {
    const updatedTask = createBaseTask({ status: "completed" });
    const props = { ...defaultProps, task: updatedTask, readOnly: false };
    const { updateTask } = require("../../src/services/tasksService");
    updateTask.mockResolvedValue({
      data: { ...updatedTask, title: "Moved Task" },
    });
    render(<ViewTaskModal {...props} />);
    const backToBoardsButton = await screen.findByText("Back to Boards");
    fireEvent.click(backToBoardsButton);
    await waitFor(() => {
      expect(updateTask).toHaveBeenCalled();
      expect(props.handleUpdateTask).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Task moved back to boards!");
      expect(props.closeModal).toHaveBeenCalled();
    });
  });

  test("shows error toast when 'Back to Boards' fails", async () => {
    const updatedTask = createBaseTask({ status: "completed" });
    const props = { ...defaultProps, task: updatedTask, readOnly: false };
    const { updateTask } = require("../../src/services/tasksService");
    updateTask.mockRejectedValue(new Error("Error moving task"));
    render(<ViewTaskModal {...props} />);
    const backToBoardsButton = await screen.findByText("Back to Boards");
    fireEvent.click(backToBoardsButton);
    await waitFor(() => {
      expect(updateTask).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Error moving task back to boards.",
      );
    });
  });

  test("calls completeTask when 'Complete Task' is clicked and shows success toast, and plays audio", async () => {
    const playMock = jest.fn();
    global.Audio = jest.fn().mockImplementation(() => {
      return { play: playMock };
    });

    const task = createBaseTask({ status: "in-progress" });
    const props = { ...defaultProps, readOnly: false, task };
    render(<ViewTaskModal {...props} />);
    const completeTaskButton = screen.getByText("Complete Task");
    fireEvent.click(completeTaskButton);
    await waitFor(() => {
      expect(completeTask).toHaveBeenCalledWith(task._id);
      expect(props.handleUpdateTask).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Task completed!");
      expect(props.closeModal).toHaveBeenCalled();
      expect(playMock).toHaveBeenCalled();
    });
  });

  test("shows error toast when 'Complete Task' fails", async () => {
    const task = createBaseTask({ status: "in-progress" });
    const props = { ...defaultProps, readOnly: false, task };
    const { completeTask } = require("../../src/services/tasksService");
    completeTask.mockRejectedValue(new Error("Completion failed"));
    render(<ViewTaskModal {...props} />);
    const completeTaskButton = screen.getByText("Complete Task");
    fireEvent.click(completeTaskButton);
    await waitFor(() => {
      expect(completeTask).toHaveBeenCalledWith(task._id);
      expect(toast.error).toHaveBeenCalledWith("Error completing task.");
    });
  });

  test("renders multiple labels above the title in the modal and verifies their colors", () => {
    const taskWithLabels = createBaseTask({
      labels: [
        { title: "Urgent", color: "#ff0000" },
        { title: "Backend", color: "#00ff00" },
      ],
    });
    const { container } = render(
      <ViewTaskModal {...defaultProps} task={taskWithLabels} />,
    );

    const titleBlock = container.querySelector(".title-block");
    expect(titleBlock).toBeInTheDocument();

    const labelsContainer = titleBlock.querySelector(".task-labels");
    expect(labelsContainer).toBeInTheDocument();

    const urgentLabel = within(labelsContainer).getByText("Urgent");
    const backendLabel = within(labelsContainer).getByText("Backend");
    expect(urgentLabel).toBeInTheDocument();
    expect(backendLabel).toBeInTheDocument();

    expect(urgentLabel).toHaveStyle("background-color: #ff0000");
    expect(backendLabel).toHaveStyle("background-color: #00ff00");

    const titleHeading = within(titleBlock).getByText("Title");
    expect(titleHeading).toBeInTheDocument();

    expect(titleBlock.firstChild).toEqual(labelsContainer);
  });

  describe("ViewTaskModal - Label Field", () => {
    const availableLabels = [
      { _id: "label-1", title: "Urgent", color: "#ff0000" },
    ];

    test("does not render label field in read-only mode", () => {
      render(
        <ViewTaskModal
          {...defaultProps}
          readOnly={true}
          newTaskLabels={[]}
          availableLabels={availableLabels}
        />,
      );
      expect(screen.queryByText("Labels:")).toBeNull();
      expect(screen.queryByText("Click to see labels")).toBeNull();
    });

    test("renders label field in editable mode", () => {
      render(
        <ViewTaskModal
          {...defaultProps}
          readOnly={false}
          newTaskLabels={[]}
          availableLabels={availableLabels}
        />,
      );
      expect(screen.getByText("Labels:")).toBeInTheDocument();
      expect(screen.getByText("Click to see labels")).toBeInTheDocument();
    });

    test("opens labels dropdown on clicking label field", () => {
      render(
        <ViewTaskModal
          {...defaultProps}
          readOnly={false}
          newTaskLabels={[]}
          availableLabels={availableLabels}
        />,
      );
      const labelDisplay = screen.getByText("Click to see labels");
      fireEvent.click(labelDisplay);
      const dropdown = document.querySelector(".nested-dropdown-menu");
      expect(dropdown).toBeInTheDocument();
    });

    test("shows label above title after toggling a label", async () => {
      const setNewTaskLabels = jest.fn((updateFn) => updateFn([]));
      const taskNoLabels = createBaseTask({ labels: [] });
      render(
        <ViewTaskModal
          {...defaultProps}
          task={taskNoLabels}
          readOnly={false}
          newTaskLabels={[]}
          availableLabels={[
            { _id: "label-1", title: "Urgent", color: "#ff0000" },
          ]}
          setNewTaskLabels={setNewTaskLabels}
        />,
      );

      const labelDisplay = screen.getByText("Click to see labels");
      fireEvent.click(labelDisplay);
      const dropdown = document.querySelector(".nested-dropdown-menu");
      expect(dropdown).toBeInTheDocument();

      const urgentLabelButton = within(dropdown).getByText("Urgent");
      fireEvent.click(urgentLabelButton);

      expect(defaultProps.handleUpdateTask).toHaveBeenCalled();

      // shows above the title since it was pressed
      const titleBlock = document.querySelector(".title-block");
      expect(titleBlock).toBeInTheDocument();

      await waitFor(() => {
        expect(within(titleBlock).getByText("Urgent")).toBeInTheDocument();
      });
    });
  });

  // ---------------------------
  // TaskLabels
  // ---------------------------
  describe("ViewTaskModal - TaskLabels Integration", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    const taskWithLabels = createBaseTask({
      labels: [
        { title: "Urgent", color: "#ff0000" },
        { title: "Backend", color: "#00ff00" },
      ],
    });

    test("renders TaskLabels without colorblind styling when labelColorblindMode is false", () => {
      render(
        <ViewTaskModal
          {...defaultProps}
          task={taskWithLabels}
          userSettings={{ labelColorblindMode: false }}
        />,
      );
      const urgentLabel = screen.getByText("Urgent");
      expect(urgentLabel).toBeInTheDocument();
      expect(urgentLabel.className).not.toContain("colorblind-label");
      expect(urgentLabel.style.getPropertyValue("--pattern-image")).toBe("");
    });

    test("renders TaskLabels with colorblind styling when labelColorblindMode is true", () => {
      render(
        <ViewTaskModal
          {...defaultProps}
          task={taskWithLabels}
          userSettings={{ labelColorblindMode: true }}
        />,
      );
      const urgentLabel = screen.getByText("Urgent");
      expect(urgentLabel).toBeInTheDocument();
      expect(urgentLabel.className).toContain("colorblind-label");
      const expectedPattern = generatePattern(getLabelVariant("Urgent"));
      expect(urgentLabel.style.getPropertyValue("--pattern-image")).toBe(
        expectedPattern,
      );
    });

    test("renders TaskLabels with visible label text even when userSettings.hideLabelText is true", () => {
      // although userSettings.hideLabelText is true, ViewTaskModal always passes false to TaskLabels.
      render(
        <ViewTaskModal
          {...defaultProps}
          task={taskWithLabels}
          userSettings={{ labelColorblindMode: true, hideLabelText: true }}
        />,
      );
      const urgentLabel = screen.getByText("Urgent");
      expect(urgentLabel).toBeInTheDocument();
      expect(urgentLabel.className).toContain("colorblind-label");
      const expectedPattern = generatePattern(getLabelVariant("Urgent"));
      expect(urgentLabel.style.getPropertyValue("--pattern-image")).toBe(
        expectedPattern,
      );
    });
  });
});
