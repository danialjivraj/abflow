import React from "react";
import TaskCard from "./Dashboard/TaskCard";

const GroupTasksModal = ({
  modalOpen,
  setModalOpen,
  mainGroupTasks,
  compGroupTasks,
  openReadOnlyViewTaskModal,
}) => {
  if (!modalOpen) return null;

  // Use the groupKey from the main tasks if available, otherwise check comparison tasks,
  // and fall back to "(group)" if none is found.
  const groupKey =
    mainGroupTasks.length > 0
      ? mainGroupTasks[0].groupKey || "(group)"
      : compGroupTasks.length > 0
      ? compGroupTasks[0].groupKey || "(group)"
      : "(group)";

  return (
    <div className="modal-overlay" onClick={() => setModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={() => setModalOpen(false)}>
          &times;
        </button>
        <h2>Tasks for Group: {groupKey}</h2>

        <div className="modal-task-list">
          <div className="main-tasks-section">
            <h3>Main Range</h3>
            {mainGroupTasks.length > 0 ? (
              mainGroupTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openReadOnlyViewTaskModal(task);
                  }}
                >
                  <TaskCard
                    task={task}
                    draggable={false}
                    currentTime={new Date()}
                    setIsTaskHovered={() => {}}
                    setIsTaskDropdownOpen={() => {}}
                    openViewTaskModal={() => {}}
                  />
                </div>
              ))
            ) : (
              <p>No tasks for this group in Main Range.</p>
            )}
          </div>

          <div className="comparison-tasks-section">
            <h3>Comparison Range</h3>
            {compGroupTasks.length > 0 ? (
              compGroupTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openReadOnlyViewTaskModal(task);
                  }}
                >
                  <TaskCard
                    task={task}
                    draggable={false}
                    currentTime={new Date()}
                    setIsTaskHovered={() => {}}
                    setIsTaskDropdownOpen={() => {}}
                    openViewTaskModal={() => {}}
                  />
                </div>
              ))
            ) : (
              <p>No tasks for this group in Comparison Range.</p>
            )}
          </div>
        </div>

        <button className="view-cancel-btn" onClick={() => setModalOpen(false)}>
          Close
        </button>
      </div>
    </div>
  );
};

export default GroupTasksModal;
