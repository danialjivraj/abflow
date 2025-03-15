import React from "react";
import TaskCard from "./Dashboard/TaskCard";

const GroupTasksModal = ({
  modalOpen,
  setModalOpen,
  selectedGroupTasks,
  openReadOnlyViewTaskModal,
}) => {
  if (!modalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>
          Tasks for Group:{" "}
          {selectedGroupTasks.length > 0
            ? selectedGroupTasks[0].groupKey || "(group)"
            : ""}
        </h2>

        <div className="modal-task-list">
          {selectedGroupTasks.map((task) => (
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
          ))}
        </div>

        <button className="view-cancel-btn" onClick={() => setModalOpen(false)}>Close</button>
      </div>
    </div>
  );
};

export default GroupTasksModal;