import React, { useState } from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import AddBoard from "../src/pages/Dashboard/AddBoard";
import { validateBoardName } from "../src/utils/boardValidation";

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
    expect(screen.getByText("✔️")).toBeInTheDocument();
    expect(screen.getByText("❌")).toBeInTheDocument();
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
      createBoardError: "Board name already taken.",
    });
    expect(screen.getByText("Board name already taken.")).toBeInTheDocument();
  });

  test("shows reserved error message when createBoardError is set to reserved error", () => {
    setup({
      isAddingBoard: true,
      createBoardError: "Board name 'Completed' is reserved.",
    });
    expect(
      screen.getByText("Board name 'Completed' is reserved.")
    ).toBeInTheDocument();
  });

  test("calls handleCreateBoard when ✔️ is clicked", () => {
    const props = setup({ isAddingBoard: true });
    fireEvent.click(screen.getByText("✔️"));
    expect(props.handleCreateBoard).toHaveBeenCalled();
  });

  test("calls cancel logic when ❌ is clicked", () => {
    const props = setup({ isAddingBoard: true });
    fireEvent.click(screen.getByText("❌"));
    expect(props.setIsAddingBoard).toHaveBeenCalledWith(false);
    expect(props.setNewBoardCreateName).toHaveBeenCalledWith("");
    expect(props.setCreateBoardError).toHaveBeenCalledWith("");
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
      const error = validateBoardName(newBoardCreateName, columns);
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
    board1: { name: "Project Alpha" },
    board2: { name: "Project Beta" },
  };

  beforeEach(() => {
    render(<TestAddBoardWrapper columns={columns} />);
  });

  test("shows duplicate error message when board name is already taken", () => {
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "project alpha" } });
    fireEvent.click(screen.getByText("✔️"));
    expect(screen.getByText("Board name already taken.")).toBeInTheDocument();
  });

  test("shows reserved error message when board name 'Completed' is used", () => {
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "Completed" } });
    fireEvent.click(screen.getByText("✔️"));
    expect(
      screen.getByText("Board name 'Completed' is reserved.")
    ).toBeInTheDocument();
  });

  test("does not show error when a valid board name is entered", () => {
    const input = screen.getByPlaceholderText("Enter board name");
    fireEvent.change(input, { target: { value: "New Board" } });
    fireEvent.click(screen.getByText("✔️"));
    expect(screen.queryByText("Board name cannot be empty.")).toBeNull();
    expect(
      screen.queryByText("Board name 'Completed' is reserved.")
    ).toBeNull();
    expect(screen.queryByText("Board name already taken.")).toBeNull();
  });
});
