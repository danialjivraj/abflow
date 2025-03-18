import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import TiptapEditor from "../TiptapEditor";
import "react-datepicker/dist/react-datepicker.css";

const allowedPriorities = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"];

const CreateTaskModal = ({
  isModalOpen,
  closeModal,
  columns,
  columnsLoaded,
  newTaskTitle,
  setNewTaskTitle,
  selectedPriority,
  setSelectedPriority,
  selectedStatus,
  setSelectedStatus,
  dueDate,
  setDueDate,
  assignedTo,
  setAssignedTo,
  taskDescription,
  setTaskDescription,
  handleCreateTask,
  errorMessage,
  dueDateWarning,
  setDueDateWarning,
  storyPoints,
  setStoryPoints,
  newBoardCreateName,
  setNewBoardCreateName,
  handleCreateBoard,
  createBoardError,
}) => {
  const [localSelectedStatus, setLocalSelectedStatus] = useState(selectedStatus);

  const defaultStatus = Object.keys(columns)[0] || "";

  useEffect(() => {
    if (isModalOpen) {
      const hasBoards = Object.keys(columns).length > 0;
      if (hasBoards && !localSelectedStatus) {
        setLocalSelectedStatus(defaultStatus);
        setSelectedStatus(defaultStatus);
      }
    }
  }, [isModalOpen, columns, localSelectedStatus, setSelectedStatus, defaultStatus]);

  if (!isModalOpen) return null;
  if (!columnsLoaded) return <div>Loading...</div>;

  const hasBoards = Object.keys(columns).length > 0;

  const isEmpty = () => {
    return (
      newTaskTitle.trim() === "" &&
      selectedPriority === "A1" &&
      localSelectedStatus === defaultStatus &&
      !dueDate &&
      assignedTo.trim() === "" &&
      taskDescription.trim() === "" &&
      (!storyPoints || storyPoints === 0)
    );
  };

  const handleBoardCreationCancel = () => {
    setNewBoardCreateName("");
    closeModal();
  };

  const handleOverlayClick = (e) => {
    if (e.target.className.includes("modal-overlay")) {
      if (!hasBoards) {
        // Board creation UI is active
        if (newBoardCreateName.trim() !== "") {
          const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
          if (confirmClose) {
            setNewBoardCreateName("");
            closeModal();
          }
        } else {
          closeModal();
        }
        return;
      }
      // Task creation UI:
      if (isEmpty()) {
        closeModal();
      } else {
        const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
        if (confirmClose) {
          closeModal();
        }
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="create-task-modal">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal" onClick={() => {
            if (!hasBoards) setNewBoardCreateName("");
            closeModal();
          }}>
            &times;
          </button>
          <h2>Create New Task</h2>

          {/* When no boards exist, show board creation UI */}
          {!hasBoards ? (
            <div className="no-board-message">
              <p>You need to create a board before you can create tasks.</p>
              <div className="add-board-wrapper">
                <input
                  type="text"
                  placeholder="Enter board name"
                  value={newBoardCreateName}
                  onChange={(e) => setNewBoardCreateName(e.target.value)}
                  autoFocus
                />
                {createBoardError && (
                  <div className="add-board-error-message">{createBoardError}</div>
                )}
                <div className="button-container">
                  <button className="tick-btn" onClick={handleCreateBoard}>
                    ✔️
                  </button>
                  <button className="cross-btn" onClick={() => setNewBoardCreateName("")}>
                    ❌
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={handleBoardCreationCancel} style={{ marginLeft: "auto" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="modal-body">
                <div className="modal-left">
                  <label>Task Title:</label>
                  <textarea
                    className="task-title"
                    placeholder="Enter Task Title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                  {errorMessage && <p className="error-message">{errorMessage}</p>}
                  <label>Priority:</label>
                  <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
                    {allowedPriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <label>Status:</label>
                  <select
                    value={localSelectedStatus}
                    onChange={(e) => {
                      setLocalSelectedStatus(e.target.value);
                      setSelectedStatus(e.target.value);
                    }}
                  >
                    {Object.keys(columns).map((columnId) => (
                      <option key={columnId} value={columnId}>
                        {columns[columnId].name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-right">
                  <label>Due Date:</label>
                  <div className="date-picker-container">
                    <DatePicker
                      selected={dueDate}
                      onChange={(date) => {
                        setDueDate(date);
                        if (date && date < new Date()) {
                          setDueDateWarning("Warning: The selected due date is in the past.");
                        } else {
                          setDueDateWarning("");
                        }
                      }}
                      showTimeSelect
                      dateFormat="d MMMM, yyyy h:mm aa"
                      className="custom-date-picker"
                      placeholderText="Select due date"
                      disabledKeyboardNavigation
                    />
                    {dueDateWarning && <p className="warning-message">{dueDateWarning}</p>}
                  </div>
                  <label>Assign To:</label>
                  <input
                    type="text"
                    placeholder="Assign to..."
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  />
                  <label>Story Points:</label>
                  <div className="story-points-container">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={storyPoints}
                      onChange={(e) => setStoryPoints(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div className="description-section">
                <label>Description:</label>
                <TiptapEditor value={taskDescription} onChange={setTaskDescription} />
              </div>
              <div className="modal-footer">
                <button className="create-task-btn" onClick={handleCreateTask}>
                  Create
                </button>
                <button className="cancel-btn" onClick={closeModal} style={{ marginLeft: "auto" }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
