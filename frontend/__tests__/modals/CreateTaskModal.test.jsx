import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateTaskModal from "../../src/components/modals/CreateTaskModal";
import { createBaseColumn } from "../../_testUtils/createBaseColumn";
import { createBaseUser } from "../../_testUtils/createBaseUser";
import {
  getLabelVariant,
  generatePattern,
} from "../../src/components/boardComponents/TaskLabels";

jest.mock("../../src/components/TiptapEditor", () => {
  return ({ value, onChange }) => (
    <div data-testid="tiptap-editor">
      <button onClick={() => onChange("Updated description")}>
        Update Editor
      </button>
      <span>{value}</span>
    </div>
  );
});

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
const { toast } = require("react-toastify");

const baseUser = createBaseUser({
  settingsPreferences: { defaultPriority: "B2" },
});

const baseColumn = createBaseColumn({ columnId: "backlog", name: "Backlog" });

const defaultProps = {
  isModalOpen: true,
  closeModal: jest.fn(),
  columns: { backlog: { ...baseColumn, items: [] } },
  columnsLoaded: true,
  newTaskTitle: "",
  setNewTaskTitle: jest.fn(),
  selectedPriority: "A1",
  setSelectedPriority: jest.fn(),
  selectedStatus: "",
  setSelectedStatus: jest.fn(),
  dueDate: null,
  setDueDate: jest.fn(),
  assignedTo: "",
  setAssignedTo: jest.fn(),
  taskDescription: "",
  setTaskDescription: jest.fn(),
  handleCreateTask: jest.fn(),
  dueDateWarning: "",
  setDueDateWarning: jest.fn(),
  storyPoints: 0,
  setStoryPoints: jest.fn(),
  newBoardCreateName: "",
  setNewBoardCreateName: jest.fn(),
  handleCreateBoard: jest.fn(),
  createBoardError: "",
  userSettings: { labelColorblindMode: false },
};

// =======================
// UNIT TESTS
// =======================
describe("CreateTaskModal Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("does not render when isModalOpen is false", () => {
    const { container } = render(
      <CreateTaskModal {...defaultProps} isModalOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders loading when columnsLoaded is false", () => {
    render(<CreateTaskModal {...defaultProps} columnsLoaded={false} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

test("opens with the default task priority from user settings and updates when changed", async () => {
  function TestWrapper({ defaultPriority }) {
    const [priority, setPriority] = React.useState(defaultPriority);

    React.useEffect(() => {
      setPriority(defaultPriority);
    }, [defaultPriority]);

    return (
      <CreateTaskModal
        {...defaultProps}
        selectedPriority={priority}
        setSelectedPriority={setPriority}
        defaultPriority={defaultPriority}
      />
    );
  }

  const { rerender } = render(
    <TestWrapper
      defaultPriority={baseUser.settingsPreferences.defaultPriority}
    />,
  );
  await waitFor(() => {
    expect(screen.getByDisplayValue("B2")).toBeInTheDocument();
  });

  baseUser.settingsPreferences.defaultPriority = "D";
  rerender(
    <TestWrapper
      defaultPriority={baseUser.settingsPreferences.defaultPriority}
    />,
  );
  await waitFor(() => {
    expect(screen.getByDisplayValue("D")).toBeInTheDocument();
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("CreateTaskModal Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Board Creation UI (no boards exist)
  describe("Board Creation UI (no boards exist)", () => {
    test("renders board creation UI", () => {
      render(<CreateTaskModal {...defaultProps} columns={{}} />);
      expect(
        screen.getByText(
          "You need to create a board before you can create tasks.",
        ),
      ).toBeInTheDocument();
      const boardNameInput = screen.getByPlaceholderText("Enter board name");
      expect(boardNameInput).toBeInTheDocument();
    });

    test("calls handleCreateBoard when tick button is clicked", () => {
      render(<CreateTaskModal {...defaultProps} columns={{}} />);
      const tickButton = screen.getByTestId("tick-icon");
      fireEvent.click(tickButton);
      expect(defaultProps.handleCreateBoard).toHaveBeenCalled();
    });

    test("calls closeModal and clears board name on Cancel button click", () => {
      render(<CreateTaskModal {...defaultProps} columns={{}} />);
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      expect(defaultProps.setNewBoardCreateName).toHaveBeenCalledWith("");
      expect(defaultProps.closeModal).toHaveBeenCalled();
    });

    test("clears board creation field on modal close and reopen", async () => {
      const { rerender } = render(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={true}
          newBoardCreateName="Some Board"
          columns={{}}
        />,
      );
      expect(screen.getByPlaceholderText("Enter board name").value).toBe(
        "Some Board",
      );
      // Closing the modal
      rerender(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={false}
          newBoardCreateName="Some Board"
          columns={{}}
        />,
      );
      // Reopen the modal
      rerender(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={true}
          newBoardCreateName=""
          columns={{}}
        />,
      );
      expect(screen.getByPlaceholderText("Enter board name").value).toBe("");
    });

    test("calls handleCreateBoard when Enter key is pressed in board creation input", () => {
      render(<CreateTaskModal {...defaultProps} columns={{}} />);
      const boardNameInput = screen.getByPlaceholderText("Enter board name");
      fireEvent.keyDown(boardNameInput, {
        key: "Enter",
        code: "Enter",
        charCode: 13,
      });
      expect(defaultProps.handleCreateBoard).toHaveBeenCalled();
    });
  });

  // Task Creation UI (boards exist)
  describe("Task Creation UI (boards exist)", () => {
    test("renders task creation UI elements", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
        />,
      );
      expect(screen.getByText("Create New Task")).toBeInTheDocument();
      expect(screen.getByText("Task Title:")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter Task Title"),
      ).toBeInTheDocument();
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
      allowedPriorities.forEach((priority) => {
        expect(
          screen.getByRole("option", { name: priority }),
        ).toBeInTheDocument();
      });
      expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    test("calls handleCreateTask when Create button is clicked and title is provided", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          newTaskTitle="Test Task"
        />,
      );
      const createButton = screen.getByText("Create");
      fireEvent.click(createButton);
      expect(defaultProps.handleCreateTask).toHaveBeenCalled();
    });

    test("displays error message when Create button is clicked with an empty title", async () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          newTaskTitle=""
        />,
      );
      const createButton = screen.getByText("Create");
      fireEvent.click(createButton);
      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toBe(
          "Task Title is required.",
        );
      });
    });

    test("calls closeModal when Cancel button is clicked", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
        />,
      );
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      expect(defaultProps.closeModal).toHaveBeenCalled();
    });

    test("calls closeModal when the '×' button is clicked", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
        />,
      );
      const closeXButton = screen.getByText("×");
      fireEvent.click(closeXButton);
      expect(defaultProps.closeModal).toHaveBeenCalled();
    });

    test("prompts for unsaved changes when clicking overlay with unsaved changes", () => {
      const confirmSpy = jest
        .spyOn(window, "confirm")
        .mockImplementation(() => true);
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          newTaskTitle="Unsaved Task"
        />,
      );
      const heading = screen.getByText("Create New Task");
      const overlay = heading.closest(".modal-overlay");
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay);
      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    test("does not close modal when unsaved changes confirmation is cancelled", () => {
      const confirmSpy = jest
        .spyOn(window, "confirm")
        .mockImplementation(() => false);
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          newTaskTitle="Unsaved Task"
        />,
      );
      const heading = screen.getByText("Create New Task");
      const overlay = heading.closest(".modal-overlay");
      fireEvent.click(overlay);
      expect(defaultProps.closeModal).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    test("sets due date warning when past date is selected", async () => {
      const mockSetDueDateWarning = jest.fn();
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          setDueDateWarning={mockSetDueDateWarning}
        />,
      );
      const dateInput = screen.getByPlaceholderText("Select due date");
      fireEvent.change(dateInput, {
        target: { value: "01 January, 2000 12:00 am" },
      });
      await waitFor(() => {
        expect(mockSetDueDateWarning).toHaveBeenCalled();
      });
    });

    test("clears due date warning when a future date is selected", async () => {
      const mockSetDueDateWarning = jest.fn();
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          setDueDateWarning={mockSetDueDateWarning}
        />,
      );
      const dateInput = screen.getByPlaceholderText("Select due date");
      fireEvent.change(dateInput, {
        target: { value: "01 January, 3000 12:00 am" },
      });
      await waitFor(() => {
        expect(mockSetDueDateWarning).toHaveBeenCalledWith("");
      });
    });

    test("updates task description when TiptapEditor update button is clicked", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
        />,
      );
      const updateButton = screen.getByText("Update Editor");
      fireEvent.click(updateButton);
      expect(defaultProps.setTaskDescription).toHaveBeenCalledWith(
        "Updated description",
      );
    });

    test("calls setters when input fields change", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
        />,
      );
      const taskTitleInput = screen.getByPlaceholderText("Enter Task Title");
      fireEvent.change(taskTitleInput, { target: { value: "New Title" } });
      expect(defaultProps.setNewTaskTitle).toHaveBeenCalledWith("New Title");

      const assignToInput = screen.getByPlaceholderText("Assign to...");
      fireEvent.change(assignToInput, { target: { value: "John Doe" } });
      expect(defaultProps.setAssignedTo).toHaveBeenCalledWith("John Doe");

      const storyPointsInput = screen.getByPlaceholderText("0");
      fireEvent.change(storyPointsInput, { target: { value: "5" } });
      expect(defaultProps.setStoryPoints).toHaveBeenCalledWith(5);
    });

    test("updates status select when changed", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{
            backlog: { ...baseColumn, items: [] },
            inprogress: { name: "In Progress", items: [] },
          }}
          selectedStatus=""
        />,
      );
      const statusSelect = screen
        .getAllByRole("combobox")
        .find((select) => select.innerHTML.includes("Backlog"));
      fireEvent.change(statusSelect, { target: { value: "inprogress" } });
      expect(defaultProps.setSelectedStatus).toHaveBeenCalledWith("inprogress");
    });

    test("clears all fields and errors on modal close and reopen", async () => {
      const { rerender } = render(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={true}
          newTaskTitle=""
          assignedTo="Some Assignee"
          taskDescription="Some description"
          storyPoints={5}
          dueDate={new Date("2000-01-01")}
        />,
      );
      fireEvent.click(screen.getByText("Create"));
      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toBe(
          "Task Title is required.",
        );
      });
      rerender(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={false}
          newTaskTitle="Some Error"
          assignedTo="Some Assignee"
          taskDescription="Some description"
          storyPoints={5}
          dueDate={new Date("2000-01-01")}
        />,
      );
      rerender(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={true}
          newTaskTitle=""
          assignedTo=""
          taskDescription=""
          storyPoints={0}
          dueDate={null}
        />,
      );
      expect(screen.getByPlaceholderText("Enter Task Title").value).toBe("");
      expect(screen.getByPlaceholderText("Assign to...").value).toBe("");
      expect(screen.getByPlaceholderText("0").value).toBe("0");
      const editorSpan = screen
        .getByTestId("tiptap-editor")
        .querySelector("span");
      expect(editorSpan.textContent).toBe("");
      expect(screen.queryByRole("alert")).toBeNull();
    });

    test('displays exact due date warning text "Warning: The selected due date is in the past." when a past date is selected', async () => {
      function TestWrapper() {
        const [warning, setWarning] = React.useState("");
        const [date, setDate] = React.useState(null);
        return (
          <CreateTaskModal
            {...defaultProps}
            dueDateWarning={warning}
            setDueDateWarning={setWarning}
            dueDate={date}
            setDueDate={setDate}
          />
        );
      }
      render(<TestWrapper />);
      const dateInput = screen.getByPlaceholderText("Select due date");
      fireEvent.change(dateInput, {
        target: { value: "01 January, 2000 12:00 am" },
      });
      await waitFor(() => {
        expect(
          screen.getByText("Warning: The selected due date is in the past."),
        ).toBeInTheDocument();
      });
    });

    test("opens with the correct status selected when provided via props", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{
            backlog: { ...baseColumn, items: [] },
            inprogress: { name: "In Progress", items: [] },
          }}
          selectedStatus="backlog"
        />,
      );
      const statusSelect = screen
        .getAllByRole("combobox")
        .find((select) => select.innerHTML.includes("Backlog"));
      expect(statusSelect.value).toBe("backlog");
    });
  });

  describe("Labels Field", () => {
    function LabelsWrapper() {
      const [newTaskLabels, setNewTaskLabels] = React.useState([]);
      return (
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          availableLabels={[
            { title: "Urgent", color: "red" },
            { title: "Feature", color: "blue" },
          ]}
          newTaskLabels={newTaskLabels}
          setNewTaskLabels={setNewTaskLabels}
        />
      );
    }

    test("renders 'Select Labels' when no labels are selected", () => {
      render(<LabelsWrapper />);
      expect(screen.getByText("Select Labels")).toBeInTheDocument();
    });

    test("toggles 'Urgent' label selection", () => {
      render(<LabelsWrapper />);
      fireEvent.click(screen.getByText("Select Labels"));
      const urgentButton = screen.getByRole("button", { name: "Urgent" });
      expect(urgentButton).toBeInTheDocument();
      fireEvent.click(urgentButton);
      expect(screen.getByText("Urgent")).toBeInTheDocument();
      const labelsContainer = document.querySelector(
        ".selected-labels-display",
      );
      fireEvent.click(labelsContainer);
      const urgentButtonAttached = screen.getByRole("button", {
        name: "Urgent x",
      });
      fireEvent.click(urgentButtonAttached);
      expect(screen.getByText("Select Labels")).toBeInTheDocument();
    });

    test("toggles 'Feature' label selection", () => {
      render(<LabelsWrapper />);
      fireEvent.click(screen.getByText("Select Labels"));
      const featureButton = screen.getByRole("button", { name: "Feature" });
      expect(featureButton).toBeInTheDocument();
      fireEvent.click(featureButton);
      expect(screen.getByText("Feature")).toBeInTheDocument();
      const labelsContainer = document.querySelector(
        ".selected-labels-display",
      );
      fireEvent.click(labelsContainer);
      const featureButtonAttached = screen.getByRole("button", {
        name: "Feature x",
      });
      fireEvent.click(featureButtonAttached);
      expect(screen.getByText("Select Labels")).toBeInTheDocument();
    });

    test("allows selecting both 'Urgent' and 'Feature' labels together", () => {
      render(<LabelsWrapper />);
      fireEvent.click(screen.getByText("Select Labels"));
      fireEvent.click(screen.getByRole("button", { name: "Urgent" }));
      const labelsContainer = document.querySelector(
        ".selected-labels-display",
      );
      fireEvent.click(labelsContainer);
      fireEvent.click(screen.getByRole("button", { name: "Feature" }));
      expect(screen.getByText("Urgent")).toBeInTheDocument();
      expect(screen.getByText("Feature")).toBeInTheDocument();
    });
  });

  test("renders TaskLabels without colorblind styling when labelColorblindMode is false", () => {
    const renderModal = (userSettingsOverride, newTaskLabels) =>
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          availableLabels={[
            { title: "Urgent", color: "red" },
            { title: "Feature", color: "blue" },
          ]}
          newTaskLabels={newTaskLabels || [{ title: "Urgent", color: "red" }]}
          userSettings={userSettingsOverride}
        />,
      );

    renderModal({ labelColorblindMode: false, hideLabelText: false });
    const urgentLabel = screen.getByText("Urgent");
    expect(urgentLabel).toBeInTheDocument();
    expect(urgentLabel.className).not.toMatch("colorblind-label");
    expect(urgentLabel.style.getPropertyValue("--pattern-image")).toBe("");
  });

  test("renders TaskLabels with colorblind styling when labelColorblindMode is true", () => {
    const renderModal = (userSettingsOverride, newTaskLabels) =>
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          availableLabels={[
            { title: "Urgent", color: "red" },
            { title: "Feature", color: "blue" },
          ]}
          newTaskLabels={newTaskLabels || [{ title: "Urgent", color: "red" }]}
          userSettings={userSettingsOverride}
        />,
      );
    renderModal({ labelColorblindMode: true, hideLabelText: false });
    const urgentLabel = screen.getByText("Urgent");
    expect(urgentLabel).toBeInTheDocument();
    expect(urgentLabel.className).toContain("colorblind-label");
    const expectedPattern = generatePattern(getLabelVariant("Urgent"));
    expect(urgentLabel.style.getPropertyValue("--pattern-image")).toBe(
      expectedPattern,
    );
  });

  test("renders TaskLabels correctly when hideLabelText is true in userSettings and colorblind mode is true", () => {
    const renderModal = (userSettingsOverride, newTaskLabels) =>
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { ...baseColumn, items: [] } }}
          availableLabels={[
            { title: "Urgent", color: "red" },
            { title: "Feature", color: "blue" },
          ]}
          newTaskLabels={newTaskLabels || [{ title: "Urgent", color: "red" }]}
          userSettings={userSettingsOverride}
        />,
      );
    renderModal({ labelColorblindMode: true, hideLabelText: true });
    // Although userSettings.hideLabelText is true, CreateTaskModal always passes false to TaskLabels.
    const urgentLabel = screen.getByText("Urgent");
    expect(urgentLabel).toBeInTheDocument();
    expect(urgentLabel.className).toContain("colorblind-label");
    const expectedPattern = generatePattern(getLabelVariant("Urgent"));
    expect(urgentLabel.style.getPropertyValue("--pattern-image")).toBe(
      expectedPattern,
    );
  });
});

// =======================
// CreateTaskModal Toast Messages Tests
// =======================
describe("CreateTaskModal Toast Messages", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("displays success toast message when task is created", async () => {
    const mockHandleCreateTask = jest.fn().mockResolvedValue();
    render(
      <CreateTaskModal
        {...defaultProps}
        columns={{ backlog: { ...baseColumn, items: [] } }}
        newTaskTitle="Test Task"
        handleCreateTask={mockHandleCreateTask}
      />,
    );
    const createButton = screen.getByText("Create");
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(mockHandleCreateTask).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Task created!");
    });
  });

  test("displays error toast message when task creation fails", async () => {
    const errorMsg = "Failed to create task";
    const mockHandleCreateTask = jest
      .fn()
      .mockRejectedValue(new Error(errorMsg));
    render(
      <CreateTaskModal
        {...defaultProps}
        columns={{ backlog: { ...baseColumn, items: [] } }}
        newTaskTitle="Test Task"
        handleCreateTask={mockHandleCreateTask}
      />,
    );
    const createButton = screen.getByText("Create");
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(mockHandleCreateTask).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "An error occurred while creating the task.",
      );
    });
  });
});
