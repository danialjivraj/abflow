import React from "react";
import TaskCard from "../boardComponents/TaskCard";

const GroupTasksModal = ({
  modalOpen,
  setModalOpen,
  mainGroupTasks,
  compGroupTasks,
  openReadOnlyViewTaskModal,
  comparisonMode,
  selectedGroup,
}) => {
  if (!modalOpen) return null;

  const groupKey =
    mainGroupTasks.length > 0
      ? mainGroupTasks[0].groupKey
      : compGroupTasks.length > 0
      ? compGroupTasks[0].groupKey
      : selectedGroup;

  return (
    <div className="modal-overlay" onClick={() => setModalOpen(false)}>
      <div className="modal-container">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal" onClick={() => setModalOpen(false)}>
            &times;
          </button>
          <h2>
            Tasks for Group: <span className="group-key-text">{groupKey}</span>
          </h2>
          <div className="group-modal-task-list">
            {/* Main Range always shown */}
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
                      hideDots={true}
                    />
                  </div>
                ))
              ) : (
                <p>No tasks for this group in Main Range.</p>
              )}
            </div>

            {/* Only show Comparison Range if comparisonMode is ON */}
            {comparisonMode && (
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
            )}
          </div>
          <button className="view-cancel-btn" onClick={() => setModalOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupTasksModal;
