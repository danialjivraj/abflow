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
  "/stats": [],
  "/profile": [],
};
