export const getDashboardTopBarConfig = (openModal, navigate) => [
  {
    label: "Boards",
    path: "/dashboard/boards",
    onClick: () => navigate("/dashboard/boards"),
    className: "top-bar-button boards-btn",
  },
  {
    label: "Schedule",
    path: "/dashboard/schedule",
    onClick: () => navigate("/dashboard/schedule"),
    className: "top-bar-button schedule-btn",
  },
  {
    label: "Completed Tasks",
    path: "/dashboard/completedtasks",
    onClick: () => navigate("/dashboard/completedtasks"),
    className: "top-bar-button completed-tasks-btn",
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
  },
  {
    label: "Line",
    value: "line",
    onClick: () => setChartType("line"),
    className: "top-bar-button",
  },
  {
    label: "Pie",
    value: "pie",
    onClick: () => setChartType("pie"),
    className: "top-bar-button",
  },
  {
    label: "Area",
    value: "area",
    onClick: () => setChartType("area"),
    className: "top-bar-button",
  },
  {
    label: "Radar",
    value: "radar",
    onClick: () => setChartType("radar"),
    className: "top-bar-button",
  },
];

export const getProfileTopBarConfig = (openModal, navigate) => [
];