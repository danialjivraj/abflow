import React, { useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DatePicker from "react-datepicker";
import { fetchTasks, fetchColumnOrder } from "../services/tasksService";
import { auth } from "../firebase";
import Layout from "../components/Layout";
import { startOfISOWeek, format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { formatToHoursIfTimeSpent } from "../utils/dateUtils";
import ViewTaskModal from "./Dashboard/ViewTaskModal";
import GroupTasksModal from "./GroupTasksModal";

// Options for multi-selects
const allowedPriorities = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"];
const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EFF", "#FF6699"];

const MultiSelectDropdown = ({ label, options, selectedOptions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue) => {
    if (selectedOptions.includes(optionValue)) {
      onChange(selectedOptions.filter((o) => o !== optionValue));
    } else {
      onChange([...selectedOptions, optionValue]);
    }
  };

  const selectedLabels = options
    .filter((opt) => selectedOptions.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <label>{label}</label>
      <div
        className={`dropdown-header${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabels.length > 0 ? selectedLabels.join(", ") : "All"}
      </div>
      {isOpen && (
        <div className="dropdown-options">
          {options.map((opt, index) => (
            <div key={index} className="dropdown-option">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(opt.value)}
                  onChange={() => toggleOption(opt.value)}
                />
                {opt.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Stats = () => {
  // -------------------- State --------------------
  const [tasks, setTasks] = useState([]);
  const [columnsMapping, setColumnsMapping] = useState({});
  const [loading, setLoading] = useState(true);

  // Chart and Filter States
  const [chartType, setChartType] = useState("bar");
  const [xAxisField, setXAxisField] = useState("day");
  const [yAxisMetric, setYAxisMetric] = useState("count");
  const [taskType, setTaskType] = useState("active");
  const [timeRangeType, setTimeRangeType] = useState("week");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [sortOrder, setSortOrder] = useState("none");
  const [dueFilter, setDueFilter] = useState("both");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [dayOfWeekFilters, setDayOfWeekFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [minStoryPoints, setMinStoryPoints] = useState("");
  const [minTimeSpent, setMinTimeSpent] = useState("");
  const [minTimeUnit, setMinTimeUnit] = useState("seconds");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compStartDate, setCompStartDate] = useState(null);
  const [compEndDate, setCompEndDate] = useState(null);
  const [scheduledOnly, setScheduledOnly] = useState(false);
  const [includeNoDueDate, setIncludeNoDueDate] = useState(true);

  // Chart Data
  const [chartData, setChartData] = useState([]);

  // Modal for "Tasks for Group"
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroupTasks, setSelectedGroupTasks] = useState([]);

  // Read-only Task Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);

  // -------------------- Effects: Fetch Tasks + Columns --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const userId = currentUser.uid;
        const res = await fetchTasks(userId);
        const tasksData = Array.isArray(res.data) ? res.data : res.data.tasks || [];
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const userId = currentUser.uid;
        const res = await fetchColumnOrder(userId);
        const mapping = res.data.columnNames || {};
        setColumnsMapping(mapping);
      } catch (error) {
        console.error("Error fetching column mapping:", error);
      }
    };
    fetchColumns();
  }, []);

  const statusOptions = Object.entries(columnsMapping).map(([colId, colName]) => ({
    value: colId,
    label: colName,
  }));

  // -------------------- Compute Date Range --------------------
  const computeDateRange = () => {
    const today = new Date();
    let startDate, endDate;

    switch (timeRangeType) {
      case "week": {
        startDate = startOfISOWeek(today);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      }
      case "2weeks": {
        startDate = startOfISOWeek(today);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 13);
        break;
      }
      case "month": {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      }
      case "year": {
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      }
      case "all-time": {
        const validTasks = tasks.filter((task) => task.createdAt || task.completedAt);
        if (validTasks.length > 0) {
          const earliest = new Date(
            Math.min(...validTasks.map((task) => new Date(task.createdAt || task.completedAt)))
          );
          startDate = earliest;
        } else {
          startDate = new Date(today.getFullYear(), 0, 1);
        }
        endDate = today;
        break;
      }
      case "custom":
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        break;
    }

    return { startDate, endDate };
  };

  // -------------------- Filter Logic --------------------
  const applyAllFilters = (tasksList, startDate, endDate) => {
    // Filter by date range + active/completed
    let filtered = tasksList.filter((task) => {
      if (taskType === "active") {
        if (task.status === "completed") return false;
        if (!task.createdAt) return false;
        const d = new Date(task.createdAt);
        return d >= startDate && d <= endDate;
      } else if (taskType === "completed") {
        if (task.status !== "completed") return false;
        if (!task.completedAt) return false;
        const d = new Date(task.completedAt);
        return d >= startDate && d <= endDate;
      } else {
        // both
        let d;
        if (task.status === "completed") {
          if (!task.completedAt) return false;
          d = new Date(task.completedAt);
        } else {
          if (!task.createdAt) return false;
          d = new Date(task.createdAt);
        }
        return d >= startDate && d <= endDate;
      }
    });

    // dueFilter: "both" | "due" | "overdue"
    if (dueFilter !== "both") {
      const now = new Date();
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return includeNoDueDate;
        const dueD = new Date(task.dueDate);
        return dueFilter === "due" ? dueD >= now : dueD < now;
      });
    } else if (!includeNoDueDate) {
      filtered = filtered.filter((task) => task.dueDate);
    }

    // Priority
    if (priorityFilters.length > 0) {
      filtered = filtered.filter((task) => priorityFilters.includes(task.priority));
    }

    // Day of week
    if (dayOfWeekFilters.length > 0) {
      filtered = filtered.filter((task) => {
        const d =
          task.status === "completed" ? new Date(task.completedAt) : new Date(task.createdAt);
        return dayOfWeekFilters.includes(format(d, "EEEE"));
      });
    }

    // Status
    if (statusFilters.length > 0) {
      filtered = filtered.filter((task) => statusFilters.includes(task.status));
    }

    // Assigned To
    if (assignedToFilter.trim() !== "") {
      const term = assignedToFilter.trim().toLowerCase();
      filtered = filtered.filter(
        (task) => task.assignedTo && task.assignedTo.toLowerCase().includes(term)
      );
    }

    // Min Story Points
    if (minStoryPoints !== "" && !isNaN(parseInt(minStoryPoints, 10))) {
      const minVal = parseInt(minStoryPoints, 10);
      filtered = filtered.filter((task) => (task.storyPoints || 0) >= minVal);
    }

    // Min Time Spent
    if (minTimeSpent !== "" && !isNaN(parseFloat(minTimeSpent))) {
      const value = parseFloat(minTimeSpent);
      let threshold = value;
      if (minTimeUnit === "minutes") threshold = value * 60;
      else if (minTimeUnit === "hours") threshold = value * 3600;

      filtered = filtered.filter((task) => (task.timeSpent || 0) >= threshold);
    }

    // Scheduled Only
    if (scheduledOnly) {
      filtered = filtered.filter((task) => task.scheduledAt != null && task.scheduledAt !== "");
    }

    return filtered;
  };

  // -------------------- Grouping Functions --------------------
  const groupTasks = (tasksList) => {
    const groupMap = {};

    tasksList.forEach((task) => {
      let d;
      if (task.status === "completed") {
        d = new Date(task.completedAt);
      } else {
        d = new Date(task.createdAt);
      }

      let key;
      if (xAxisField === "day") {
        key = format(d, "EEEE");
      } else if (xAxisField === "priority") {
        key = task.priority || "None";
      } else if (xAxisField === "status") {
        key =
          task.status === "completed"
            ? "Completed"
            : columnsMapping[task.status] || task.status;
      }

      if (!groupMap[key]) {
        groupMap[key] = { key, count: 0, timeSpent: 0, storyPoints: 0 };
      }
      groupMap[key].count += 1;
      groupMap[key].timeSpent += task.timeSpent || 0;
      groupMap[key].storyPoints += task.storyPoints || 0;
    });

    return Object.values(groupMap);
  };

  const mergeData = (mainData, compData) => {
    const merged = {};
    mainData.forEach((item) => {
      merged[item.key] = { key: item.key, mainValue: item[yAxisMetric] || 0, compValue: 0 };
    });
    compData.forEach((item) => {
      if (merged[item.key]) {
        merged[item.key].compValue = item[yAxisMetric] || 0;
      } else {
        merged[item.key] = { key: item.key, mainValue: 0, compValue: item[yAxisMetric] || 0 };
      }
    });
    return Object.values(merged);
  };

  // -------------------- Update Chart Data --------------------
  useEffect(() => {
    const { startDate, endDate } = computeDateRange();
    if (!startDate || !endDate) {
      setChartData([]);
      return;
    }

    const mainFiltered = applyAllFilters(tasks, startDate, endDate);
    const mainGrouped = groupTasks(mainFiltered);

    if (comparisonMode && compStartDate && compEndDate) {
      const compFiltered = applyAllFilters(tasks, compStartDate, compEndDate);
      const compGrouped = groupTasks(compFiltered);
      const merged = mergeData(mainGrouped, compGrouped);

      // Convert timeSpent to hours if needed
      const converted = merged.map((item) => {
        if (yAxisMetric === "timeSpent") {
          return {
            ...item,
            mainValue: item.mainValue / 3600,
            compValue: item.compValue / 3600,
          };
        }
        return item;
      });

      setChartData(converted);
    } else {
      const single = mainGrouped.map((item) => {
        if (yAxisMetric === "timeSpent") {
          return {
            key: item.key,
            mainValue: item[yAxisMetric] / 3600,
          };
        }
        return {
          key: item.key,
          mainValue: item[yAxisMetric],
        };
      });
      setChartData(single);
    }
  }, [
    tasks,
    timeRangeType,
    customStartDate,
    customEndDate,
    taskType,
    xAxisField,
    columnsMapping,
    yAxisMetric,
    sortOrder,
    dueFilter,
    includeNoDueDate,
    priorityFilters,
    dayOfWeekFilters,
    statusFilters,
    assignedToFilter,
    minStoryPoints,
    minTimeSpent,
    minTimeUnit,
    scheduledOnly,
    comparisonMode,
    compStartDate,
    compEndDate,
  ]);

  // Sort by mainValue after building chart data
  useEffect(() => {
    setChartData((prev) => {
      const sorted = [...prev];
      if (sortOrder === "asc") {
        sorted.sort((a, b) => a.mainValue - b.mainValue);
      } else if (sortOrder === "desc") {
        sorted.sort((a, b) => b.mainValue - a.mainValue);
      }
      return sorted;
    });
  }, [sortOrder]);

  // -------------------- Chart Rendering --------------------
  const tooltipFormatter = (value) =>
    yAxisMetric === "timeSpent" ? `${value.toFixed(2)}h` : value;

  // When user clicks on a bar/line/pie slice
  const handleChartClick = (data) => {
    if (!data || !data.payload) return;
    const groupKey = data.payload.key;

    const { startDate, endDate } = computeDateRange();
    const filteredTasks = applyAllFilters(tasks, startDate, endDate).filter((task) => {
      if (xAxisField === "day") {
        const d = new Date(task.status === "completed" ? task.completedAt : task.createdAt);
        return format(d, "EEEE") === groupKey;
      } else if (xAxisField === "priority") {
        return (task.priority || "None") === groupKey;
      } else if (xAxisField === "status") {
        const statusLabel =
          task.status === "completed"
            ? "Completed"
            : columnsMapping[task.status] || task.status;
        return statusLabel === groupKey;
      }
      return false;
    });

    // Tag tasks with groupKey, then show them in the "Tasks for Group" modal
    const tasksWithGroup = filteredTasks.map((task) => ({ ...task, groupKey }));
    setSelectedGroupTasks(tasksWithGroup);
    setModalOpen(true);
  };

  const renderChart = () => {
    if (loading) return <p>Loading...</p>;
    if (!chartData || chartData.length === 0)
      return <p>No data available for the selected time range.</p>;

    if (chartType === "bar") {
      const hasComparison = comparisonMode && compStartDate && compEndDate;
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="key" tick={{ fill: "white" }} />
            <YAxis
              tick={{ fill: "white" }}
              tickFormatter={(value) => formatToHoursIfTimeSpent(value, yAxisMetric)}
            />
            <Tooltip
              formatter={tooltipFormatter}
              cursor={{ fill: "#4a4a4a" }}
              contentStyle={{
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend />
            <Bar dataKey="mainValue" fill="#446688" name="Main Range" onClick={handleChartClick} />
            {hasComparison && (
              <Bar dataKey="compValue" fill="#FF8042" name="Comparison Range" />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "line") {
      const hasComparison = comparisonMode && compStartDate && compEndDate;
      return (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="key" tick={{ fill: "white" }} />
            <YAxis
              tick={{ fill: "white" }}
              tickFormatter={(value) => formatToHoursIfTimeSpent(value, yAxisMetric)}
            />
            <Tooltip
              formatter={tooltipFormatter}
              cursor={{ fill: "#4a4a4a" }}
              contentStyle={{
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="mainValue"
              stroke="#446688"
              name="Main Range"
              strokeWidth={3}
              dot={{ r: 6, onClick: handleChartClick }}
              activeDot={{ r: 8 }}
            />
            {hasComparison && (
              <Line
                type="monotone"
                dataKey="compValue"
                stroke="#FF8042"
                name="Comparison Range"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "pie") {
      if (comparisonMode && compStartDate && compEndDate) {
        return <p>Comparison not supported for this chart type.</p>;
      }
      return (
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="mainValue"
              nameKey="key"
              cx="50%"
              cy="50%"
              outerRadius={200}
              fill="#446688"
              label={(entry) =>
                yAxisMetric === "timeSpent" ? `${entry.value.toFixed(2)}h` : `${entry.value}`
              }
              onClick={handleChartClick}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return <p>Comparison not supported for this chart type.</p>;
  };

  // -------------------- Read-only ViewTaskModal from Group Modal --------------------
  const openReadOnlyViewTaskModal = (task) => {
    setSelectedTask(task);
    setIsViewTaskModalOpen(true);
    setModalOpen(false);
  };

  return (
    <Layout>
      <div className="stats-page">
        <h1 className="stats-title">Stats</h1>
        <div className="stats-container">
          <div className="stats-left">
            <div className="filters-card">
              {/* Filter UI */}
              <div className="filter-group">
                <label>Time Range</label>
                <select
                  value={timeRangeType}
                  onChange={(e) => setTimeRangeType(e.target.value)}
                >
                  <option value="week">This Week</option>
                  <option value="2weeks">Last 2 Weeks</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all-time">All Time</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {timeRangeType === "custom" && (
                <div className="custom-range">
                  <label>Start Date</label>
                  <DatePicker
                    selected={customStartDate}
                    onChange={(date) => setCustomStartDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select start date"
                    disabledKeyboardNavigation
                  />
                  <label>End Date</label>
                  <DatePicker
                    selected={customEndDate}
                    onChange={(date) => setCustomEndDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select end date"
                    disabledKeyboardNavigation
                  />
                </div>
              )}
              <div className="filter-group">
                <label>Task Type</label>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                  <option value="active">Active (In Boards)</option>
                  <option value="completed">Completed</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Chart Type</label>
                <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
              <div className="filter-group">
                <label>X-Axis Field</label>
                <select value={xAxisField} onChange={(e) => setXAxisField(e.target.value)}>
                  <option value="day">Day</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Y-Axis Metric</label>
                <select value={yAxisMetric} onChange={(e) => setYAxisMetric(e.target.value)}>
                  <option value="count">Task Count</option>
                  <option value="timeSpent">Time Spent</option>
                  <option value="storyPoints">Story Points</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="none">None</option>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div className="filter-group">
                <button
                  onClick={() => setShowAdvancedFilters((prev) => !prev)}
                  className="toggle-btn"
                >
                  {showAdvancedFilters ? "Hide Advanced ▲" : "Show Advanced ▼"}
                </button>
              </div>
              {showAdvancedFilters && (
                <div className="advanced-filters">
                  <div className="filter-group">
                    <label>Due Date</label>
                    <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
                      <option value="both">Both</option>
                      <option value="due">Due</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <MultiSelectDropdown
                      label="Priority"
                      options={allowedPriorities.map((p) => ({ value: p, label: p }))}
                      selectedOptions={priorityFilters}
                      onChange={setPriorityFilters}
                    />
                  </div>
                  <div className="filter-group">
                    <MultiSelectDropdown
                      label="Day of the Week"
                      options={dayOptions.map((d) => ({ value: d, label: d }))}
                      selectedOptions={dayOfWeekFilters}
                      onChange={setDayOfWeekFilters}
                    />
                  </div>
                  <div className="filter-group">
                    <MultiSelectDropdown
                      label="Status"
                      options={statusOptions}
                      selectedOptions={statusFilters}
                      onChange={setStatusFilters}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Assigned To</label>
                    <input
                      type="text"
                      placeholder="Filter by assignee"
                      value={assignedToFilter}
                      onChange={(e) => setAssignedToFilter(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Minimum Story Points</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minStoryPoints}
                      onChange={(e) => setMinStoryPoints(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Minimum Time Spent</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input
                        type="number"
                        placeholder="0"
                        value={minTimeSpent}
                        onChange={(e) => setMinTimeSpent(e.target.value)}
                        style={{ width: "80px" }}
                      />
                      <div className="min-time-unit-options">
                        <label>
                          <input
                            type="radio"
                            name="minTimeUnit"
                            value="seconds"
                            checked={minTimeUnit === "seconds"}
                            onChange={(e) => setMinTimeUnit(e.target.value)}
                          />
                          Seconds
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="minTimeUnit"
                            value="minutes"
                            checked={minTimeUnit === "minutes"}
                            onChange={(e) => setMinTimeUnit(e.target.value)}
                          />
                          Minutes
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="minTimeUnit"
                            value="hours"
                            checked={minTimeUnit === "hours"}
                            onChange={(e) => setMinTimeUnit(e.target.value)}
                          />
                          Hours
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="filter-group">
                    <label>Scheduled Only</label>
                    <input
                      type="checkbox"
                      checked={scheduledOnly}
                      onChange={(e) => setScheduledOnly(e.target.checked)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Include Tasks Without Due Date</label>
                    <input
                      type="checkbox"
                      checked={includeNoDueDate}
                      onChange={(e) => setIncludeNoDueDate(e.target.checked)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Comparison Mode</label>
                    <input
                      type="checkbox"
                      checked={comparisonMode}
                      onChange={(e) => setComparisonMode(e.target.checked)}
                    />
                  </div>
                  {comparisonMode && (
                    <div className="comparison-range">
                      <div className="filter-group">
                        <label>Comparison Start Date</label>
                        <DatePicker
                          selected={compStartDate}
                          onChange={(date) => setCompStartDate(date)}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select start date"
                          disabledKeyboardNavigation
                        />
                      </div>
                      <div className="filter-group">
                        <label>Comparison End Date</label>
                        <DatePicker
                          selected={compEndDate}
                          onChange={(date) => setCompEndDate(date)}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select end date"
                          disabledKeyboardNavigation
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="stats-right">{renderChart()}</div>
        </div>
      </div>

      {/* ---- Group Tasks Modal ---- */}
      <GroupTasksModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        selectedGroupTasks={selectedGroupTasks}
        openReadOnlyViewTaskModal={openReadOnlyViewTaskModal}
      />

      {/* ---- Read-only ViewTaskModal ---- */}
      {isViewTaskModalOpen && (
        <ViewTaskModal
          isModalOpen={isViewTaskModalOpen}
          closeModal={() => setIsViewTaskModalOpen(false)}
          task={selectedTask}
          handleUpdateTask={() => {}}
          columns={columnsMapping}
          startTimer={() => {}}
          stopTimer={() => {}}
          readOnly={true}
        />
      )}
    </Layout>
  );
};

export default Stats;
