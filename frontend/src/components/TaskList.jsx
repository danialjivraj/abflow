import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./kanban.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("A1");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/tasks/${user.uid}`)
        .then((res) => {
          setTasks(res.data);
        })
        .catch((err) => console.error("Error fetching tasks:", err));
    }
  }, [user]);

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        title,
        priority,
        status: "backlog",
        userId: user.uid,
      });
      setTasks([...tasks, res.data]);
    } catch (err) {
      console.error("Error adding task:", err);
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
      <div className="main-content">
        <div className="top-bar">
          <input className="search-bar" placeholder="Search Tasks..." />
        </div>

        <div className="task-form">
          <input placeholder="Task Name" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button onClick={addTask}>Add</button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {["backlog", "todo", "done"].map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided) => (
                  <div
                    className="kanban-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <h2>{status}</h2>
                    <ul>
                      {tasks
                        .filter((task) => task.status === status)
                        .map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`task-card priority-${task.priority}`}
                                onClick={(e) => {
                                  if (e.target.closest(".drag-handle")) return;
                                  setSelectedTask(task);
                                  setIsModalOpen(true);
                                }}
                              >
                                <span
                                  className="drag-handle"
                                  {...provided.dragHandleProps}
                                >
                                  <GripVertical size={18} />
                                </span>
                                <span className="task-title">{task.title}</span>
                                <span className="task-priority">{task.priority}</span>
                              </li>
                            )}
                          </Draggable>
                        ))}
                    </ul>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {isModalOpen && selectedTask && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-x" onClick={() => setIsModalOpen(false)}>&times;</span>
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
            <button onClick={() => updateTask(selectedTask)}>Save</button>
            <button onClick={() => deleteTask(selectedTask._id)} className="delete-btn">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
