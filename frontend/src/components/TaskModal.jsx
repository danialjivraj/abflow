import { useState } from "react";
import axios from "axios";

const TaskModal = ({ task, closeModal, setTasks, isCreating = false }) => {
  const [taskData, setTaskData] = useState(
    task || { title: "", priority: "A1", status: "backlog" }
  );

  const handleSave = async () => {
    try {
      if (isCreating) {
        // Create a new task
        const res = await axios.post("http://localhost:5000/api/tasks", {
          ...taskData,
          userId: "user123", // Replace with actual user ID
        });
        setTasks((prev) => [...prev, res.data]);
      } else {
        // Update an existing task
        await axios.put(`http://localhost:5000/api/tasks/${task._id}/edit`, taskData);
        setTasks((prev) =>
          prev.map((t) => (t._id === task._id ? { ...t, ...taskData } : t))
        );
      }
      closeModal();
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${task._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      closeModal();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Close modal when clicking outside of modal-content
  const handleBackgroundClick = (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal();
    }
  };

  return (
    <div className="modal" onClick={handleBackgroundClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-x" onClick={closeModal}>&times;</span>
        <h2>{isCreating ? "Create New Task" : "Edit Task"}</h2>
        <input
          type="text"
          placeholder="Task Title"
          value={taskData.title}
          onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
        />
        <select
          value={taskData.priority}
          onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
        >
          {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <div className="task-actions">
          <button className="save-btn" onClick={handleSave}>
            {isCreating ? "Add Task" : "Save"}
          </button>
          {!isCreating && (
            <button className="delete-btn" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
