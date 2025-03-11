import React, { useRef, useEffect } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";

const Column = ({
  columnId,
  columnData,
  index,
  renamingColumnId,
  newBoardName,
  setNewBoardName,
  setRenamingColumnId,
  isDropdownOpen,
  setIsDropdownOpen,
  deleteBoard,
  renameBoard,
  isTaskDropdownOpen,
  setIsTaskDropdownOpen,
  formatDueDate,
  currentTime,
  isTaskHovered,
  setIsTaskHovered,
  deleteTask,
  startTimer,
  stopTimer,
  openViewTaskModal,
  handleCompleteTask
}) => {
  const columnDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target)
      ) {
        if (isDropdownOpen === columnId) {
          setIsDropdownOpen(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, setIsDropdownOpen, columnId]);

  return (
    <Draggable draggableId={columnId} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="kanban-column"
        >
          <div className="column-header" {...provided.dragHandleProps}>
            {renamingColumnId === columnId ? (
              <div className="rename-board-wrapper">
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  autoFocus
                />
                <div className="button-container">
                  <button
                    className="tick-btn"
                    onClick={() => renameBoard(columnId, newBoardName)}
                  >
                    ✔️
                  </button>
                  <button
                    className="cross-btn"
                    onClick={() => setRenamingColumnId(null)}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ) : (
              <h2>{columnData.name}</h2>
            )}
            <div className="column-actions">
              <button
                className={`dots-button ${
                  isDropdownOpen === columnId ? "active dropdown-active" : ""
                }`}
                onClick={() =>
                  setIsDropdownOpen(isDropdownOpen === columnId ? null : columnId)
                }
              >
                &#8942;
              </button>
              {isDropdownOpen === columnId && (
                <div className="dropdown-menu open" ref={columnDropdownRef}>
                  <button onClick={() => deleteBoard(columnId)}>Delete</button>
                  <button
                    onClick={() => {
                      setRenamingColumnId(columnId);
                      setNewBoardName(columnData.name);
                      setIsDropdownOpen(null);
                    }}
                  >
                    Rename
                  </button>
                </div>
              )}
            </div>
          </div>
          <Droppable droppableId={columnId} type="TASK">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="droppable-area"
              >
                {columnData.items.map((task, index) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    formatDueDate={formatDueDate}
                    currentTime={currentTime}
                    isTaskHovered={isTaskHovered}
                    setIsTaskHovered={setIsTaskHovered}
                    isTaskDropdownOpen={isTaskDropdownOpen}
                    setIsTaskDropdownOpen={setIsTaskDropdownOpen}
                    // Remove dropdownRef prop from TaskCard
                    deleteTask={deleteTask}
                    startTimer={startTimer}
                    stopTimer={stopTimer}
                    openViewTaskModal={openViewTaskModal}
                    handleCompleteTask={handleCompleteTask}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
};

export default Column;
