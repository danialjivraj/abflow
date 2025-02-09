import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./kanban.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", priority: "A1" });
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const modalEditRef = useRef(null);
  const modalCreateRef = useRef(null);

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
        userId: user.uid,
      });
      setTasks([...tasks, res.data]);
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

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      const updatedTasks = [...tasks];
      const movedTask = updatedTasks.splice(source.index, 1)[0];
      updatedTasks.splice(destination.index, 0, movedTask);
      setTasks(updatedTasks);
    } else {
      const updatedTasks = [...tasks];
      const movedTask = updatedTasks.find((task) => task._id === result.draggableId);
      movedTask.status = destination.droppableId;
      setTasks(updatedTasks);

      await axios.put(`http://localhost:5000/api/tasks/${movedTask._id}/move`, {
        status: destination.droppableId,
      });
    }
  };

  return (
    <div className="kanban-container">
      <div className="top-bar">
        <input className="search-bar" placeholder="Search Tasks..." />
        <button className="add-task-btn" onClick={() => setIsCreateModalOpen(true)}>Add Task</button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {["backlog", "todo", "done"].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <h2>{status.toUpperCase()}</h2>
                  <ul className="task-list">
                    {tasks
                      .filter((task) => task.status === status)
                      .map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="task-card"
                              onClick={(e) => {
                                if (e.target.closest(".drag-handle")) return;
                                setSelectedTask(task);
                                setIsModalOpen(true);
                              }}
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

      {/* Edit Task Modal */}
      {isModalOpen && selectedTask && (
        <div className="modal" ref={modalEditRef}>
          <div className="modal-content">
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
              <button className="save-btn" onClick={updateTask}>Save</button>
              <button className="delete-btn" onClick={deleteTask}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="modal" ref={modalCreateRef}>
          <div className="modal-content">
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
              <button className="save-btn" onClick={addTask}>Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
