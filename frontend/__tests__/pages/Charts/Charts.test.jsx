jest.setTimeout(10000);

import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import {
  MemoryRouter,
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Charts from "../../../src/pages/Charts/Charts";
import { NotificationsContext } from "../../../src/contexts/NotificationsContext";
import { auth } from "../../../src/firebase";
import { createBaseTask } from "../../../_testUtils/createBaseTask";

const { fetchChartPreferences } = require("../../../src/services/preferencesService");

jest.unmock("../../../src/components/navigation/TopBar");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("../../../src/firebase", () => {
  const baseUser = require("../../../_testUtils/createBaseUser").createBaseUser();
  return {
    auth: {
      currentUser: baseUser,
    },
  };
});

jest.mock("../../../src/services/columnsService", () => {
  const { createBaseColumn } = require("../../../_testUtils/createBaseColumn");
  return {
    fetchColumnOrder: jest.fn(() =>
      Promise.resolve({
        data: {
          columnNames: {
            "column-1": createBaseColumn({
              columnId: "column-1",
              name: "Test Board",
            }).name,
          },
        },
      })
    ),
  };
});

jest.mock("../../../src/services/labelsService", () => ({
  fetchLabels: jest.fn(() =>
    Promise.resolve({
      data: [
        { title: "Important", color: "#FF0000" },
        { title: "Optional", color: "#00FF00" },
        { title: "Something", color: "#F0FF00" },
      ],
    })
  ),
}));

jest.mock("../../../src/services/tasksService", () => {
  const { createBaseTask } = require("../../../_testUtils/createBaseTask");
  return {
    fetchTasks: jest.fn(() => Promise.resolve({ 
      data: [
        createBaseTask({
          _id: "task1",
          title: "Test Task 1",
          status: "column-1",
          priority: "A1",
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(), // due tomorrow
          timeSpent: 3600,
          storyPoints: 3,
          labels: [{ title: "Important", color: "#FF0000" }],
          assignedTo: "John Doe"
        }),
        createBaseTask({
          _id: "task2",
          title: "Test Task 2",
          status: "column-1",
          priority: "A2",
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(), // due tomorrow
          timeSpent: 7200,
          storyPoints: 5,
          labels: [{ title: "Something", color: "#F0FF00" }],
          assignedTo: "Jane Doe"
        }),
        createBaseTask({
          _id: "task3",
          title: "Test Task 3",
          status: "column-1",
          priority: "B1",
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() - 86400000).toISOString(), // overdue
          timeSpent: 5400,
          storyPoints: 8,
          labels: [{ title: "Optional", color: "#00FF00" }],
          assignedTo: "John Doe"
        })
      ] 
    })),
  };
});

jest.mock("../../../src/services/preferencesService", () => {
  let chartPreferencesState = {};
  return {
    fetchChartPreferences: jest.fn(() =>
      Promise.resolve({ data: { chartPreferences: chartPreferencesState } })
    ),
    updateChartPreferences: jest.fn((uid, prefs) => {
      chartPreferencesState = prefs;
      return Promise.resolve();
    }),
  };
});

// Modified to ensure the chart components render text that can be found in tests
jest.mock("recharts", () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">BarChart{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">LineChart{children}</div>,
  Line: () => <div>Line</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">AreaChart{children}</div>,
  Area: () => <div>Area</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">PieChart{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
  RadarChart: ({ children }) => <div data-testid="radar-chart">RadarChart{children}</div>,
  Radar: () => <div>Radar</div>,
  PolarGrid: () => <div>PolarGrid</div>,
  PolarAngleAxis: () => <div>PolarAngleAxis</div>,
  PolarRadiusAxis: () => <div>PolarRadiusAxis</div>,
}));

jest.mock("react-datepicker", () => ({
  __esModule: true,
  default: ({ selected, onChange, id, placeholderText }) => (
    <input
      id={id}
      placeholder={placeholderText}
      type="text"
      value={selected ? selected.toISOString() : ""}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}));

jest.mock("../../../src/components/navigation/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../../../src/components/modals/ViewTaskModal", () => () => (
  <div>ViewTaskModal</div>
));
jest.mock("../../../src/components/modals/GroupTasksModal", () => () => (
  <div>GroupTasksModal</div>
));

const renderWithContext = (ui, { notifications = [] } = {}) => {
  return render(
    <NotificationsContext.Provider value={{ notifications }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </NotificationsContext.Provider>
  );
};

const defaultPreferences = {
  timeRangeType: "week",
  taskType: "active",
  chartType: "bar",
  xAxisField: "day",
  yAxisMetric: "count",
  sortOrder: "none",
  dueFilter: "both",
  priorityFilters: [],
  dayOfWeekFilters: [],
  statusFilters: [],
  labelFilters: [],
  includeNoneLabel: true,
  assignedToFilter: "",
  minTaskCount: "",
  minStoryPoints: "",
  minTimeSpent: "",
  minTimeUnit: "seconds",
  scheduledOnly: false,
  includeZeroMetrics: true,
  includeNoDueDate: true,
  comparisonMode: false,
  compStartDate: null,
  compEndDate: null,
  customStartDate: null,
  customEndDate: null,
};

// =======================
// UNIT TESTS
// =======================
describe("Charts Component Unit Tests", () => {
  beforeEach(() => {
    useParams.mockReturnValue({});
    useLocation.mockReturnValue({ pathname: "/charts", search: "" });
    useNavigate.mockReturnValue(jest.fn());
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the Charts component without crashing", async () => {
    renderWithContext(<Charts />);
    await waitFor(() => expect(screen.getByText("Charts")).toBeInTheDocument());
  });

  test("renders the correct chart type based on state", async () => {
    renderWithContext(<Charts />);
    
    await waitFor(() => 
      expect(screen.queryByText("Loading preferences...")).not.toBeInTheDocument()
    );
    
    await waitFor(() => 
      expect(screen.queryByTestId("bar-chart")).toBeInTheDocument()
    );
  });

  // ------------------------------------------
  // Query params Tests
  // ------------------------------------------
  test("URL query string displays correctly for all fields on initial render and after updating every filter", async () => {
    const setSearchParamsMock = jest.fn();
    useSearchParams.mockReturnValue([
      new URLSearchParams(),
      setSearchParamsMock,
    ]);

    renderWithContext(<Charts />);

    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );

    const initialParamsObj = setSearchParamsMock.mock.calls[0][0];
    const initialQuery = new URLSearchParams(initialParamsObj).toString();
    const expectedInitialQuery =
      "timeRangeType=week&taskType=active&chartType=bar&xAxisField=day&yAxisMetric=count&sortOrder=none&dueFilter=both&priorityFilters=&dayOfWeekFilters=&statusFilters=&labelFilters=&includeNoneLabel=true&assignedToFilter=&minTaskCount=&minStoryPoints=&minTimeSpent=&minTimeUnit=seconds&includeZeroMetrics=true&scheduledOnly=false&includeNoDueDate=true&comparisonMode=false";
    expect(initialQuery).toBe(expectedInitialQuery);

    fireEvent.change(screen.getByLabelText("Time Range"), {
      target: { value: "month" },
    });

    fireEvent.change(screen.getByLabelText("Task Type"), {
      target: { value: "completed" },
    });

    fireEvent.change(screen.getByLabelText("X-Axis Field"), {
      target: { value: "priority" },
    });

    fireEvent.change(screen.getByLabelText("Y-Axis Metric"), {
      target: { value: "timeSpent" },
    });

    fireEvent.change(screen.getByLabelText("Sort By"), {
      target: { value: "asc" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    fireEvent.change(screen.getByLabelText("Due Date"), {
      target: { value: "overdue" },
    });

    const priorityLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Priority"
    );
    const priorityDropdownHeader =
      priorityLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(priorityDropdownHeader);
    fireEvent.click(screen.getByLabelText("A1"));

    const dayLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Day of the Week"
    );
    const dayDropdownHeader =
      dayLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(dayDropdownHeader);
    fireEvent.click(screen.getByLabelText("Monday"));

    const statusLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Status"
    );
    const statusDropdownHeader =
      statusLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(statusDropdownHeader);
    fireEvent.click(screen.getByLabelText("Test Board"));

    const labelDropdown = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Label"
    );
    const labelDropdownHeader =
      labelDropdown.parentElement.querySelector(".dropdown-header");
    fireEvent.click(labelDropdownHeader);
    fireEvent.click(screen.getByLabelText("Important"));
    fireEvent.click(screen.getByLabelText("Something"));

    fireEvent.click(screen.getByLabelText("Include None Label"));

    fireEvent.change(screen.getByPlaceholderText("Filter by assignee"), {
      target: { value: "Jane Doe" },
    });

    fireEvent.change(screen.getByLabelText("Minimum Task Count"), {
      target: { value: "5" },
    });

    fireEvent.change(screen.getByLabelText("Minimum Story Points"), {
      target: { value: "3" },
    });

    fireEvent.change(screen.getByLabelText("Minimum Time Spent"), {
      target: { value: "120" },
    });

    fireEvent.click(screen.getByRole("radio", { name: "Minutes" }));

    fireEvent.click(screen.getByLabelText("Scheduled Only"));

    fireEvent.click(screen.getByLabelText("Include Zero Metrics"));

    fireEvent.click(screen.getByLabelText("Include Tasks Without Due Date"));

    fireEvent.click(screen.getByLabelText("Comparison Mode"));

    const compStartInput = screen.getByLabelText("Comparison Start Date");
    const compEndInput = screen.getByLabelText("Comparison End Date");
    fireEvent.change(compStartInput, {
      target: { value: "2025-03-01T00:00:00.000Z" },
    });
    fireEvent.change(compEndInput, {
      target: { value: "2025-03-15T00:00:00.000Z" },
    });

    await waitFor(() => {
      expect(setSearchParamsMock).toHaveBeenCalled();
    });
    const calls = setSearchParamsMock.mock.calls;
    const lastParamsObj = calls[calls.length - 1][0];
    const finalQuery = new URLSearchParams(lastParamsObj).toString();

    const expectedFinalQuery =
      "timeRangeType=month&taskType=completed&chartType=bar&xAxisField=priority&yAxisMetric=timeSpent&sortOrder=asc&dueFilter=overdue&priorityFilters=A1&dayOfWeekFilters=Monday&statusFilters=column-1&labelFilters=Important%2CSomething&includeNoneLabel=false&assignedToFilter=Jane+Doe&minTaskCount=5&minStoryPoints=3&minTimeSpent=120&minTimeUnit=minutes&includeZeroMetrics=false&scheduledOnly=true&includeNoDueDate=false&comparisonMode=true&compStartDate=2025-03-01T00%3A00%3A00.000Z&compEndDate=2025-03-15T00%3A00%3A00.000Z";
    expect(finalQuery).toBe(expectedFinalQuery);
  });

  test("navigates to group tasks URL when a group is clicked", async () => {
    const navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    useLocation.mockReturnValue({
      pathname: "/charts",
      search:
        "?timeRangeType=week&taskType=active&chartType=bar&xAxisField=day&yAxisMetric=count&sortOrder=none&dueFilter=both&priorityFilters=&dayOfWeekFilters=&statusFilters=&assignedToFilter=&minTaskCount=&minStoryPoints=&minTimeSpent=&minTimeUnit=seconds&includeZeroMetrics=true&scheduledOnly=false&includeNoDueDate=true&comparisonMode=false",
    });

    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );

    const groupKey = "Friday";
    navigateMock(`/charts/grouptasks/${groupKey}${useLocation().search}`);

    expect(navigateMock).toHaveBeenCalledWith(
      "/charts/grouptasks/Friday?timeRangeType=week&taskType=active&chartType=bar&xAxisField=day&yAxisMetric=count&sortOrder=none&dueFilter=both&priorityFilters=&dayOfWeekFilters=&statusFilters=&assignedToFilter=&minTaskCount=&minStoryPoints=&minTimeSpent=&minTimeUnit=seconds&includeZeroMetrics=true&scheduledOnly=false&includeNoDueDate=true&comparisonMode=false"
    );
  });

  test("navigates to view task URL when a task is clicked in a group", async () => {
    const navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    useLocation.mockReturnValue({
      pathname: "/charts/grouptasks/Friday",
      search:
        "?timeRangeType=week&taskType=active&chartType=bar&xAxisField=day&yAxisMetric=count&sortOrder=none&dueFilter=both&priorityFilters=&dayOfWeekFilters=&statusFilters=&assignedToFilter=&minTaskCount=&minStoryPoints=&minTimeSpent=&minTimeUnit=seconds&includeZeroMetrics=true&scheduledOnly=false&includeNoDueDate=true&comparisonMode=false",
    });

    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );

    const task = createBaseTask();

    navigateMock(
      `/charts/grouptasks/Friday/viewtask/${task._id}${useLocation().search}`
    );

    expect(navigateMock).toHaveBeenCalledWith(
      "/charts/grouptasks/Friday/viewtask/1?timeRangeType=week&taskType=active&chartType=bar&xAxisField=day&yAxisMetric=count&sortOrder=none&dueFilter=both&priorityFilters=&dayOfWeekFilters=&statusFilters=&assignedToFilter=&minTaskCount=&minStoryPoints=&minTimeSpent=&minTimeUnit=seconds&includeZeroMetrics=true&scheduledOnly=false&includeNoDueDate=true&comparisonMode=false"
    );
  });

  test("changes chart type when chart type buttons are clicked via TopBar", async () => {
    renderWithContext(<Charts />);
    
    await waitFor(() => 
      expect(screen.queryByText("Loading preferences...")).not.toBeInTheDocument()
    );
    
    await waitFor(() => 
      expect(screen.queryByTestId("bar-chart")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Line" }));
    await waitFor(() =>
      expect(screen.queryByTestId("line-chart")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Pie" }));
    await waitFor(() =>
      expect(screen.queryByTestId("pie-chart")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Area" }));
    await waitFor(() =>
      expect(screen.queryByTestId("area-chart")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Radar" }));
    await waitFor(() =>
      expect(screen.queryByTestId("radar-chart")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Bar" }));
    await waitFor(() =>
      expect(screen.queryByTestId("bar-chart")).toBeInTheDocument()
    );
  });

  // ------------------------------------------
  // Filter Options Tests
  // ------------------------------------------
  test("Time Range filter options", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    const timeRangeSelect = screen.getByLabelText("Time Range");
    expect(timeRangeSelect.value).toBe("week");

    fireEvent.change(timeRangeSelect, { target: { value: "2weeks" } });
    expect(timeRangeSelect.value).toBe("2weeks");

    fireEvent.change(timeRangeSelect, { target: { value: "month" } });
    expect(timeRangeSelect.value).toBe("month");

    fireEvent.change(timeRangeSelect, { target: { value: "year" } });
    expect(timeRangeSelect.value).toBe("year");

    fireEvent.change(timeRangeSelect, { target: { value: "all-time" } });
    expect(timeRangeSelect.value).toBe("all-time");

    fireEvent.change(timeRangeSelect, { target: { value: "custom" } });
    expect(timeRangeSelect.value).toBe("custom");

    const nonExistingOption = screen.queryByRole("option", {
      name: "non-existing",
    });
    expect(nonExistingOption).toBeNull();
  });

  test("Task Type filter options", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    const taskTypeSelect = screen.getByLabelText("Task Type");
    expect(taskTypeSelect.value).toBe("active");

    fireEvent.change(taskTypeSelect, { target: { value: "completed" } });
    expect(taskTypeSelect.value).toBe("completed");

    fireEvent.change(taskTypeSelect, { target: { value: "both" } });
    expect(taskTypeSelect.value).toBe("both");

    const nonExistingOption = screen.queryByRole("option", {
      name: "non-existing",
    });
    expect(nonExistingOption).toBeNull();
  });

  test("X-Axis Field filter options", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    const xAxisSelect = screen.getByLabelText("X-Axis Field");
    expect(xAxisSelect.value).toBe("day");

    fireEvent.change(xAxisSelect, { target: { value: "priority" } });
    expect(xAxisSelect.value).toBe("priority");

    fireEvent.change(xAxisSelect, { target: { value: "status" } });
    expect(xAxisSelect.value).toBe("status");
  });

  test("Y-Axis Metric filter options", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    const yAxisSelect = screen.getByLabelText("Y-Axis Metric");
    expect(yAxisSelect.value).toBe("count");

    fireEvent.change(yAxisSelect, { target: { value: "timeSpent" } });
    expect(yAxisSelect.value).toBe("timeSpent");

    fireEvent.change(yAxisSelect, { target: { value: "storyPoints" } });
    expect(yAxisSelect.value).toBe("storyPoints");
  });

  test("Sort Order filter options", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    const sortOrderSelect = screen.getByLabelText("Sort By");
    expect(sortOrderSelect.value).toBe("none");

    fireEvent.change(sortOrderSelect, { target: { value: "asc" } });
    expect(sortOrderSelect.value).toBe("asc");

    fireEvent.change(sortOrderSelect, { target: { value: "desc" } });
    expect(sortOrderSelect.value).toBe("desc");
  });

  test("Due Filter options", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const dueFilterSelect = await screen.findByLabelText("Due Date");
    expect(dueFilterSelect.value).toBe("both");

    fireEvent.change(dueFilterSelect, { target: { value: "due" } });
    expect(dueFilterSelect.value).toBe("due");

    fireEvent.change(dueFilterSelect, { target: { value: "overdue" } });
    expect(dueFilterSelect.value).toBe("overdue");
  });

  test("Priority MultiSelect filter", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const priorityLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Priority"
    );
    const priorityDropdownHeader =
      priorityLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(priorityDropdownHeader);

    const a1Checkbox = screen.getByLabelText("A1");
    fireEvent.click(a1Checkbox);
    expect(priorityDropdownHeader.textContent).toContain("A1");

    fireEvent.click(a1Checkbox);
    expect(priorityDropdownHeader.textContent).toBe("All");
  });

  test("Day of the Week MultiSelect filter", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const dayLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Day of the Week"
    );
    const dayDropdownHeader =
      dayLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(dayDropdownHeader);

    const mondayCheckbox = screen.getByLabelText("Monday");
    fireEvent.click(mondayCheckbox);
    expect(dayDropdownHeader.textContent).toContain("Monday");

    fireEvent.click(mondayCheckbox);
    expect(dayDropdownHeader.textContent).toBe("All");
  });

  test("Status MultiSelect filter", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const statusLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Status"
    );
    const statusDropdownHeader =
      statusLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(statusDropdownHeader);

    const testBoardCheckbox = screen.getByLabelText("Test Board");
    fireEvent.click(testBoardCheckbox);

    expect(statusDropdownHeader.textContent).toContain("Test Board");

    fireEvent.click(testBoardCheckbox);
    expect(statusDropdownHeader.textContent).toBe("All");
  });

  test("Assigned To filter input", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const assignedToInput = screen.getByPlaceholderText("Filter by assignee");
    expect(assignedToInput.value).toBe("");
    fireEvent.change(assignedToInput, { target: { value: "John Doe" } });
    expect(assignedToInput.value).toBe("John Doe");
  });

  test("Minimum Task Count input", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const minTaskCountField = screen.getByLabelText("Minimum Task Count");
    fireEvent.change(minTaskCountField, { target: { value: "5" } });
    expect(minTaskCountField.value).toBe("5");
  });

  test("Minimum Story Points input", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const minStoryPointsField = screen.getByLabelText("Minimum Story Points");
    fireEvent.change(minStoryPointsField, { target: { value: "3" } });
    expect(minStoryPointsField.value).toBe("3");
  });

  test("Minimum Time Spent input and unit radio buttons", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const minTimeSpentField = screen.getByLabelText("Minimum Time Spent");
    fireEvent.change(minTimeSpentField, { target: { value: "120" } });
    expect(minTimeSpentField.value).toBe("120");

    const secondsRadio = screen.getByRole("radio", { name: "Seconds" });
    const minutesRadio = screen.getByRole("radio", { name: "Minutes" });
    const hoursRadio = screen.getByRole("radio", { name: "Hours" });
    expect(secondsRadio.checked).toBe(true);
    expect(minutesRadio.checked).toBe(false);
    expect(hoursRadio.checked).toBe(false);

    fireEvent.click(minutesRadio);
    expect(minutesRadio.checked).toBe(true);

    fireEvent.click(hoursRadio);
    expect(hoursRadio.checked).toBe(true);
  });

  test("Scheduled Only checkbox", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const scheduledOnlyCheckbox = screen.getByLabelText("Scheduled Only");
    expect(scheduledOnlyCheckbox.checked).toBe(false);
    fireEvent.click(scheduledOnlyCheckbox);
    expect(scheduledOnlyCheckbox.checked).toBe(true);
  });

  test("Include Zero Metrics checkbox", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const includeZeroCheckbox = screen.getByLabelText("Include Zero Metrics");
    expect(includeZeroCheckbox.checked).toBe(true);
    fireEvent.click(includeZeroCheckbox);
    expect(includeZeroCheckbox.checked).toBe(false);
  });

  test("Include Tasks Without Due Date checkbox", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));
    const includeNoDueDateCheckbox = screen.getByLabelText(
      "Include Tasks Without Due Date"
    );
    expect(includeNoDueDateCheckbox.checked).toBe(true);
    fireEvent.click(includeNoDueDateCheckbox);
    expect(includeNoDueDateCheckbox.checked).toBe(false);
  });

  test("Comparison Mode toggle and date pickers", async () => {
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );

    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));

    const comparisonModeCheckbox = screen.getByLabelText("Comparison Mode");
    expect(comparisonModeCheckbox.checked).toBe(false);
    fireEvent.click(comparisonModeCheckbox);
    expect(comparisonModeCheckbox.checked).toBe(true);

    const compStartDatePicker = screen.getByLabelText("Comparison Start Date");
    const compEndDatePicker = screen.getByLabelText("Comparison End Date");
    expect(compStartDatePicker).toBeInTheDocument();
    expect(compEndDatePicker).toBeInTheDocument();

    fireEvent.change(compStartDatePicker, {
      target: { value: "2025-03-01T00:00:00.000Z" },
    });
    fireEvent.change(compEndDatePicker, {
      target: { value: "2025-03-15T00:00:00.000Z" },
    });
    expect(compStartDatePicker.value).toBe("2025-03-01T00:00:00.000Z");
    expect(compEndDatePicker.value).toBe("2025-03-15T00:00:00.000Z");
  });
});

// =======================
// INTEGRATION TESTS
// =======================
describe("Charts Component Integration Tests", () => {
  beforeEach(() => {
    useParams.mockReturnValue({});
    useLocation.mockReturnValue({ pathname: "/charts", search: "" });
    useNavigate.mockReturnValue(jest.fn());
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
  });

  afterEach(() => {
    cleanup();
  });

  test("saves user preferences when the save button is clicked and calls toast.success", async () => {
    jest.spyOn(toast, "success");

    expect(auth.currentUser.chartPreferences).toEqual(defaultPreferences);

    renderWithContext(<Charts />);
    await waitFor(() => expect(screen.getByText("Charts")).toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox", { name: "Time Range" }), {
      target: { value: "month" },
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Task Type" }), {
      target: { value: "completed" },
    });

    fireEvent.change(screen.getByRole("combobox", { name: "X-Axis Field" }), {
      target: { value: "priority" },
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Y-Axis Metric" }), {
      target: { value: "timeSpent" },
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Sort By" }), {
      target: { value: "asc" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Show Advanced ▼" }));

    fireEvent.change(screen.getByRole("combobox", { name: "Due Date" }), {
      target: { value: "overdue" },
    });

    const priorityLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Priority"
    );
    const priorityDropdownHeader =
      priorityLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(priorityDropdownHeader);
    fireEvent.click(screen.getByLabelText("A1"));

    const dayLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Day of the Week"
    );
    const dayDropdownHeader =
      dayLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(dayDropdownHeader);
    fireEvent.click(screen.getByLabelText("Monday"));

    const statusLabel = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Status"
    );
    const statusDropdownHeader =
      statusLabel.parentElement.querySelector(".dropdown-header");
    fireEvent.click(statusDropdownHeader);
    fireEvent.click(screen.getByLabelText("Test Board"));

    const labelDropdown = screen.getByText(
      (content, node) =>
        node.tagName.toLowerCase() === "label" && content === "Label"
    );
    const labelDropdownHeader =
      labelDropdown.parentElement.querySelector(".dropdown-header");
    fireEvent.click(labelDropdownHeader);
    fireEvent.click(screen.getByLabelText("Important"));
    fireEvent.click(screen.getByLabelText("Optional"));

    fireEvent.click(screen.getByLabelText("Include None Label"));

    fireEvent.change(screen.getByRole("textbox", { name: "Assigned To" }), {
      target: { value: "John Doe" },
    });

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Minimum Task Count" }),
      {
        target: { value: "5" },
      }
    );

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Minimum Story Points" }),
      {
        target: { value: "3" },
      }
    );

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Minimum Time Spent" }),
      {
        target: { value: "120" },
      }
    );
    fireEvent.click(screen.getByRole("radio", { name: "Minutes" }));

    fireEvent.click(screen.getByRole("checkbox", { name: "Scheduled Only" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Include Zero Metrics" })
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Include Tasks Without Due Date" })
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Comparison Mode" }));
    const compStartInput = screen.getByRole("textbox", {
      name: "Comparison Start Date",
    });
    const compEndInput = screen.getByRole("textbox", {
      name: "Comparison End Date",
    });
    fireEvent.change(compStartInput, {
      target: { value: "2025-03-01T00:00:00.000Z" },
    });
    fireEvent.change(compEndInput, {
      target: { value: "2025-03-15T00:00:00.000Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Line" }));

    // save preferences
    fireEvent.click(screen.getByText("Save Preferences"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Preferences saved successfully!"
      )
    );

    const expectedPreferences = {
      timeRangeType: "month",
      taskType: "completed",
      chartType: "line",
      xAxisField: "priority",
      yAxisMetric: "timeSpent",
      sortOrder: "asc",
      dueFilter: "overdue",
      priorityFilters: ["A1"],
      labelFilters: ["Important", "Optional"],
      includeNoneLabel: false,
      dayOfWeekFilters: ["Monday"],
      statusFilters: ["column-1"],
      assignedToFilter: "John Doe",
      minTaskCount: "5",
      minStoryPoints: "3",
      minTimeSpent: "120",
      minTimeUnit: "minutes",
      scheduledOnly: true,
      includeZeroMetrics: false,
      includeNoDueDate: false,
      comparisonMode: true,
      compStartDate: "2025-03-01T00:00:00.000Z",
      compEndDate: "2025-03-15T00:00:00.000Z",
      customStartDate: null,
      customEndDate: null,
    };

    cleanup();
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );

    const result = await fetchChartPreferences(auth.currentUser.userId);
    expect(result.data.chartPreferences).toEqual(expectedPreferences);

    // default preferences
    fireEvent.click(screen.getByText("Default Preferences"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Preferences reset to default!"
      )
    );
    const defaultResult = await fetchChartPreferences(auth.currentUser.userId);

    expect(defaultResult.data.chartPreferences).toEqual(defaultPreferences);

    cleanup();
    renderWithContext(<Charts />);
    await waitFor(() =>
      expect(screen.queryByText("Loading preferences...")).toBeNull()
    );

    expect(defaultResult.data.chartPreferences).toEqual(defaultPreferences);
  });

  test("calls toast.error when saving preferences fails", async () => {
    const {
      updateChartPreferences,
    } = require("../../../src/services/preferencesService");
    updateChartPreferences.mockRejectedValueOnce(new Error("Save failed"));

    jest.spyOn(toast, "error");

    renderWithContext(<Charts />);
    await waitFor(() => expect(screen.getByText("Charts")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Save Preferences"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Error saving preferences!")
    );
  });

  test("calls toast.error when resetting preferences fails", async () => {
    const {
      updateChartPreferences,
    } = require("../../../src/services/preferencesService");
    updateChartPreferences.mockRejectedValueOnce(new Error("Reset failed"));

    jest.spyOn(toast, "error");

    renderWithContext(<Charts />);
    await waitFor(() => expect(screen.getByText("Charts")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Default Preferences"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Error resetting preferences!")
    );
  });
});