import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, X, ChevronDown } from "lucide-react";
import axios from "axios";
import TaskModal from "./TaskModal";
import "./styles.css";

const TaskList = ({ tasks, setTasks }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityTags, setPriorityTags] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const updatedTasks = [...tasks];
    const movedTask = updatedTasks.find((task) => task._id === result.draggableId);
    movedTask.status = result.destination.droppableId;

    setTasks(updatedTasks);

    await axios.put(`http://localhost:5000/api/tasks/${movedTask._id}/move`, {
      status: movedTask.status,
    });
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

          {/* "Clear All" Button on the Left */}
          {priorityTags.length > 0 && (
            <button className="clear-tags-btn" onClick={clearTags}>Clear All</button>
          )}

        </div>
      </div>

      {/* Drag and Drop Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {["backlog", "todo", "done"].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <h2>{status.toUpperCase()}</h2>
                  <ul className="task-list">
                    {filteredTasks
                      .filter((task) => task.status === status)
                      .map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="task-card"
                              onClick={() => setSelectedTask(task)}
                            >
                              <span className="drag-handle" {...provided.dragHandleProps}>
                                <GripVertical size={18} />
                              </span>
                              <span className="task-title">{task.title}</span>
                              <span className={`task-priority priority-${task.priority}`}>
                                {task.priority}
                              </span>
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

      {/* Task Editing Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          closeModal={() => setSelectedTask(null)}
          setTasks={setTasks}
        />
      )}
    </div>
  );
};

export default TaskList;
