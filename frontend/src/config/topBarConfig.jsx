import { 
  FiGrid, 
  FiCalendar, 
  FiCheckSquare, 
  FiBarChart2, 
  FiPieChart,
  FiTag,
} from "react-icons/fi";
import { RiPentagonLine } from "react-icons/ri";
import { FaSun, FaMoon, FaChartLine, FaChartArea } from "react-icons/fa";

export const getDashboardTopBarConfig = (openModal, openLabelsModal, navigate) => [
  {
    label: "Boards",
    path: "/dashboard/boards",
    onClick: () => navigate("/dashboard/boards"),
    className: "top-bar-button boards-btn",
    icon: <FiGrid size={18} />,
  },
  {
    label: "Schedule",
    path: "/dashboard/schedule",
    onClick: () => navigate("/dashboard/schedule"),
    className: "top-bar-button schedule-btn",
    icon: <FiCalendar size={18} />,
  },
  {
    label: "Completed Tasks",
    path: "/dashboard/completedtasks",
    onClick: () => navigate("/dashboard/completedtasks"),
    className: "top-bar-button completed-tasks-btn",
    icon: <FiCheckSquare size={18} />,
  },
  {
    label: "Labels",
    onClick: () => openLabelsModal(),
    className: "create-top-bar-task-btn",
    icon: <FiTag size={18} />,
  },
  {
    label: "Create Task",
    onClick: () => openModal(),
    className: "create-top-bar-task-btn",
  },
];

export const getChartsTopBarConfig = (setChartType) => [
  {
    label: "Bar",
    value: "bar",
    onClick: () => setChartType("bar"),
    className: "top-bar-button",
    icon: <FiBarChart2 size={18} />,
  },
  {
    label: "Line",
    value: "line",
    onClick: () => setChartType("line"),
    className: "top-bar-button",
    icon: <FaChartLine size={18} />,
  },
  {
    label: "Pie",
    value: "pie",
    onClick: () => setChartType("pie"),
    className: "top-bar-button",
    icon: <FiPieChart size={18} />,
  },
  {
    label: "Area",
    value: "area",
    onClick: () => setChartType("area"),
    className: "top-bar-button",
    icon: <FaChartArea size={18} />,
  },
  {
    label: "Radar",
    value: "radar",
    onClick: () => setChartType("radar"),
    className: "top-bar-button",
    icon: <RiPentagonLine size={18} />,
  },
];

export const getProfileTopBarConfig = () => [
];

export const getSettingsTopBarConfig = (toggleDarkMode, isDarkMode) => [
  {
    type: "custom",
    render: () => (
      <div className="dark-mode-toggle-container" onClick={toggleDarkMode}>
        <div className={`toggle-wrapper ${isDarkMode ? "dark" : "light"}`}>
          <div className="toggle-thumb">
            {isDarkMode ? (
              <FaMoon className="toggle-icon" />
            ) : (
              <FaSun className="toggle-icon" />
            )}
          </div>
        </div>
      </div>
    ),
  },
];
