import { useRef, useEffect, useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import { renameBoard, deleteBoard } from "../../services/columnsService";
import { auth } from "../../firebase";
import { validateColumnName } from "../../utils/boardValidation";
import { toast } from "react-toastify";
import { FaCheck, FaTimes } from "react-icons/fa";

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
  handleCompleteTask,
  renameBoardError,
  setRenameBoardError,
  onBoardRename,
  onBoardDelete,
  columns,
  confirmBeforeDeleteBoard = true,
  confirmBeforeDeleteTask,
  openCreateTaskModal,
  duplicateTask,
  availableLabels,
  userSettings,
}) => {
  const columnDropdownRef = useRef(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleRename = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await renameBoard(user.uid, columnId, newBoardName);
      onBoardRename(columnId, newBoardName);
      setNewBoardName("");
      setRenamingColumnId(null);
      setIsDropdownOpen(null);
      setRenameBoardError("");
    } catch (error) {
      console.error("Error renaming board:", error);
      const backendError = error.response?.data?.error;
      const frontendError = validateColumnName(newBoardName, columns, columnId);
      setRenameBoardError(
        backendError || frontendError || "Failed to rename board",
      );
    }
  };

  const handleDelete = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await deleteBoard(user.uid, columnId);
      onBoardDelete(columnId);
      setIsDropdownOpen(null);
      toast.success("Board deleted!");
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Failed to delete board!");
    }
  };

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
    <>
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
                    onChange={(e) => {
                      setNewBoardName(e.target.value);
                      setRenameBoardError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRename();
                      }
                    }}
                    autoFocus
                  />
                  {renameBoardError && (
                    <div className="board-name-taken-error-message">
                      {renameBoardError}
                    </div>
                  )}
                  <div className="button-container">
                    <button className="tick-btn" onClick={handleRename}>
                      <FaCheck
                        className="icon icon-check"
                        data-testid="tick-icon"
                      />
                    </button>
                    <button
                      className="cross-btn"
                      onClick={() => {
                        setRenamingColumnId(null);
                        setNewBoardName("");
                        setRenameBoardError("");
                      }}
                    >
                      <FaTimes
                        className="icon icon-cross"
                        data-testid="cross-icon"
                      />
                    </button>
                  </div>
                </div>
              ) : (
                <h2>{columnData.name}</h2>
              )}
              <div className="column-actions">
                <button
                  className={`dots-button ${isDropdownOpen === columnId ? "active dropdown-active" : ""}`}
                  onClick={() =>
                    setIsDropdownOpen(
                      isDropdownOpen === columnId ? null : columnId,
                    )
                  }
                >
                  &#8942;
                </button>
                {isDropdownOpen === columnId && (
                  <div className="dropdown-menu open" ref={columnDropdownRef}>
                    <button
                      onClick={() => {
                        setRenamingColumnId(columnId);
                        setNewBoardName(columnData.name);
                        setRenameBoardError("");
                        setIsDropdownOpen(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        if (!confirmBeforeDeleteBoard) {
                          handleDelete();
                        } else {
                          setIsDeleteModalOpen(true);
                        }
                      }}
                    >
                      Delete
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
                      deleteTask={deleteTask}
                      startTimer={startTimer}
                      stopTimer={stopTimer}
                      openViewTaskModal={openViewTaskModal}
                      handleCompleteTask={handleCompleteTask}
                      confirmBeforeDeleteTask={confirmBeforeDeleteTask}
                      duplicateTask={duplicateTask}
                      availableLabels={availableLabels}
                      userSettings={userSettings}
                    />
                  ))}
                  {provided.placeholder}
                  <div className="add-task-button-container">
                    <button
                      className="add-task-btn column-add-task-btn"
                      onClick={() => openCreateTaskModal(columnId)}
                    >
                      <span className="column-thick-plus">+</span>
                      <span className="create-task-text">Create Task</span>
                    </button>
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        )}
      </Draggable>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete();
          setIsDeleteModalOpen(false);
        }}
        entityType="column"
        entityName={columnData.name}
        hasTasks={columnData.items && columnData.items.length > 0}
      />
    </>
  );
};

export default Column;
