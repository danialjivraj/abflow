import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import DatePicker from "react-datepicker";
import { fetchTasks } from "../../services/tasksService.js";
import { fetchColumnOrder } from "../../services/columnsService.js";
import { fetchLabels } from "../../services/labelsService.js";
import {
  fetchChartPreferences,
  updateChartPreferences,
} from "../../services/preferencesService.js";
import { auth } from "../../firebase.js";
import Layout from "../../components/navigation/Layout.jsx";
import TopBar from "../../components/navigation/TopBar.jsx";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import ViewTaskModal from "../../components/modals/ViewTaskModal.jsx";
import GroupTasksModal from "../../components/modals/GroupTasksModal.jsx";
import {
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { getChartsTopBarConfig } from "../../config/topBarConfig.jsx";
import MultiSelectDropdown from "../../utils/MultiSelectDropdown.jsx";
import { toast } from "react-toastify";
import {
  computeDateRange,
  applyAllFilters,
  groupTasks,
  mergeData,
} from "./ChartsFilter";

// options for multi-selects
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
const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28EFF",
  "#FF6699",
];

const Charts = ({ userSettings }) => {
  // state
  const [tasks, setTasks] = useState([]);
  const [columnsMapping, setColumnsMapping] = useState({});
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  // chart and filter States
  const [timeRangeType, setTimeRangeType] = useState("week");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [taskType, setTaskType] = useState("active");
  const [chartType, setChartType] = useState("bar");
  const [xAxisField, setXAxisField] = useState("day");
  const [yAxisMetric, setYAxisMetric] = useState("count");
  const [sortOrder, setSortOrder] = useState("none");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dueFilter, setDueFilter] = useState("both");
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [dayOfWeekFilters, setDayOfWeekFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [labelFilters, setLabelFilters] = useState([]);
  const [includeNoneLabel, setIncludeNoneLabel] = useState(true);
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [minTaskCount, setMinTaskCount] = useState("");
  const [minStoryPoints, setMinStoryPoints] = useState("");
  const [minTimeSpent, setMinTimeSpent] = useState("");
  const [minTimeUnit, setMinTimeUnit] = useState("seconds");
  const [scheduledOnly, setScheduledOnly] = useState(false);
  const [includeZeroMetrics, setIncludeZeroMetrics] = useState(true);
  const [includeNoDueDate, setIncludeNoDueDate] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compStartDate, setCompStartDate] = useState(null);
  const [compEndDate, setCompEndDate] = useState(null);

  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const [isDefaultDisabled, setIsDefaultDisabled] = useState(false);

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // chart data
  const [chartData, setChartData] = useState([]);

  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [userClosedModal, setUserClosedModal] = useState(false);
  const [selectedMainGroupTasks, setSelectedMainGroupTasks] = useState([]);
  const [selectedCompGroupTasks, setSelectedCompGroupTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);

  // hooks from react router
  const { taskId, groupKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // default filter settings
  const defaultFilterSettings = {
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

  // initialize filters from uRL
  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    if (params.timeRangeType) setTimeRangeType(params.timeRangeType);
    if (params.taskType) setTaskType(params.taskType);
    if (params.chartType) setChartType(params.chartType);
    if (params.xAxisField) setXAxisField(params.xAxisField);
    if (params.yAxisMetric) setYAxisMetric(params.yAxisMetric);
    if (params.sortOrder) setSortOrder(params.sortOrder);
    if (params.dueFilter) setDueFilter(params.dueFilter);
    if (params.priorityFilters) {
      setPriorityFilters(params.priorityFilters.split(","));
    }
    if (params.dayOfWeekFilters) {
      setDayOfWeekFilters(params.dayOfWeekFilters.split(","));
    }
    if (params.statusFilters) {
      setStatusFilters(params.statusFilters.split(","));
    }
    if (params.labelFilters) {
      setLabelFilters(params.labelFilters.split(","));
    }
    if (params.includeNoneLabel) {
      setIncludeNoneLabel(params.includeNoneLabel === "true");
    }
    if (params.assignedToFilter) setAssignedToFilter(params.assignedToFilter);
    if (params.minTaskCount) setMinTaskCount(params.minTaskCount);
    if (params.minStoryPoints) setMinStoryPoints(params.minStoryPoints);
    if (params.minTimeSpent) setMinTimeSpent(params.minTimeSpent);
    if (params.minTimeUnit) setMinTimeUnit(params.minTimeUnit);
    if (params.scheduledOnly) setScheduledOnly(params.scheduledOnly === "true");
    if (params.includeZeroMetrics)
      setIncludeZeroMetrics(params.includeZeroMetrics === "true");
    if (params.includeNoDueDate)
      setIncludeNoDueDate(params.includeNoDueDate === "true");
    if (params.comparisonMode)
      setComparisonMode(params.comparisonMode === "true");
    if (params.compStartDate) {
      setCompStartDate(new Date(params.compStartDate));
    }
    if (params.compEndDate) {
      setCompEndDate(new Date(params.compEndDate));
    }
  }, []);

  // update URL on filter changes
  useEffect(() => {
    const params = {
      timeRangeType,
      taskType,
      chartType,
      xAxisField,
      yAxisMetric,
      sortOrder,
      dueFilter,
      priorityFilters: priorityFilters.join(","),
      dayOfWeekFilters: dayOfWeekFilters.join(","),
      statusFilters: statusFilters.join(","),
      labelFilters: labelFilters.join(","),
      includeNoneLabel,
      assignedToFilter,
      minTaskCount,
      minStoryPoints,
      minTimeSpent,
      minTimeUnit,
      includeZeroMetrics,
      scheduledOnly,
      includeNoDueDate,
      comparisonMode,
    };
    if (comparisonMode && compStartDate && compEndDate) {
      params.compStartDate = compStartDate.toISOString();
      params.compEndDate = compEndDate.toISOString();
    }
    setSearchParams(params);
  }, [
    timeRangeType,
    taskType,
    chartType,
    xAxisField,
    yAxisMetric,
    sortOrder,
    dueFilter,
    priorityFilters,
    dayOfWeekFilters,
    statusFilters,
    labelFilters,
    includeNoneLabel,
    assignedToFilter,
    minTaskCount,
    minStoryPoints,
    minTimeSpent,
    minTimeUnit,
    scheduledOnly,
    includeZeroMetrics,
    includeNoDueDate,
    comparisonMode,
    compStartDate,
    compEndDate,
  ]);

  // effects for fetch tasks & columns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const userId = currentUser.uid;
        const res = await fetchTasks(userId);
        const tasksData = Array.isArray(res.data)
          ? res.data
          : res.data.tasks || [];
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

  useEffect(() => {
    const getLabels = async () => {
      try {
        const res = await fetchLabels(auth.currentUser.uid);
        setLabels(res.data);
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };
    if (auth.currentUser) getLabels();
  }, []);

  const statusOptions = Object.entries(columnsMapping).map(
    ([colId, colName]) => ({
      value: colId,
      label: colName,
    }),
  );

  // load preferences from backend
  useEffect(() => {
    const loadPreferences = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const res = await fetchChartPreferences(currentUser.uid);
          const prefs = res.data.chartPreferences;
          const params = Object.fromEntries([...searchParams]);

          if (!params.timeRangeType && prefs.timeRangeType)
            setTimeRangeType(prefs.timeRangeType);
          if (!params.taskType && prefs.taskType) setTaskType(prefs.taskType);
          if (!params.chartType && prefs.chartType)
            setChartType(prefs.chartType);
          if (!params.xAxisField && prefs.xAxisField)
            setXAxisField(prefs.xAxisField);
          if (!params.yAxisMetric && prefs.yAxisMetric)
            setYAxisMetric(prefs.yAxisMetric);
          if (!params.sortOrder && prefs.sortOrder)
            setSortOrder(prefs.sortOrder);
          if (!params.dueFilter && prefs.dueFilter)
            setDueFilter(prefs.dueFilter);
          if (!params.priorityFilters && prefs.priorityFilters)
            setPriorityFilters(prefs.priorityFilters);
          if (!params.dayOfWeekFilters && prefs.dayOfWeekFilters)
            setDayOfWeekFilters(prefs.dayOfWeekFilters);
          if (!params.statusFilters && prefs.statusFilters)
            setStatusFilters(prefs.statusFilters);
          if (!params.labelFilters && prefs.labelFilters)
            setLabelFilters(prefs.labelFilters);
          if (!params.includeNoneLabel && prefs.includeNoneLabel !== undefined)
            setIncludeNoneLabel(prefs.includeNoneLabel);
          if (!params.assignedToFilter && prefs.assignedToFilter)
            setAssignedToFilter(prefs.assignedToFilter);
          if (!params.minTaskCount && prefs.minTaskCount)
            setMinTaskCount(prefs.minTaskCount);
          if (!params.minStoryPoints && prefs.minStoryPoints)
            setMinStoryPoints(prefs.minStoryPoints);
          if (!params.minTimeSpent && prefs.minTimeSpent)
            setMinTimeSpent(prefs.minTimeSpent);
          if (!params.minTimeUnit && prefs.minTimeUnit)
            setMinTimeUnit(prefs.minTimeUnit);
          if (
            params.scheduledOnly === undefined &&
            prefs.scheduledOnly !== undefined
          )
            setScheduledOnly(prefs.scheduledOnly);
          if (
            params.includeZeroMetrics === undefined &&
            prefs.includeZeroMetrics !== undefined
          )
            setIncludeZeroMetrics(prefs.includeZeroMetrics);
          if (
            params.includeNoDueDate === undefined &&
            prefs.includeNoDueDate !== undefined
          )
            setIncludeNoDueDate(prefs.includeNoDueDate);
          if (
            params.comparisonMode === undefined &&
            prefs.comparisonMode !== undefined
          )
            setComparisonMode(prefs.comparisonMode);
          if (!params.compStartDate && prefs.compStartDate)
            setCompStartDate(new Date(prefs.compStartDate));
          if (!params.compEndDate && prefs.compEndDate)
            setCompEndDate(new Date(prefs.compEndDate));
          if (!params.customStartDate && prefs.customStartDate)
            setCustomStartDate(new Date(prefs.customStartDate));
          if (!params.customEndDate && prefs.customEndDate)
            setCustomEndDate(new Date(prefs.customEndDate));
        } catch (error) {
          console.error("Error loading preferences:", error);
        }
      }
      setPreferencesLoaded(true);
    };
    loadPreferences();
  }, [searchParams]);

  // update chart data
  useEffect(() => {
    const { startDate, endDate } = computeDateRange({
      timeRangeType,
      customStartDate,
      customEndDate,
      tasks,
    });
    if (!startDate || !endDate) {
      setChartData([]);
      return;
    }

    const filters = {
      taskType,
      dueFilter,
      includeNoDueDate,
      priorityFilters,
      dayOfWeekFilters,
      statusFilters,
      labelFilters,
      includeNoneLabel,
      assignedToFilter,
      minStoryPoints,
      minTimeSpent,
      minTimeUnit,
      scheduledOnly,
    };

    const mainFiltered = applyAllFilters(tasks, startDate, endDate, filters);
    let mainGrouped = groupTasks(mainFiltered, {
      xAxisField,
      columnsMapping,
      labels,
      dayOfWeekFilters,
      priorityFilters,
      statusFilters,
      labelFilters,
      includeNoneLabel,
      includeZeroMetrics,
      taskType,
    });

    if (!includeZeroMetrics) {
      mainGrouped = mainGrouped.filter((item) => item[yAxisMetric] > 0);
    }

    if (minTaskCount !== "" && !isNaN(parseInt(minTaskCount, 10))) {
      const minCount = parseInt(minTaskCount, 10);
      mainGrouped = mainGrouped.filter((item) => item.count >= minCount);
    }

    let newChartData;
    if (comparisonMode && compStartDate && compEndDate) {
      const compFiltered = applyAllFilters(
        tasks,
        compStartDate,
        compEndDate,
        filters,
      );
      let compGrouped = groupTasks(compFiltered, {
        xAxisField,
        columnsMapping,
        labels,
        dayOfWeekFilters,
        priorityFilters,
        statusFilters,
        labelFilters,
        includeNoneLabel,
        includeZeroMetrics,
        taskType,
      });
      if (!includeZeroMetrics) {
        compGrouped = compGrouped.filter((item) => item[yAxisMetric] > 0);
      }
      if (minTaskCount !== "" && !isNaN(parseInt(minTaskCount, 10))) {
        const minCount = parseInt(minTaskCount, 10);
        compGrouped = compGrouped.filter((item) => item.count >= minCount);
      }
      newChartData = mergeData(mainGrouped, compGrouped, yAxisMetric);
    } else {
      newChartData = mainGrouped.map((item) => {
        if (yAxisMetric === "timeSpent") {
          return { key: item.key, mainValue: item[yAxisMetric] / 3600 };
        }
        return { key: item.key, mainValue: item[yAxisMetric] };
      });
    }

    if (sortOrder === "asc") {
      newChartData.sort((a, b) => a.mainValue - b.mainValue);
    } else if (sortOrder === "desc") {
      newChartData.sort((a, b) => b.mainValue - a.mainValue);
    }

    setChartData(newChartData);
  }, [
    tasks,
    columnsMapping,
    timeRangeType,
    customStartDate,
    customEndDate,
    taskType,
    xAxisField,
    yAxisMetric,
    sortOrder,
    dueFilter,
    priorityFilters,
    dayOfWeekFilters,
    statusFilters,
    labelFilters,
    includeNoneLabel,
    assignedToFilter,
    minTaskCount,
    minStoryPoints,
    minTimeSpent,
    minTimeUnit,
    scheduledOnly,
    includeZeroMetrics,
    includeNoDueDate,
    comparisonMode,
    compStartDate,
    compEndDate,
  ]);

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

  // open/close task Modals
  useEffect(() => {
    if (location.pathname.includes("/viewtask/") && taskId) {
      const foundTask = tasks.find((t) => t._id === taskId);
      if (foundTask) {
        setSelectedTask(foundTask);
        setIsViewTaskModalOpen(true);
      }
    } else {
      setIsViewTaskModalOpen(false);
      setSelectedTask(null);
    }
  }, [location, taskId, tasks]);

  useEffect(() => {
    if (location.pathname.includes("/grouptasks") && groupKey) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [location.pathname, groupKey]);

  useEffect(() => {
    if (!modalOpen || !groupKey) return;
    const { startDate, endDate } = computeDateRange({
      timeRangeType,
      customStartDate,
      customEndDate,
      tasks,
    });

    const filters = {
      taskType,
      dueFilter,
      includeNoDueDate,
      priorityFilters,
      dayOfWeekFilters,
      statusFilters,
      labelFilters,
      includeNoneLabel,
      assignedToFilter,
      minStoryPoints,
      minTimeSpent,
      minTimeUnit,
      scheduledOnly,
    };

    const mainTasks = applyAllFilters(tasks, startDate, endDate, filters)
      .filter((task) => {
        if (xAxisField === "day") {
          const d = new Date(
            task.taskCompleted ? task.completedAt : task.createdAt,
          );
          return format(d, "EEEE") === groupKey;
        } else if (xAxisField === "priority") {
          return (task.priority || "None") === groupKey;
        } else if (xAxisField === "status") {
          const statusLabel = task.taskCompleted
            ? "Completed"
            : columnsMapping[task.status] || task.status;
          return statusLabel === groupKey;
        } else if (xAxisField === "label") {
          if (task.labels && task.labels.length > 0) {
            return task.labels.some((lbl) => lbl.title === groupKey);
          }
          return groupKey === "None";
        }
        return false;
      })
      .map((task) => ({ ...task, groupKey }));

    let compTasks = [];
    if (comparisonMode && compStartDate && compEndDate) {
      compTasks = applyAllFilters(tasks, compStartDate, compEndDate, filters)
        .filter((task) => {
          if (xAxisField === "day") {
            const d = new Date(
              task.taskCompleted ? task.completedAt : task.createdAt,
            );
            return format(d, "EEEE") === groupKey;
          } else if (xAxisField === "priority") {
            return (task.priority || "None") === groupKey;
          } else if (xAxisField === "status") {
            const statusLabel = task.taskCompleted
              ? "Completed"
              : columnsMapping[task.status] || task.status;
            return statusLabel === groupKey;
          } else if (xAxisField === "label") {
            if (task.labels && task.labels.length > 0) {
              return task.labels.some((lbl) => lbl.title === groupKey);
            }
            return groupKey === "None";
          }
          return false;
        })
        .map((task) => ({ ...task, groupKey }));
    }
    setSelectedMainGroupTasks(mainTasks);
    setSelectedCompGroupTasks(compTasks);
  }, [
    modalOpen,
    tasks,
    xAxisField,
    columnsMapping,
    comparisonMode,
    compStartDate,
    compEndDate,
    groupKey,
    customStartDate,
    customEndDate,
    timeRangeType,
    taskType,
    dueFilter,
    includeNoDueDate,
    priorityFilters,
    dayOfWeekFilters,
    statusFilters,
    labelFilters,
    includeNoneLabel,
    assignedToFilter,
    minStoryPoints,
    minTimeSpent,
    minTimeUnit,
    scheduledOnly,
  ]);

  useEffect(() => {
    if (userClosedModal && location.pathname.includes("/grouptasks")) {
      navigate(`/charts${location.search}`);
      setUserClosedModal(false);
    }
  }, [userClosedModal, location.pathname, location.search, navigate]);

  const handleChartClick = (data) => {
    if (!data || !data.payload) return;
    const clickedKey = data.payload.key;
    const { startDate, endDate } = computeDateRange({
      timeRangeType,
      customStartDate,
      customEndDate,
      tasks,
    });
    const filters = {
      taskType,
      dueFilter,
      includeNoDueDate,
      priorityFilters,
      dayOfWeekFilters,
      statusFilters,
      labelFilters,
      includeNoneLabel,
      assignedToFilter,
      minStoryPoints,
      minTimeSpent,
      minTimeUnit,
      scheduledOnly,
    };

    const mainTasks = applyAllFilters(tasks, startDate, endDate, filters)
      .filter((task) => {
        if (xAxisField === "day") {
          const d = new Date(
            task.taskCompleted ? task.completedAt : task.createdAt,
          );
          return format(d, "EEEE") === clickedKey;
        } else if (xAxisField === "priority") {
          return (task.priority || "None") === clickedKey;
        } else if (xAxisField === "status") {
          const statusLabel = task.taskCompleted
            ? "Completed"
            : columnsMapping[task.status] || task.status;
          return statusLabel === clickedKey;
        } else if (xAxisField === "label") {
          if (task.labels && task.labels.length > 0) {
            return task.labels.some((lbl) => lbl.title === clickedKey);
          }
          return clickedKey === "None";
        }
        return false;
      })
      .map((task) => ({ ...task, groupKey: clickedKey }));

    let compTasks = [];
    if (comparisonMode && compStartDate && compEndDate) {
      compTasks = applyAllFilters(tasks, compStartDate, compEndDate, filters)
        .filter((task) => {
          if (xAxisField === "day") {
            const d = new Date(
              task.taskCompleted ? task.completedAt : task.createdAt,
            );
            return format(d, "EEEE") === clickedKey;
          } else if (xAxisField === "priority") {
            return (task.priority || "None") === clickedKey;
          } else if (xAxisField === "status") {
            const statusLabel = task.taskCompleted
              ? "Completed"
              : columnsMapping[task.status] || task.status;
            return statusLabel === clickedKey;
          } else if (xAxisField === "label") {
            if (task.labels && task.labels.length > 0) {
              return task.labels.some((lbl) => lbl.title === clickedKey);
            }
            return clickedKey === "None";
          }
          return false;
        })
        .map((task) => ({ ...task, groupKey: clickedKey }));
    }

    setSelectedMainGroupTasks(mainTasks);
    setSelectedCompGroupTasks(compTasks);
    setModalOpen(true);
    navigate(`/charts/grouptasks/${clickedKey}${location.search}`);
  };

  const openReadOnlyViewTaskModal = (task) => {
    setSelectedTask(task);
    setIsViewTaskModalOpen(true);
    if (location.pathname.includes("/grouptasks") && groupKey) {
      navigate(
        `/charts/grouptasks/${groupKey}/viewtask/${task._id}${location.search}`,
      );
    } else {
      navigate(`/charts/viewtask/${task._id}${location.search}`);
    }
  };

  const closeViewTaskModal = () => {
    setSelectedTask(null);
    setIsViewTaskModalOpen(false);
    if (location.pathname.includes("/grouptasks")) {
      navigate(`/charts/grouptasks/${groupKey}${location.search}`);
    } else {
      navigate(`/charts${location.search}`);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaveDisabled(true);
    await saveUserPreferences();
    setTimeout(() => {
      setIsSaveDisabled(false);
    }, 1000);
  };

  const handleResetPreferences = async () => {
    setIsDefaultDisabled(true);
    await resetUserPreferences();
    setTimeout(() => {
      setIsDefaultDisabled(false);
    }, 1000);
  };

  const saveUserPreferences = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const prefs = {
      timeRangeType,
      customStartDate: customStartDate ? customStartDate.toISOString() : null,
      customEndDate: customEndDate ? customEndDate.toISOString() : null,
      taskType,
      chartType,
      xAxisField,
      yAxisMetric,
      sortOrder,
      dueFilter,
      priorityFilters,
      dayOfWeekFilters,
      statusFilters,
      labelFilters,
      includeNoneLabel,
      assignedToFilter,
      minTaskCount,
      minStoryPoints,
      minTimeSpent,
      minTimeUnit,
      scheduledOnly,
      includeZeroMetrics,
      includeNoDueDate,
      comparisonMode,
      compStartDate: compStartDate ? compStartDate.toISOString() : null,
      compEndDate: compEndDate ? compEndDate.toISOString() : null,
    };
    try {
      await updateChartPreferences(currentUser.uid, prefs);
      toast.success("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Error saving preferences!");
    }
  };

  const resetUserPreferences = async () => {
    setTimeRangeType(defaultFilterSettings.timeRangeType);
    setCustomStartDate(defaultFilterSettings.customStartDate);
    setCustomEndDate(defaultFilterSettings.customEndDate);
    setTaskType(defaultFilterSettings.taskType);
    setChartType(defaultFilterSettings.chartType);
    setXAxisField(defaultFilterSettings.xAxisField);
    setYAxisMetric(defaultFilterSettings.yAxisMetric);
    setSortOrder(defaultFilterSettings.sortOrder);
    setDueFilter(defaultFilterSettings.dueFilter);
    setPriorityFilters(defaultFilterSettings.priorityFilters);
    setDayOfWeekFilters(defaultFilterSettings.dayOfWeekFilters);
    setStatusFilters(defaultFilterSettings.statusFilters);
    setLabelFilters(defaultFilterSettings.labelFilters);
    setIncludeNoneLabel(defaultFilterSettings.includeNoneLabel);
    setAssignedToFilter(defaultFilterSettings.assignedToFilter);
    setMinTaskCount(defaultFilterSettings.minTaskCount);
    setMinStoryPoints(defaultFilterSettings.minStoryPoints);
    setMinTimeSpent(defaultFilterSettings.minTimeSpent);
    setMinTimeUnit(defaultFilterSettings.minTimeUnit);
    setScheduledOnly(defaultFilterSettings.scheduledOnly);
    setIncludeZeroMetrics(defaultFilterSettings.includeZeroMetrics);
    setIncludeNoDueDate(defaultFilterSettings.includeNoDueDate);
    setComparisonMode(defaultFilterSettings.comparisonMode);
    setCompStartDate(defaultFilterSettings.compStartDate);
    setCompEndDate(defaultFilterSettings.compEndDate);

    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await updateChartPreferences(currentUser.uid, defaultFilterSettings);
      toast.success("Preferences reset to default!");
    } catch (error) {
      console.error("Error resetting preferences:", error);
      toast.error("Error resetting preferences!");
    }
  };

  const closeGroupTasksModal = () => {
    setModalOpen(false);
    setUserClosedModal(true);
  };

  const tooltipFormatter = (value) =>
    yAxisMetric === "timeSpent" ? `${value.toFixed(2)}h` : value.toFixed(0);

  const axisFormatter = (value) =>
    yAxisMetric === "timeSpent" ? `${value.toFixed(2)}h` : value.toFixed(0);

  const axisWordLimit = (value) => {
    const limit = 20;
    if (typeof value !== "string") return "";
    return value.length < limit ? value : `${value.substring(0, limit)}...`;
  };

  const renderChart = () => {
    if (loading) return <p>Loading...</p>;
    if (!chartData || chartData.length === 0)
      return <p>No data available for the selected time range.</p>;
    const hasComparison = comparisonMode && compStartDate && compEndDate;

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <AreaChart
            data={chartData}
            onClick={(e) => {
              if (
                e &&
                e.activePayload &&
                e.activePayload.length > 0 &&
                e.activePayload[0].payload
              ) {
                handleChartClick({ payload: e.activePayload[0].payload });
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="key"
              tick={{ fill: "white" }}
              tickFormatter={axisWordLimit}
            />
            <YAxis tick={{ fill: "white" }} tickFormatter={axisFormatter} />
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
            <Area
              type="monotone"
              dataKey="mainValue"
              stroke="#446688"
              fill="#446688"
              name="Main Range"
              dot={false}
            />
            {hasComparison && (
              <Area
                type="monotone"
                dataKey="compValue"
                stroke="#FF8042"
                fill="#FF8042"
                name="Comparison Range"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={chartData}
            onClick={(e) => {
              if (
                e &&
                e.activePayload &&
                e.activePayload.length > 0 &&
                e.activePayload[0].payload
              ) {
                handleChartClick({ payload: e.activePayload[0].payload });
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="key"
              tick={{ fill: "white" }}
              tickFormatter={axisWordLimit}
            />
            <YAxis tick={{ fill: "white" }} tickFormatter={axisFormatter} />
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
            <Bar dataKey="mainValue" fill="#446688" name="Main Range" />
            {hasComparison && (
              <Bar dataKey="compValue" fill="#FF8042" name="Comparison Range" />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={chartData}
            onClick={(e) => {
              if (
                e &&
                e.activePayload &&
                e.activePayload.length > 0 &&
                e.activePayload[0].payload
              ) {
                handleChartClick({ payload: e.activePayload[0].payload });
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="key"
              tick={{ fill: "white" }}
              tickFormatter={axisWordLimit}
            />
            <YAxis tick={{ fill: "white" }} tickFormatter={axisFormatter} />
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
              dot={false}
            />
            {hasComparison && (
              <Line
                type="monotone"
                dataKey="compValue"
                stroke="#FF8042"
                name="Comparison Range"
                strokeWidth={3}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "pie") {
      if (hasComparison) {
        return <p>Comparison not supported for this chart type.</p>;
      }
      const total = chartData.reduce((acc, item) => acc + item.mainValue, 0);
      return (
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="mainValue"
              nameKey="key"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              fill="#446688"
              label={(entry) => {
                const percentage = total > 0 ? (entry.value / total) * 100 : 0;
                return yAxisMetric === "timeSpent"
                  ? `${entry.value.toFixed(2)}h (${percentage.toFixed(2)}%)`
                  : `${entry.value.toFixed(0)} (${percentage.toFixed(2)}%)`;
              }}
              onClick={handleChartClick}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend formatter={(value) => axisWordLimit(value)} />
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
    } else if (chartType === "radar") {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart
            data={chartData}
            onClick={(e) => {
              if (e.activeLabel) {
                const dataPoint = chartData.find(
                  (d) => d.key === e.activeLabel,
                );
                if (dataPoint) {
                  handleChartClick({ payload: dataPoint });
                }
              }
            }}
          >
            <PolarGrid strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="key"
              tick={{ fill: "var(--text-color)" }}
              tickFormatter={axisWordLimit}
            />
            <PolarRadiusAxis
              tick={{ fill: "var(--text-color)" }}
              tickFormatter={(value) =>
                yAxisMetric === "timeSpent"
                  ? `${value.toFixed(2)}h`
                  : value.toFixed(0)
              }
            />
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
            <Radar
              name="Main Range"
              dataKey="mainValue"
              stroke="#446688"
              fill="#446688"
              fillOpacity={0.6}
            />
            {hasComparison && (
              <Radar
                name="Comparison Range"
                dataKey="compValue"
                stroke="#FF8042"
                fill="#FF8042"
                fillOpacity={0.6}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      );
    }
    return <p>Comparison not supported for this chart type.</p>;
  };

  if (!preferencesLoaded) {
    return <div>Loading preferences...</div>;
  }

  // render
  return (
    <Layout>
      <TopBar
        buttons={getChartsTopBarConfig(setChartType)}
        openModal={() => {}}
        navigate={navigate}
        activeChartType={chartType}
      />
      <h1 className="page-title">Charts</h1>
      <div className="charts-page">
        <div className="charts-container">
          <div className="charts-left">
            <div className="filters-card">
              {/* Filter UI */}
              <div className="filter-group">
                <label htmlFor="time-range-select">Time Range</label>
                <select
                  id="time-range-select"
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
                  <label htmlFor="custom-start-date">Start Date</label>
                  <DatePicker
                    id="custom-start-date"
                    selected={customStartDate}
                    onChange={(date) => setCustomStartDate(date)}
                    dateFormat="d MMMM, yyyy"
                    placeholderText="Select start date"
                    disabledKeyboardNavigation
                  />
                  <label htmlFor="custom-end-date">End Date</label>
                  <DatePicker
                    id="custom-end-date"
                    selected={customEndDate}
                    onChange={(date) => setCustomEndDate(date)}
                    dateFormat="d MMMM, yyyy"
                    placeholderText="Select end date"
                    disabledKeyboardNavigation
                  />
                </div>
              )}
              <div className="filter-group">
                <label htmlFor="task-type-select">Task Type</label>
                <select
                  id="task-type-select"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  <option value="active">Active (In Boards)</option>
                  <option value="completed">Completed</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="x-axis-field-select">X-Axis Field</label>
                <select
                  id="x-axis-field-select"
                  value={xAxisField}
                  onChange={(e) => setXAxisField(e.target.value)}
                >
                  <option value="day">Day</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="label">Label</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="y-axis-metric-select">Y-Axis Metric</label>
                <select
                  id="y-axis-metric-select"
                  value={yAxisMetric}
                  onChange={(e) => setYAxisMetric(e.target.value)}
                >
                  <option value="count">Task Count</option>
                  <option value="timeSpent">Time Spent</option>
                  <option value="storyPoints">Story Points</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="sort-order-select">Sort By</label>
                <select
                  id="sort-order-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
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
                    <label htmlFor="due-filter-select">Due Date</label>
                    <select
                      id="due-filter-select"
                      value={dueFilter}
                      onChange={(e) => setDueFilter(e.target.value)}
                    >
                      <option value="both">Both</option>
                      <option value="due">Due</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <MultiSelectDropdown
                      fallbackText="All"
                      label="Priority"
                      options={allowedPriorities.map((p) => ({
                        value: p,
                        label: p,
                      }))}
                      selectedOptions={priorityFilters}
                      onChange={setPriorityFilters}
                    />
                  </div>
                  <div className="filter-group">
                    <MultiSelectDropdown
                      fallbackText="All"
                      label="Day of the Week"
                      options={dayOptions.map((d) => ({
                        value: d,
                        label: d,
                      }))}
                      selectedOptions={dayOfWeekFilters}
                      onChange={setDayOfWeekFilters}
                    />
                  </div>
                  <div className="filter-group">
                    <MultiSelectDropdown
                      fallbackText="All"
                      label="Status"
                      options={statusOptions}
                      selectedOptions={statusFilters}
                      onChange={setStatusFilters}
                    />
                  </div>

                  <div className="filter-group">
                    <MultiSelectDropdown
                      fallbackText="All"
                      label="Label"
                      options={labels.map((l) => ({
                        value: l.title,
                        label: (
                          <div className="label-option-wrapper">
                            <span
                              className="label-color-box"
                              style={{ backgroundColor: l.color }}
                            />
                            <span>{l.title}</span>
                          </div>
                        ),
                      }))}
                      selectedOptions={labelFilters}
                      onChange={setLabelFilters}
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="include-none-label">
                      Include None Label
                    </label>
                    <input
                      id="include-none-label"
                      type="checkbox"
                      checked={includeNoneLabel}
                      onChange={(e) => setIncludeNoneLabel(e.target.checked)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="assigned-to-filter">Assigned To</label>
                    <input
                      id="assigned-to-filter"
                      type="text"
                      placeholder="Filter by assignee"
                      value={assignedToFilter}
                      onChange={(e) => setAssignedToFilter(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="min-task-count">Minimum Task Count</label>
                    <input
                      id="min-task-count"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minTaskCount}
                      onChange={(e) => setMinTaskCount(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="min-story-points">
                      Minimum Story Points
                    </label>
                    <input
                      id="min-story-points"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minStoryPoints}
                      onChange={(e) => setMinStoryPoints(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="min-time-spent">Minimum Time Spent</label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        id="min-time-spent"
                        type="number"
                        min="0"
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
                    <label htmlFor="scheduled-only">Scheduled Only</label>
                    <input
                      id="scheduled-only"
                      type="checkbox"
                      checked={scheduledOnly}
                      onChange={(e) => setScheduledOnly(e.target.checked)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="include-zero-metrics">
                      Include Zero Metrics
                    </label>
                    <input
                      id="include-zero-metrics"
                      type="checkbox"
                      checked={includeZeroMetrics}
                      onChange={(e) => setIncludeZeroMetrics(e.target.checked)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="include-no-due-date">
                      Include Tasks Without Due Date
                    </label>
                    <input
                      id="include-no-due-date"
                      type="checkbox"
                      checked={includeNoDueDate}
                      onChange={(e) => setIncludeNoDueDate(e.target.checked)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="comparison-mode">Comparison Mode</label>
                    <input
                      id="comparison-mode"
                      type="checkbox"
                      checked={comparisonMode}
                      onChange={(e) => setComparisonMode(e.target.checked)}
                    />
                  </div>
                  {comparisonMode && (
                    <div className="comparison-range">
                      <div className="filter-group">
                        <label htmlFor="comp-start-date">
                          Comparison Start Date
                        </label>
                        <DatePicker
                          id="comp-start-date"
                          selected={compStartDate}
                          onChange={(date) => setCompStartDate(date)}
                          dateFormat="d MMMM, yyyy"
                          placeholderText="Select start date"
                          disabledKeyboardNavigation
                        />
                      </div>
                      <div className="filter-group">
                        <label htmlFor="comp-end-date">
                          Comparison End Date
                        </label>
                        <DatePicker
                          id="comp-end-date"
                          selected={compEndDate}
                          onChange={(date) => setCompEndDate(date)}
                          dateFormat="d MMMM, yyyy"
                          placeholderText="Select end date"
                          disabledKeyboardNavigation
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="preferences-buttons">
                <button
                  onClick={handleSavePreferences}
                  className="save-btn"
                  disabled={isSaveDisabled}
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleResetPreferences}
                  className="reset-btn"
                  disabled={isDefaultDisabled}
                >
                  Default Preferences
                </button>
              </div>
            </div>
          </div>
          <div className="charts-right">{renderChart()}</div>
        </div>
      </div>

      <GroupTasksModal
        modalOpen={modalOpen}
        setModalOpen={closeGroupTasksModal}
        mainGroupTasks={selectedMainGroupTasks}
        compGroupTasks={selectedCompGroupTasks}
        openReadOnlyViewTaskModal={openReadOnlyViewTaskModal}
        comparisonMode={comparisonMode}
        selectedGroup={groupKey}
        userSettings={userSettings}
      />
      {isViewTaskModalOpen && (
        <ViewTaskModal
          isModalOpen={isViewTaskModalOpen}
          closeModal={closeViewTaskModal}
          task={selectedTask}
          handleUpdateTask={() => {}}
          columns={columnsMapping}
          startTimer={() => {}}
          stopTimer={() => {}}
          readOnly={true}
          userSettings={userSettings}
        />
      )}
    </Layout>
  );
};

export default Charts;
