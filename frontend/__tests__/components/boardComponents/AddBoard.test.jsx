import { useState } from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import AddBoard from "../../../src/components/boardComponents/AddBoard";
import { validateColumnName } from "../../../src/utils/boardValidation";
import { createBaseColumn } from "../../../_testUtils/createBaseColumn";

// =======================
// UNIT TESTS
// =======================
describe("AddBoard component - Unit Tests", () => {
  const setup = (overrides = {}) => {
    const props = {
      isAddingBoard: false,
      newBoardCreateName: "",
      setNewBoardCreateName: jest.fn(),
      setIsAddingBoard: jest.fn(),
      handleCreateBoard: jest.fn(),
      createBoardError: "",
      setCreateBoardError: jest.fn(),
      ...overrides,
    };

    render(<AddBoard {...props} />);
    return props;
  };

  test("renders add button when not adding", () => {
    setup();
    expect(screen.getByRole("button")).toHaveTextContent("+");
  });

  test("shows input and buttons when isAddingBoard is true", () => {
    setup({ isAddingBoard: true });
    expect(screen.getByPlaceholderText("Enter board name")).toBeInTheDocument();
    expect(screen.getByTestId("tick-icon")).toBeInTheDocument();
    expect(screen.getByTestId("cross-icon")).toBeInTheDocument();
  });

  test("calls setIsAddingBoard, setNewBoardCreateName, setCreateBoardError when '+' is clicked", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button"));
    expect(props.setIsAddingBoard).toHaveBeenCalledWith(true);
    expect(props.setNewBoardCreateName).toHaveBeenCalledWith("");
    expect(props.setCreateBoardError).toHaveBeenCalledWith("");
  });

  test("updates input and clears error when typing", () => {
    const props = setup({ isAddingBoard: true });
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "New Board" } });
    expect(props.setNewBoardCreateName).toHaveBeenCalledWith("New Board");
    expect(props.setCreateBoardError).toHaveBeenCalledWith("");
  });

  test("shows duplicate error message when createBoardError is set to duplicate error", () => {
    setup({
      isAddingBoard: true,
      createBoardError: "Column name already exists.",
    });
    expect(screen.getByText("Column name already exists.")).toBeInTheDocument();
  });

  test("shows reserved error message when createBoardError is set to reserved error", () => {
    setup({
      isAddingBoard: true,
      createBoardError: "Column name cannot be empty.",
    });
    expect(
      screen.getByText("Column name cannot be empty."),
    ).toBeInTheDocument();
  });

  test("calls handleCreateBoard when tick icon is clicked", () => {
    const props = setup({ isAddingBoard: true });
    fireEvent.click(screen.getByTestId("tick-icon"));
    expect(props.handleCreateBoard).toHaveBeenCalled();
  });

  test("calls cancel logic when cross icon is clicked", () => {
    const props = setup({ isAddingBoard: true });
    fireEvent.click(screen.getByTestId("cross-icon"));
    expect(props.setIsAddingBoard).toHaveBeenCalledWith(false);
    expect(props.setNewBoardCreateName).toHaveBeenCalledWith("");
    expect(props.setCreateBoardError).toHaveBeenCalledWith("");
  });

  test("calls handleCreateBoard when Enter key is pressed in the input field", () => {
    const props = setup({ isAddingBoard: true });
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });
    expect(props.handleCreateBoard).toHaveBeenCalled();
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("AddBoard component - Integration Tests with Validation", () => {
  function TestAddBoardWrapper({ columns }) {
    const [isAddingBoard, setIsAddingBoard] = useState(true);
    const [newBoardCreateName, setNewBoardCreateName] = useState("");
    const [createBoardError, setCreateBoardError] = useState("");

    const handleCreateBoard = () => {
      const error = validateColumnName(newBoardCreateName, columns);
      setCreateBoardError(error);
    };

    return (
      <AddBoard
        isAddingBoard={isAddingBoard}
        newBoardCreateName={newBoardCreateName}
        setNewBoardCreateName={setNewBoardCreateName}
        setIsAddingBoard={setIsAddingBoard}
        handleCreateBoard={handleCreateBoard}
        createBoardError={createBoardError}
        setCreateBoardError={setCreateBoardError}
      />
    );
  }

  const columns = {
    board1: createBaseColumn({ columnId: "board1", name: "Project Alpha" }),
    board2: createBaseColumn({ columnId: "board2", name: "Project Beta" }),
  };

  beforeEach(() => {
    render(<TestAddBoardWrapper columns={columns} />);
  });

  test("shows duplicate error message when board name is already taken", () => {
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "project alpha" } });
    fireEvent.click(screen.getByTestId("tick-icon"));
    expect(screen.getByText("Column name already exists.")).toBeInTheDocument();
  });

  test("shows reserved error message when board name 'Completed' is used", () => {
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "Completed" } });
    fireEvent.click(screen.getByTestId("tick-icon"));
    expect(
      screen.getByText("Column name 'Completed' is reserved."),
    ).toBeInTheDocument();
  });

  test("shows empty message when board name '' is used", () => {
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByTestId("tick-icon"));
    expect(
      screen.getByText("Column name cannot be empty."),
    ).toBeInTheDocument();
  });

  test("does not show error when a valid board name is entered", () => {
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "New Board" } });
    fireEvent.click(screen.getByTestId("tick-icon"));
    expect(screen.queryByText("Column name cannot be empty.")).toBeNull();
    expect(screen.queryByText("Column name cannot be empty.")).toBeNull();
    expect(screen.queryByText("Column name already exists.")).toBeNull();
    expect(screen.queryByText("Column name cannot be empty.")).toBeNull();
  });
});
