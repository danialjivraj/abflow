import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TaskModal = ({ isOpen, onClose, onSave, columns }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("A1");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [storyPoints, setStoryPoints] = useState(0);
  const [status, setStatus] = useState("backlog"); // Default status

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title,
      priority,
      description,
      comments: comments.split("\n"),
      dueDate,
      storyPoints,
      status, // Include the selected status
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Task</h2>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"].map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          placeholder="Comments (one per line)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
        <DatePicker
          selected={dueDate}
          onChange={(date) => setDueDate(date)}
          showTimeSelect
          dateFormat="Pp"
        />
        <input
          type="number"
          placeholder="Story Points"
          value={storyPoints}
          onChange={(e) => setStoryPoints(parseInt(e.target.value))}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.keys(columns).map((columnId) => (
            <option key={columnId} value={columnId}>
              {columns[columnId].name}
            </option>
          ))}
        </select>
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default TaskModal;