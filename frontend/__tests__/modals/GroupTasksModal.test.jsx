import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GroupTasksModal from "../../src/components/modals/GroupTasksModal";
const { createBaseTask } = require("../../_testUtils/createBaseTask");

const mainTask1 = createBaseTask({
  _id: "1",
  title: "Main Task 1",
  groupKey: "Monday",
});
const mainTask2 = createBaseTask({
  _id: "2",
  title: "Main Task 2",
  groupKey: "Monday",
});
const compTask1 = createBaseTask({
  _id: "3",
  title: "Comp Task 1",
  groupKey: "Friday",
});

const defaultProps = {
  modalOpen: true,
  setModalOpen: jest.fn(),
  mainGroupTasks: [],
  compGroupTasks: [],
  openReadOnlyViewTaskModal: jest.fn(),
  comparisonMode: false,
  selectedGroup: "DefaultGroup",
};

// =======================
// UNIT TESTS
// =======================
describe("GroupTasksModal - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- General Rendering Tests ---
  test("does not render when modalOpen is false", () => {
    const { container } = render(
      <GroupTasksModal {...defaultProps} modalOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders modal and displays mainGroupTasks groupKey if available", () => {
    render(
      <GroupTasksModal
        {...defaultProps}
        mainGroupTasks={[mainTask1, mainTask2]}
      />
    );
    const header = screen.getByRole("heading", { level: 2 });
    expect(header.textContent).toBe("Tasks for Group: Monday");
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });

  test("renders modal and displays compGroupTasks groupKey if mainGroupTasks is empty", () => {
    render(<GroupTasksModal {...defaultProps} compGroupTasks={[compTask1]} />);
    const header = screen.getByRole("heading", { level: 2 });
    expect(header.textContent).toBe("Tasks for Group: Friday");
    expect(screen.getByText("Friday")).toBeInTheDocument();
  });

  test("renders modal and displays selectedGroup if both main and comp tasks are empty", () => {
    render(<GroupTasksModal {...defaultProps} selectedGroup="FallbackGroup" />);
    const header = screen.getByRole("heading", { level: 2 });
    expect(header.textContent).toBe("Tasks for Group: FallbackGroup");
    expect(screen.getByText("FallbackGroup")).toBeInTheDocument();
  });

  // --- Overlay and Close Button Tests ---
  test("calls setModalOpen(false) when clicking on the overlay", () => {
    render(<GroupTasksModal {...defaultProps} />);
    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);
    expect(defaultProps.setModalOpen).toHaveBeenCalledWith(false);
  });

  test("calls setModalOpen(false) when clicking the close (×) button", () => {
    render(<GroupTasksModal {...defaultProps} />);
    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);
    expect(defaultProps.setModalOpen).toHaveBeenCalledWith(false);
  });

  test("calls setModalOpen(false) when clicking the Close button at the bottom", () => {
    render(<GroupTasksModal {...defaultProps} />);
    const closeTextButton = screen.getByText("Close");
    fireEvent.click(closeTextButton);
    expect(defaultProps.setModalOpen).toHaveBeenCalledWith(false);
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("GroupTasksModal - Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Task Rendering and Interaction Tests ---
  test("renders main tasks when provided", () => {
    render(
      <GroupTasksModal
        {...defaultProps}
        mainGroupTasks={[mainTask1, mainTask2]}
      />
    );
    expect(screen.getByText("Main Range")).toBeInTheDocument();
    expect(screen.getByText("Main Task 1")).toBeInTheDocument();
    expect(screen.getByText("Main Task 2")).toBeInTheDocument();
  });

  test("renders fallback message when no main tasks are provided", () => {
    render(<GroupTasksModal {...defaultProps} mainGroupTasks={[]} />);
    expect(
      screen.getByText("No tasks for this group in Main Range.")
    ).toBeInTheDocument();
  });

  test("renders comparison tasks when comparisonMode is true and tasks exist", () => {
    render(
      <GroupTasksModal
        {...defaultProps}
        mainGroupTasks={[mainTask1]}
        compGroupTasks={[compTask1]}
        comparisonMode={true}
      />
    );
    expect(screen.getByText("Comparison Range")).toBeInTheDocument();
    expect(screen.getByText("Comp Task 1")).toBeInTheDocument();
  });

  test("renders fallback message in comparison section when no comp tasks are provided", () => {
    render(
      <GroupTasksModal
        {...defaultProps}
        mainGroupTasks={[mainTask1]}
        compGroupTasks={[]}
        comparisonMode={true}
      />
    );
    expect(
      screen.getByText("No tasks for this group in Comparison Range.")
    ).toBeInTheDocument();
  });

  test("does not render Comparison Range section when comparisonMode is false", () => {
    render(
      <GroupTasksModal
        {...defaultProps}
        comparisonMode={false}
        compGroupTasks={[compTask1]}
      />
    );
    expect(screen.queryByText("Comparison Range")).toBeNull();
  });

  test("calls openReadOnlyViewTaskModal when a main task is clicked", () => {
    render(<GroupTasksModal {...defaultProps} mainGroupTasks={[mainTask1]} />);
    const taskWrapper = screen.getByText("Main Task 1").parentElement;
    fireEvent.click(taskWrapper);
    expect(defaultProps.openReadOnlyViewTaskModal).toHaveBeenCalledWith(
      mainTask1
    );
  });

  test("calls openReadOnlyViewTaskModal when a comparison task is clicked", () => {
    render(
      <GroupTasksModal
        {...defaultProps}
        mainGroupTasks={[]}
        compGroupTasks={[compTask1]}
        comparisonMode={true}
      />
    );
    const taskWrapper = screen.getByText("Comp Task 1").parentElement;
    fireEvent.click(taskWrapper);
    expect(defaultProps.openReadOnlyViewTaskModal).toHaveBeenCalledWith(
      compTask1
    );
  });
});
