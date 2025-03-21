import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateTaskModal from "../../src/components/Modals/CreateTaskModal";

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

const defaultProps = {
  isModalOpen: true,
  closeModal: jest.fn(),
  columns: { backlog: { name: "Backlog", items: [] } },
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
};

// =======================
// UNIT TESTS
// =======================
describe("CreateTaskModal Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // General Rendering Tests
  test("does not render when isModalOpen is false", () => {
    const { container } = render(
      <CreateTaskModal {...defaultProps} isModalOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders loading when columnsLoaded is false", () => {
    render(<CreateTaskModal {...defaultProps} columnsLoaded={false} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
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
          "You need to create a board before you can create tasks."
        )
      ).toBeInTheDocument();
      const boardNameInput = screen.getByPlaceholderText("Enter board name");
      expect(boardNameInput).toBeInTheDocument();
    });

    test("calls handleCreateBoard when tick button is clicked", () => {
      render(<CreateTaskModal {...defaultProps} columns={{}} />);
      const tickButton = screen.getByText("✔️");
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
        />
      );
      expect(screen.getByPlaceholderText("Enter board name").value).toBe(
        "Some Board"
      );
      // Closing the modal
      rerender(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={false}
          newBoardCreateName="Some Board"
          columns={{}}
        />
      );
      // Reopen the modal
      rerender(
        <CreateTaskModal
          {...defaultProps}
          isModalOpen={true}
          newBoardCreateName=""
          columns={{}}
        />
      );
      expect(screen.getByPlaceholderText("Enter board name").value).toBe("");
    });
  });

  // Task Creation UI (boards exist)
  describe("Task Creation UI (boards exist)", () => {
    test("renders task creation UI elements", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { name: "Backlog", items: [] } }}
        />
      );
      expect(screen.getByText("Create New Task")).toBeInTheDocument();
      expect(screen.getByText("Task Title:")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter Task Title")
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
          screen.getByRole("option", { name: priority })
        ).toBeInTheDocument();
      });
      expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    test("calls handleCreateTask when Create button is clicked and title is provided", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { name: "Backlog", items: [] } }}
          newTaskTitle="Test Task"
        />
      );
      const createButton = screen.getByText("Create");
      fireEvent.click(createButton);
      expect(defaultProps.handleCreateTask).toHaveBeenCalled();
    });

    test("displays error message when Create button is clicked with an empty title", async () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { name: "Backlog", items: [] } }}
          newTaskTitle=""
        />
      );
      const createButton = screen.getByText("Create");
      fireEvent.click(createButton);
      await waitFor(() => {
        expect(screen.getByText("Task Title is required.")).toBeInTheDocument();
      });
    });

    test("calls closeModal when Cancel button is clicked", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { name: "Backlog", items: [] } }}
        />
      );
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      expect(defaultProps.closeModal).toHaveBeenCalled();
    });

    test("calls closeModal when the '×' button is clicked", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { name: "Backlog", items: [] } }}
        />
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
          columns={{ backlog: { name: "Backlog", items: [] } }}
          newTaskTitle="Unsaved Task"
        />
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
          columns={{ backlog: { name: "Backlog", items: [] } }}
          newTaskTitle="Unsaved Task"
        />
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
          columns={{ backlog: { name: "Backlog", items: [] } }}
          setDueDateWarning={mockSetDueDateWarning}
        />
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
          columns={{ backlog: { name: "Backlog", items: [] } }}
          setDueDateWarning={mockSetDueDateWarning}
        />
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
          columns={{ backlog: { name: "Backlog", items: [] } }}
        />
      );
      const updateButton = screen.getByText("Update Editor");
      fireEvent.click(updateButton);
      expect(defaultProps.setTaskDescription).toHaveBeenCalledWith(
        "Updated description"
      );
    });

    test("calls setters when input fields change", () => {
      render(
        <CreateTaskModal
          {...defaultProps}
          columns={{ backlog: { name: "Backlog", items: [] } }}
        />
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
            backlog: { name: "Backlog", items: [] },
            inprogress: { name: "In Progress", items: [] },
          }}
          selectedStatus=""
        />
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
        />
      );
      fireEvent.click(screen.getByText("Create"));
      await waitFor(() => {
        const errorElem = screen.getByRole("alert");
        expect(errorElem.textContent).toBe("Task Title is required.");
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
        />
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
        />
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
          screen.getByText("Warning: The selected due date is in the past.")
        ).toBeInTheDocument();
      });
    });
  });
});
