import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import FilterBar from "../../../src/components/boardComponents/FilterBar";

const renderFilterBar = (
  initialFilters = {},
  setFilters = jest.fn(),
  extraProps = {}
) => {
  const defaultFilters = {
    taskName: "",
    priority: [],
    labels: [],
    assignedTo: "",
    storyPoints: "",
    timerRunning: null,
    today: null,
    dueStatus: null,
    startDate: null,
    endDate: null,
  };
  return render(
    <FilterBar
      filters={{ ...defaultFilters, ...initialFilters }}
      setFilters={setFilters}
      {...extraProps}
    />
  );
};

// =======================
// UNIT TESTS
// =======================
describe("FilterBar - Unit Tests", () => {
  test("renders toggle button and does not show filters when closed", () => {
    renderFilterBar();
    const toggleBtn = screen.getByTestId("filter-toggle-btn");
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Task")).toBeNull();
  });

  test("clear input buttons have proper aria-labels", () => {
    renderFilterBar({ taskName: "Test" });
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const clearTaskBtn = screen.getByTestId("clear-task-btn");
    expect(clearTaskBtn).toHaveAttribute("aria-label", "Clear Task Name");
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("FilterBar - Integration Tests", () => {
  test("opens filter bar when toggle button is clicked", () => {
    renderFilterBar();
    const toggleBtn = screen.getByTestId("filter-toggle-btn");
    fireEvent.click(toggleBtn);
    expect(screen.getByPlaceholderText("Task")).toBeInTheDocument();
  });

  test("updates taskName filter input", () => {
    const setFilters = jest.fn();
    renderFilterBar({}, setFilters);
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const taskInput = screen.getByPlaceholderText("Task");
    fireEvent.change(taskInput, { target: { value: "Test Task" } });
    expect(setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ taskName: "Test Task" })
    );
  });

  test("clears taskName when clear button is clicked", () => {
    let filters = { taskName: "Something" };
    const setFilters = jest.fn((updater) => {
      if (typeof updater === "function") {
        filters = updater(filters);
      } else {
        filters = updater;
      }
    });
    renderFilterBar(filters, setFilters);
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const clearBtn = screen.getByTestId("clear-task-btn");
    fireEvent.click(clearBtn);
    const lastCall = setFilters.mock.calls[setFilters.mock.calls.length - 1][0];
    const newFilters =
      typeof lastCall === "function" ? lastCall(filters) : lastCall;
    expect(newFilters).toEqual(expect.objectContaining({ taskName: "" }));
  });

  test("renders MultiSelectDropdown for Priority with fallback text 'Priority'", () => {
    renderFilterBar();
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const dropdownHeaders = screen.getAllByTestId("dropdown-header");
    expect(dropdownHeaders[0].textContent).toBe("Priority");
  });

  test("updates Priority multi-select filter when an option is toggled", async () => {
    let filters = { priority: [] };
    const setFilters = jest.fn((updater) => {
      if (typeof updater === "function") {
        filters = updater(filters);
      } else {
        filters = updater;
      }
    });
    renderFilterBar(filters, setFilters);
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const dropdownHeaders = screen.getAllByTestId("dropdown-header");
    const priorityHeader = dropdownHeaders[0];
    fireEvent.click(priorityHeader);
    const a1Checkbox = screen.getByLabelText("A1");
    fireEvent.click(a1Checkbox);
    await waitFor(() => {
      const lastCall =
        setFilters.mock.calls[setFilters.mock.calls.length - 1][0];
      const newFilters =
        typeof lastCall === "function" ? lastCall({ priority: [] }) : lastCall;
      expect(newFilters).toEqual(expect.objectContaining({ priority: ["A1"] }));
    });
  });

  test("clears Priority multi-select filter with Clear All button", async () => {
    let filters = { priority: ["A1", "A2"] };
    const setFilters = jest.fn((updater) => {
      if (typeof updater === "function") {
        filters = updater(filters);
      } else {
        filters = updater;
      }
    });
    renderFilterBar(filters, setFilters);
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const dropdownHeaders = screen.getAllByTestId("dropdown-header");
    const priorityHeader = dropdownHeaders[0];
    fireEvent.click(priorityHeader);
    const clearAllBtn = screen.getByText("Clear All");
    fireEvent.click(clearAllBtn);
    await waitFor(() => {
      const lastCall =
        setFilters.mock.calls[setFilters.mock.calls.length - 1][0];
      const newFilters =
        typeof lastCall === "function"
          ? lastCall({ priority: ["A1", "A2"] })
          : lastCall;
      expect(newFilters).toEqual(expect.objectContaining({ priority: [] }));
    });
  });

  test("multiple dropdowns operate independently", () => {
    renderFilterBar();
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const timerDropdownHeader = screen.getByText("Timer");
    fireEvent.click(timerDropdownHeader);
    expect(screen.getByText("All")).toBeInTheDocument();
    const calendarDropdownHeader = screen.getByText("Calendar");
    fireEvent.click(calendarDropdownHeader);
    const allButtons = screen.getAllByText("All");
    expect(allButtons.length).toBeGreaterThanOrEqual(2);
  });

  test("renders MultiSelectDropdown for Labels with fallback text 'Labels'", () => {
    renderFilterBar({}, jest.fn(), {
      availableLabels: [
        { title: "Bug", color: "#ff0000" },
        { title: "Feature", color: "#00ff00" },
      ],
    });
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const dropdownHeaders = screen.getAllByTestId("dropdown-header");
    expect(dropdownHeaders[1].textContent).toBe("Labels");
  });
  
  test("updates Labels multi-select filter when an option is toggled", async () => {
    let filters = { labels: [] };
    const setFilters = jest.fn((updater) => {
      filters = typeof updater === "function" ? updater(filters) : updater;
    });
  
    renderFilterBar(filters, setFilters, {
      availableLabels: [
        { title: "Bug", color: "#ff0000" },
        { title: "Feature", color: "#00ff00" },
      ],
    });
  
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const dropdownHeaders = screen.getAllByTestId("dropdown-header");
    const labelsHeader = dropdownHeaders[1];
    fireEvent.click(labelsHeader);
  
    const bugCheckbox = screen.getByLabelText(/Bug/i);
    fireEvent.click(bugCheckbox);
  
    await waitFor(() => {
      const lastCall = setFilters.mock.calls.at(-1)[0];
      const newFilters = typeof lastCall === "function" ? lastCall(filters) : lastCall;
      expect(newFilters).toEqual(expect.objectContaining({ labels: ["Bug"] }));
    });
  });
  
  test("clears Labels multi-select filter with Clear All button", async () => {
    let filters = { labels: ["Bug", "Feature"] };
    const setFilters = jest.fn((updater) => {
      filters = typeof updater === "function" ? updater(filters) : updater;
    });
  
    renderFilterBar(filters, setFilters, {
      availableLabels: [
        { title: "Bug", color: "#ff0000" },
        { title: "Feature", color: "#00ff00" },
      ],
    });
  
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const dropdownHeaders = screen.getAllByTestId("dropdown-header");
    const labelsHeader = dropdownHeaders[1];
    fireEvent.click(labelsHeader);
  
    const clearAllBtn = screen.getByText("Clear All");
    fireEvent.click(clearAllBtn);
  
    await waitFor(() => {
      const lastCall = setFilters.mock.calls.at(-1)[0];
      const newFilters = typeof lastCall === "function" ? lastCall(filters) : lastCall;
      expect(newFilters).toEqual(expect.objectContaining({ labels: [] }));
    });
  });

  test("clears all filters when Clear all button is clicked", async () => {
    let filters = {
      taskName: "Test",
      priority: ["A1"],
      labels: ["Some Random", "Frontend", "Backend"],
      assignedTo: "John",
      storyPoints: "5",
      timerRunning: true,
      today: true,
      dueStatus: "due",
      startDate: "2023-01-01",
      endDate: "2023-01-31",
    };
    const setFilters = jest.fn((updater) => {
      if (typeof updater === "function") {
        filters = updater(filters);
      } else {
        filters = updater;
      }
    });
    renderFilterBar(filters, setFilters);
    fireEvent.click(screen.getByTestId("filter-toggle-btn"));
    const clearAllBtn = screen.getByText("Clear");
    fireEvent.click(clearAllBtn);
    await waitFor(() => {
      const lastCall =
        setFilters.mock.calls[setFilters.mock.calls.length - 1][0];
      const newFilters =
        typeof lastCall === "function" ? lastCall(filters) : lastCall;
      expect(newFilters).toEqual({
        taskName: "",
        priority: [],
        labels: [],
        assignedTo: "",
        storyPoints: "",
        timerRunning: null,
        today: null,
        dueStatus: null,
        startDate: null,
        endDate: null,
      });
    });
  });
});
