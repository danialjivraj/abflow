import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./styles.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", priority: "A1" });
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const modalEditRef = useRef(null);
  const modalCreateRef = useRef(null);
  const [priorityTags, setPriorityTags] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      axios
        .get(`http://localhost:5000/api/tasks/${user.uid}`)
        .then((res) => setTasks(res.data))
        .catch((err) => console.error("Error fetching tasks:", err));
    }
  }, [user]);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalEditRef.current && !modalEditRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
      if (modalCreateRef.current && !modalCreateRef.current.contains(event.target)) {
        setIsCreateModalOpen(false);
      }
    };

    if (isModalOpen || isCreateModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen, isCreateModalOpen]);

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        ...newTask,
        status: "backlog",
        userId: auth.currentUser.uid,
      });

      setTasks((prevTasks) => [...prevTasks, res.data]);
      setNewTask({ title: "", priority: "A1" });
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const updateTask = async () => {
    if (!selectedTask) return;
    try {
      await axios.put(`http://localhost:5000/api/tasks/${selectedTask._id}/edit`, {
        title: selectedTask.title,
        priority: selectedTask.priority,
      });
      setTasks(tasks.map((task) => (task._id === selectedTask._id ? selectedTask : task)));
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async () => {
    if (!selectedTask) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${selectedTask._id}`);
      setTasks(tasks.filter((task) => task._id !== selectedTask._id));
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const updatedTasks = [...tasks];
    const movedTask = updatedTasks.find((task) => task._id === result.draggableId);
    movedTask.status = result.destination.droppableId;

    setTasks([...updatedTasks]);

    try {
      await axios.put(`http://localhost:5000/api/tasks/${movedTask._id}/move`, {
        status: movedTask.status,
      });

      console.log("Task updated in DB:", movedTask);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Allowed priority options
  const allowedPriorities = ["A", "A1", "A2", "A3", "B", "B1", "B2", "B3", "C", "C1", "C2", "C3", "D", "E"];

  // Adds a selected priority to the input
  const addPriorityTag = (priority) => {
    if (!priorityTags.includes(priority)) {
      setPriorityTags([...priorityTags, priority]); // Corrected: Use the passed argument
    }
    setDropdownOpen(false);
  };


  // Removes a tag
  const removeTag = (tag) => {
    setPriorityTags(priorityTags.filter((t) => t !== tag));
  };

  // Clears all tags
  const clearTags = () => {
    setPriorityTags([]);
  };

  // Filters tasks based on search & priority selection
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (priorityTags.length === 0) return matchesSearch; // If no tags, show all tasks

    const matchesPriority = priorityTags.includes(task.priority) || priorityTags.includes(task.priority[0]);

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="kanban-container">
      {/* Search & Filter Bar */}
      <div className="top-bar">
        {/* Search Bar */}
        <input
          className="search-bar"
          placeholder="Search Tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Tag Selection Area */}
        <div className="tag-container">
          {/* Dropdown Button */}
          <div className="tag-input-box" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <ChevronDown className={`dropdown-icon ${dropdownOpen ? "dropdown-open" : ""}`} />
            {dropdownOpen && (
              <div className="dropdown-menu">
                {allowedPriorities.map((option) => (
                  <div key={option} className="dropdown-item" onClick={() => addPriorityTag(option)}>
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Tags */}
          {priorityTags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
              <X size={14} className="remove-tag" onClick={() => removeTag(tag)} />
            </span>
          ))}

          {/* "Clear All" Button */}
          {priorityTags.length > 0 && (
            <button className="clear-tags-btn" onClick={clearTags}>Clear All</button>
          )}
        </div>
      </div>

      {/* Add Task Button */}
      <div className="add-task-container">
        <button className="add-task-btn" onClick={() => setIsCreateModalOpen(true)}>
          + Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {["backlog", "todo", "done"].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <h2>{status.toUpperCase()}</h2>
                  <ul className="task-list">
                    {filteredTasks
                      .filter((task) => task.status === status) // <-- Apply the filtering logic
                      .map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="task-card"
                              onClick={(e) => {
                                if (e.target.closest(".drag-handle")) return; // Prevents modal from opening when clicking drag handle
                                console.log("Task clicked:", task); // Debugging
                                setSelectedTask(task);
                                setIsModalOpen(true);
                              }}
                            >
                              {/* Drag Handle (draggable area only) */}
                              <span className="drag-handle" {...provided.dragHandleProps}>
                                <GripVertical size={18} />
                              </span>

                              {/* Task Content (clicking here opens modal) */}
                              <div className="task-content">
                                <span className="task-title">{task.title}</span>
                                <span className={`task-priority priority-${task.priority}`}>
                                  {task.priority}
                                </span>
                              </div>
                            </li>
                          )}
                        </Draggable>

                      ))}
                    {provided.placeholder}
                  </ul>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

{/* Edit Task Modal */}
{isModalOpen && selectedTask && (
  <div className="modal">
    <div className="modal-content" ref={modalEditRef}>
      <span className="close-x" onClick={() => setIsModalOpen(false)}>
        &times;
      </span>
      <h2>Edit Task</h2>
      <input
        type="text"
        value={selectedTask.title}
        onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
      />
      <select
        value={selectedTask.priority}
        onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
      >
        {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"].map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <div className="task-actions">
        <button className="save-btn" onClick={updateTask}>
          Save
        </button>
        <button className="delete-btn" onClick={deleteTask}>
          Delete
        </button>
      </div>
    </div>
  </div>
)}

{/* Create Task Modal */}
{isCreateModalOpen && (
  <div className="modal">
    <div className="modal-content" ref={modalCreateRef}>
      <span className="close-x" onClick={() => setIsCreateModalOpen(false)}>
        &times;
      </span>
      <h2>Create New Task</h2>
      <input
        type="text"
        placeholder="Task Name"
        value={newTask.title}
        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
      />
      <select
        value={newTask.priority}
        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
      >
        {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"].map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <div className="task-actions">
        <button className="save-btn" onClick={addTask}>
          Add Task
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default TaskList;
