export const topBarConfig = {
  "/dashboard": [
    {
      label: "Boards",
      onClick: (_, navigate) => navigate("/dashboard/boards"),
      className: "top-bar-button boards-btn",
    },
    {
      label: "Schedule",
      onClick: (_, navigate) => navigate("/dashboard/schedule"),
      className: "top-bar-button schedule-btn",
    },
    {
      label: "Completed Tasks",
      onClick: (_, navigate) => navigate("/dashboard/completedtasks"),
      className: "top-bar-button completed-tasks-btn",
    },
    {
      label: "Create Task",
      onClick: (openModal) => openModal(),
      className: "create-top-bar-task-btn",
    },
  ],
  "/profile": [],
  "/stats": [],
};

export const getTopBarConfig = (setChartType) => ({
  "/stats": [
    { label: "Bar", value: "bar", onClick: (_, navigate) => setChartType("bar"), className: "top-bar-button" },
    { label: "Line", value: "line", onClick: (_, navigate) => setChartType("line"), className: "top-bar-button" },
    { label: "Pie", value: "pie", onClick: (_, navigate) => setChartType("pie"), className: "top-bar-button" },
    { label: "Area", value: "area", onClick: (_, navigate) => setChartType("area"), className: "top-bar-button" },
    { label: "Radar", value: "radar", onClick: (_, navigate) => setChartType("radar"), className: "top-bar-button" },
  ],
});
