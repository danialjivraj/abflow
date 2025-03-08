import React from "react";
import DatePicker from "react-datepicker";
import TiptapEditor from "../../components/TiptapEditor";
import "react-datepicker/dist/react-datepicker.css";
import "./createTaskModal.css";

const allowedPriorities = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"];

const CreateTaskModal = ({
    isModalOpen,
    closeModal,
    columns,
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
  }) => {
    if (!isModalOpen) return null;
  
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-modal" onClick={closeModal}>
            &times;
          </button>
          <h2>Create New Task</h2>
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
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
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
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="custom-date-picker"
                  placeholderText="Select due date"
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
                <input type="number" min="0" placeholder="0" />
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
            <button className="cancel-btn" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default CreateTaskModal;
