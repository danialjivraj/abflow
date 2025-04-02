import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Column from "../../../src/components/boardComponents/Column";
import { createBaseColumn } from "../../../_testUtils/createBaseColumn";
import { createBaseTask } from "../../../_testUtils/createBaseTask";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@hello-pangea/dnd", () => ({
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

const originalAuth = require("../../../src/firebase").auth;
jest.mock("../../../src/firebase", () => {
  const { createBaseUser } = require("../../../_testUtils/createBaseUser");
  return {
    auth: {
      currentUser: { uid: createBaseUser().userId },
    },
  };
});

jest.mock("../../../src/services/columnsService", () => ({
  renameBoard: jest.fn(() => Promise.resolve()),
  deleteBoard: jest.fn(() => Promise.resolve()),
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
  },
);

jest.mock("../../../src/components/boardComponents/TaskCard", () => (props) => (
  <div data-testid="task-card">{props.task.title}</div>
));

const baseColumn = createBaseColumn();
const defaultProps = {
  columnId: baseColumn.columnId,
  columnData: {
    ...baseColumn,
    items: [createBaseTask({ _id: "task-1", title: "Task 1" })],
  },
  index: 0,
  renamingColumnId: null,
  newBoardName: "",
  setNewBoardName: jest.fn(),
  setRenamingColumnId: jest.fn(),
  isDropdownOpen: null,
  setIsDropdownOpen: jest.fn(),
  isTaskDropdownOpen: null,
  setIsTaskDropdownOpen: jest.fn(),
  formatDueDate: jest.fn(() => ({ text: "Due Soon", isOverdue: false })),
  currentTime: new Date(),
  isTaskHovered: null,
  setIsTaskHovered: jest.fn(),
  deleteTask: jest.fn(),
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  openViewTaskModal: jest.fn(),
  handleCompleteTask: jest.fn(),
  renameBoardError: "",
  setRenameBoardError: jest.fn(),
  onBoardRename: jest.fn(),
  onBoardDelete: jest.fn(),
  columns: {
    [baseColumn.columnId]: { name: baseColumn.name, items: [] },
  },
};

// =======================
// UNIT TESTS
// =======================
describe("Column Component - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders column header when not renaming", () => {
    render(<Column {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      baseColumn.name,
    );
  });

  test("renders rename input when renamingColumnId equals columnId", () => {
    render(
      <Column
        {...defaultProps}
        renamingColumnId={baseColumn.columnId}
        newBoardName="New Board Name"
        renameBoardError="Name already taken"
      />,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("New Board Name");
    expect(screen.getByText("Name already taken")).toBeInTheDocument();
    expect(screen.getByTestId("tick-icon")).toBeInTheDocument();
    expect(screen.getByTestId("cross-icon")).toBeInTheDocument();
  });

  test("clicking cross button in rename mode cancels renaming", () => {
    render(
      <Column
        {...defaultProps}
        renamingColumnId={baseColumn.columnId}
        newBoardName="Something"
        renameBoardError="Some error"
      />,
    );
    const crossButton = screen.getByTestId("cross-icon");
    fireEvent.click(crossButton);
    expect(defaultProps.setRenamingColumnId).toHaveBeenCalledWith(null);
    expect(defaultProps.setNewBoardName).toHaveBeenCalledWith("");
    expect(defaultProps.setRenameBoardError).toHaveBeenCalledWith("");
  });

  test("does not call rename if newBoardName is empty (or whitespace only)", async () => {
    function TestWrapper() {
      const [newBoardName, setNewBoardName] = React.useState("   ");
      const [renameBoardError, setRenameBoardError] = React.useState("");
      return (
        <Column
          {...defaultProps}
          renamingColumnId={baseColumn.columnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          renameBoardError={renameBoardError}
          setRenameBoardError={setRenameBoardError}
        />
      );
    }
    render(<TestWrapper />);
    const tickButton = screen.getByTestId("tick-icon");
    fireEvent.click(tickButton);
    await waitFor(() => {
      expect(defaultProps.onBoardRename).not.toHaveBeenCalled();
    });
  });

  test("toggles dropdown menu on dots button click", () => {
    render(<Column {...defaultProps} isDropdownOpen={null} />);
    const dotsButton =
      screen.getByText("⋮") ||
      screen.getByText("‧‧‧") ||
      screen.getByRole("button", { name: /⋮|…/i });
    fireEvent.click(dotsButton);
    expect(defaultProps.setIsDropdownOpen).toHaveBeenCalledWith(
      baseColumn.columnId,
    );
  });

  test("closes dropdown when clicking outside", () => {
    render(<Column {...defaultProps} isDropdownOpen={baseColumn.columnId} />);
    fireEvent.mouseDown(document.body);
    expect(defaultProps.setIsDropdownOpen).toHaveBeenCalledWith(null);
  });

  test("renders task cards in the droppable area", () => {
    render(<Column {...defaultProps} />);
    expect(
      screen.getByTestId(`droppable-${baseColumn.columnId}`),
    ).toBeInTheDocument();
    expect(screen.getByTestId("task-card")).toHaveTextContent("Task 1");
  });
});

test("calls handleRename when Enter key is pressed in the rename input", async () => {
  const onBoardRenameMock = jest.fn();

  function TestWrapper() {
    const [newBoardName, setNewBoardName] = React.useState("Valid Board");
    const [renameBoardError, setRenameBoardError] = React.useState("");
    return (
      <Column
        {...defaultProps}
        renamingColumnId={baseColumn.columnId}
        newBoardName={newBoardName}
        setNewBoardName={setNewBoardName}
        renameBoardError={renameBoardError}
        setRenameBoardError={setRenameBoardError}
        onBoardRename={onBoardRenameMock}
      />
    );
  }
  render(<TestWrapper />);
  const input = screen.getByRole("textbox");
  fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });
  await waitFor(() => {
    expect(onBoardRenameMock).toHaveBeenCalledWith(
      baseColumn.columnId,
      "Valid Board",
    );
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("Column Component - Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
    require("../../../src/firebase").auth.currentUser =
      originalAuth.currentUser;
  });

  test("handles board renaming flow", async () => {
    function TestWrapper() {
      const [newBoardName, setNewBoardName] = React.useState("Old Name");
      const [renameBoardError, setRenameBoardError] = React.useState("");
      return (
        <Column
          {...defaultProps}
          renamingColumnId={baseColumn.columnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          renameBoardError={renameBoardError}
          setRenameBoardError={setRenameBoardError}
        />
      );
    }
    render(<TestWrapper />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Renamed Board" } });
    const tickButton = screen.getByTestId("tick-icon");
    fireEvent.click(tickButton);
    await waitFor(() => {
      expect(defaultProps.onBoardRename).toHaveBeenCalledWith(
        baseColumn.columnId,
        "Renamed Board",
      );
      expect(defaultProps.setIsDropdownOpen).toHaveBeenCalledWith(null);
    });
  });

  test("handles board deletion flow (confirmation enabled)", async () => {
    render(
      <Column
        {...defaultProps}
        isDropdownOpen={baseColumn.columnId}
        confirmBeforeDeleteBoard={true}
      />,
    );
    const dotsButton = screen.getByText("⋮") || screen.getByText("‧‧‧");
    fireEvent.click(dotsButton);
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    const confirmButton = screen.getByText("Confirm Delete");
    fireEvent.click(confirmButton);
    await waitFor(() => {
      const { deleteBoard } = require("../../../src/services/columnsService");
      expect(deleteBoard).toHaveBeenCalledWith("user1", baseColumn.columnId);
      expect(defaultProps.onBoardDelete).toHaveBeenCalledWith(
        baseColumn.columnId,
      );
      expect(defaultProps.setIsDropdownOpen).toHaveBeenCalledWith(null);
    });
  });

  test("does not open delete confirmation modal when confirmBeforeDeleteBoard is false", async () => {
    render(
      <Column
        {...defaultProps}
        isDropdownOpen={baseColumn.columnId}
        confirmBeforeDeleteBoard={false}
      />,
    );
    const dotsButton = screen.getByText("⋮") || screen.getByText("‧‧‧");
    fireEvent.click(dotsButton);
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(screen.queryByTestId("delete-modal")).toBeNull();
    const { deleteBoard } = require("../../../src/services/columnsService");
    await waitFor(() => {
      expect(deleteBoard).toHaveBeenCalledWith("user1", baseColumn.columnId);
      expect(defaultProps.onBoardDelete).toHaveBeenCalledWith(
        baseColumn.columnId,
      );
    });
    await waitFor(() => {
      const { toast } = require("react-toastify");
      expect(toast.success).toHaveBeenCalledWith("Board deleted!");
    });
  });

  test("displays error toast when board deletion fails", async () => {
    const { deleteBoard } = require("../../../src/services/columnsService");
    deleteBoard.mockImplementationOnce(() =>
      Promise.reject(new Error("Delete failed")),
    );

    render(
      <Column
        {...defaultProps}
        isDropdownOpen={baseColumn.columnId}
        confirmBeforeDeleteBoard={true}
      />,
    );

    const dotsButton = screen.getByText("⋮") || screen.getByText("‧‧‧");
    fireEvent.click(dotsButton);

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();

    const confirmButton = screen.getByText("Confirm Delete");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteBoard).toHaveBeenCalledWith("user1", baseColumn.columnId);
    });

    await waitFor(() => {
      const { toast } = require("react-toastify");
      expect(toast.error).toHaveBeenCalledWith("Failed to delete board!");
    });
  });

  test("throws error when renaming board to an empty name", async () => {
    const setRenameBoardErrorMock = jest.fn();

    function TestWrapper() {
      const [newBoardName, setNewBoardName] = React.useState("");
      return (
        <Column
          {...defaultProps}
          renamingColumnId={baseColumn.columnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          renameBoardError=""
          setRenameBoardError={setRenameBoardErrorMock}
        />
      );
    }

    render(<TestWrapper />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });

    const tickButton = screen.getByTestId("tick-icon");
    fireEvent.click(tickButton);

    await waitFor(() => {
      expect(setRenameBoardErrorMock).toHaveBeenCalledWith(
        "Board name cannot be empty.",
      );
    });
  });

  test("throws error when renaming board to an existing board name", async () => {
    const existingBoardName = "Existing Board";
    const columns = {
      [baseColumn.columnId]: { name: baseColumn.name, items: [] },
      anotherColumnId: { name: existingBoardName, items: [] },
    };

    const setRenameBoardErrorMock = jest.fn();

    function TestWrapper() {
      const [newBoardName, setNewBoardName] = React.useState(baseColumn.name);
      return (
        <Column
          {...defaultProps}
          renamingColumnId={baseColumn.columnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          renameBoardError=""
          setRenameBoardError={setRenameBoardErrorMock}
          columns={columns}
        />
      );
    }

    render(<TestWrapper />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: existingBoardName } });

    const tickButton = screen.getByTestId("tick-icon");
    fireEvent.click(tickButton);

    await waitFor(() => {
      expect(setRenameBoardErrorMock).toHaveBeenCalledWith(
        "Board name already taken.",
      );
    });
  });

  test("throws error when renaming board to reserved name 'Completed'", async () => {
    const setRenameBoardErrorMock = jest.fn();

    function TestWrapper() {
      const [newBoardName, setNewBoardName] = React.useState(baseColumn.name);
      return (
        <Column
          {...defaultProps}
          renamingColumnId={baseColumn.columnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          renameBoardError=""
          setRenameBoardError={setRenameBoardErrorMock}
        />
      );
    }

    render(<TestWrapper />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Completed" } });

    const tickButton = screen.getByTestId("tick-icon");
    fireEvent.click(tickButton);

    await waitFor(() => {
      expect(setRenameBoardErrorMock).toHaveBeenCalledWith(
        "Board name 'Completed' is reserved.",
      );
    });
  });

  test("triggers renaming mode when 'Rename' option is clicked in dropdown", () => {
    render(<Column {...defaultProps} isDropdownOpen={baseColumn.columnId} />);
    const dotsButton = screen.getByText("⋮") || screen.getByText("‧‧‧");
    fireEvent.click(dotsButton);
    const renameOption = screen.getByText("Rename");
    fireEvent.click(renameOption);
    expect(defaultProps.setRenamingColumnId).toHaveBeenCalledWith(
      baseColumn.columnId,
    );
    expect(defaultProps.setNewBoardName).toHaveBeenCalledWith(baseColumn.name);
    expect(defaultProps.setRenameBoardError).toHaveBeenCalledWith("");
    expect(defaultProps.setIsDropdownOpen).toHaveBeenCalledWith(null);
  });

  test("does nothing when no user is authenticated", async () => {
    require("../../../src/firebase").auth.currentUser = null;
    function TestWrapper() {
      const [newBoardName, setNewBoardName] = React.useState("Old Name");
      const [renameBoardError, setRenameBoardError] = React.useState("");
      return (
        <Column
          {...defaultProps}
          renamingColumnId={baseColumn.columnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          renameBoardError={renameBoardError}
          setRenameBoardError={setRenameBoardError}
        />
      );
    }
    render(<TestWrapper />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Renamed Board" } });
    const tickButton = screen.getByTestId("tick-icon");
    fireEvent.click(tickButton);
    await waitFor(() => {
      expect(defaultProps.onBoardRename).not.toHaveBeenCalled();
    });
  });

  test("renders multiple task cards when columnData contains several tasks", () => {
    const multiTaskProps = {
      ...defaultProps,
      columnData: {
        ...baseColumn,
        items: [
          createBaseTask({ _id: "task-1", title: "Task 1" }),
          createBaseTask({ _id: "task-2", title: "Task 2" }),
          createBaseTask({ _id: "task-3", title: "Task 3" }),
        ],
      },
    };
    render(<Column {...multiTaskProps} />);
    const taskCards = screen.getAllByTestId("task-card");
    expect(taskCards.length).toBe(3);
    expect(taskCards[0]).toHaveTextContent("Task 1");
    expect(taskCards[1]).toHaveTextContent("Task 2");
    expect(taskCards[2]).toHaveTextContent("Task 3");
  });

  test("renders droppable area even when there are no tasks", () => {
    const emptyTasksProps = {
      ...defaultProps,
      columnData: { ...baseColumn, items: [] },
    };
    render(<Column {...emptyTasksProps} />);
    expect(
      screen.getByTestId(`droppable-${baseColumn.columnId}`),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("task-card")).toBeNull();
  });

  test("click outside while in renaming mode does not exit renaming", () => {
    function TestWrapper() {
      const [newBoardName, setNewBoardName] = React.useState("New Name");
      const [renameBoardError, setRenameBoardError] = React.useState("");
      return (
        <Column
          {...defaultProps}
          renamingColumnId={baseColumn.columnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          renameBoardError={renameBoardError}
          setRenameBoardError={setRenameBoardError}
        />
      );
    }
    render(<TestWrapper />);
    fireEvent.mouseDown(document.body);
    expect(screen.getByRole("textbox")).toHaveValue("New Name");
  });

  test("clicking the thick-plus button in the column calls openCreateTaskModal with the column id", async () => {
    const openCreateTaskModalMock = jest.fn();
    const props = {
      ...defaultProps,
      openCreateTaskModal: openCreateTaskModalMock,
    };

    render(<Column {...props} />);

    const columnContainer = screen.getByTestId(`draggable-${props.columnId}`);
    fireEvent.mouseOver(columnContainer);

    const createTaskText = screen.getByText("Create Task");
    const addTaskButton = createTaskText.closest("button");
    expect(addTaskButton).toBeInTheDocument();

    fireEvent.click(addTaskButton);

    expect(openCreateTaskModalMock).toHaveBeenCalledWith(props.columnId);
  });
});
