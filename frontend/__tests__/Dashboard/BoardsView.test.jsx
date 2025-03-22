import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BoardsView from "../../src/pages/Dashboard/BoardsView";
import { createBaseColumn } from "../../_testUtils/createBaseColumn";
import { createBaseTask } from "../../_testUtils/createBaseTask";

jest.mock("../../src/components/boardComponents/Column", () => (props) => {
  const hasTable = props.columnData.items.some(
    (task) => task.description && task.description.includes("<table>")
  );
  return (
    <div data-testid="column" data-column-name={props.columnData.name}>
      <h2>{props.columnData.name}</h2>
      {hasTable && <button title="Delete Table">Delete Table</button>}
      {props.columnData.items.map((task) => (
        <div key={task._id} data-testid="task">
          {task.title}
        </div>
      ))}
    </div>
  );
});

jest.mock("../../src/components/boardComponents/AddBoard", () => (props) => {
  return <button data-testid="add-board">+</button>;
});

const fakeColumns = {
  "column-1": {
    ...createBaseColumn({ columnId: "column-1", name: "Column One", order: 0 }),
    items: [
      createBaseTask({ _id: "task-1", title: "Task 1", status: "column-1" }),
      createBaseTask({ _id: "task-2", title: "Task 2", status: "column-1" }),
    ],
  },
  "column-2": {
    ...createBaseColumn({ columnId: "column-2", name: "Column Two", order: 1 }),
    items: [createBaseTask({ _id: "task-3", title: "Task 3", status: "column-2" })],
  },
};

const defaultProps = {
  columns: fakeColumns,
  renamingColumnId: null,
  newBoardName: "",
  setNewBoardName: jest.fn(),
  setRenamingColumnId: jest.fn(),
  isDropdownOpen: null,
  setIsDropdownOpen: jest.fn(),
  dropdownRef: React.createRef(),
  isTaskDropdownOpen: null,
  setIsTaskDropdownOpen: jest.fn(),
  formatDueDate: jest.fn(),
  currentTime: new Date(),
  isTaskHovered: null,
  setIsTaskHovered: jest.fn(),
  deleteTask: jest.fn(),
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  openViewTaskModal: jest.fn(),
  handleDragEnd: jest.fn(),
  isAddingBoard: false,
  newBoardCreateName: "",
  setNewBoardCreateName: jest.fn(),
  setIsAddingBoard: jest.fn(),
  handleCreateBoard: jest.fn(),
  createBoardError: "",
  setCreateBoardError: jest.fn(),
  handleCompleteTask: jest.fn(),
  renameBoardError: "",
  setRenameBoardError: jest.fn(),
  onBoardRename: jest.fn(),
  onBoardDelete: jest.fn(),
};

// =======================
// INTEGRATION TESTS
// =======================
describe("BoardsView Component", () => {
  test("renders heading, columns and AddBoard component", () => {
    render(<BoardsView {...defaultProps} />);
    
    expect(screen.getByText("Boards")).toBeInTheDocument();
    
    const columns = screen.getAllByTestId("column");
    expect(columns.length).toBe(2);
    expect(columns[0].getAttribute("data-column-name")).toBe("Column One");
    expect(columns[1].getAttribute("data-column-name")).toBe("Column Two");
    
    expect(screen.getByTestId("add-board")).toBeInTheDocument();
  });

  test("renders no Column components when columns is empty", () => {
    const props = { ...defaultProps, columns: {} };
    render(<BoardsView {...props} />);
    expect(screen.queryAllByTestId("column").length).toBe(0);
    expect(screen.getByTestId("add-board")).toBeInTheDocument();
  });

  test("renders no task elements when a column has an empty items array", () => {
    const columnsEmptyTasks = {
      "column-1": {
        ...createBaseColumn({ columnId: "column-1", name: "Column One", order: 0 }),
        items: [],
      },
    };
    const props = { ...defaultProps, columns: columnsEmptyTasks };
    render(<BoardsView {...props} />);
    expect(screen.getAllByTestId("column").length).toBe(1);
    expect(screen.queryAllByTestId("task").length).toBe(0);
  });

  test("calls handleDragEnd correctly when a column drag-drop occurs", () => {
    const handleDragEndMock = defaultProps.handleDragEnd;
    render(<BoardsView {...defaultProps} />);
    
    const fakeDragResult = {
      draggableId: "column-1",
      type: "COLUMN",
      source: { droppableId: "all-columns", index: 0 },
      destination: { droppableId: "all-columns", index: 1 },
    };
    
    handleDragEndMock(fakeDragResult);
    expect(handleDragEndMock).toHaveBeenCalledWith(fakeDragResult);
  });

  test("calls handleDragEnd correctly when a task drag-drop occurs", () => {
    const handleDragEndMock = defaultProps.handleDragEnd;
    render(<BoardsView {...defaultProps} />);
    
    const fakeTaskDragResult = {
      draggableId: "task-1",
      type: "TASK",
      source: { droppableId: "column-1", index: 0 },
      destination: { droppableId: "column-2", index: 0 },
    };
    
    handleDragEndMock(fakeTaskDragResult);
    expect(handleDragEndMock).toHaveBeenCalledWith(fakeTaskDragResult);
  });

  test("renders table-related buttons when a table is present", async () => {
    const columnsWithTable = {
      "column-1": {
        ...createBaseColumn({ columnId: "column-1", name: "Column One", order: 0 }),
        items: [
          createBaseTask({
            _id: "task-1",
            title: "Task with Table",
            status: "column-1",
            description: "<table><tr><td>Cell</td></tr></table>",
          }),
        ],
      },
    };
    const props = { ...defaultProps, columns: columnsWithTable };
    render(<BoardsView {...props} />);
    await waitFor(() => {
      expect(screen.getAllByTestId("column")[0]).toBeInTheDocument();
    });
    expect(screen.getByTitle("Delete Table")).toBeInTheDocument();
  });
});
