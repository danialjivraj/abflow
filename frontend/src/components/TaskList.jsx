import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./kanban.css";
import "./sidebar.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("A1");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const user = auth.currentUser;
  const columnsRef = useRef([]);
  const [maxHeight, setMaxHeight] = useState("auto");

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

  const openModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  const updateTask = async () => {
    if (!selectedTask) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/tasks/${selectedTask._id}/edit`, {
        title: selectedTask.title,
        priority: selectedTask.priority,
      });

      setTasks(tasks.map((t) => (t._id === selectedTask._id ? res.data : t)));
      closeModal();
    } catch (err) {
      console.error("❌ Error updating task:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
        await axios.delete(`http://localhost:5000/api/tasks/${id}`);
        const updatedTasks = tasks.filter((t) => t._id !== id);
        setTasks(updatedTasks);
        closeModal();
    } catch (err) {
        console.error("Error deleting task:", err);
    }
};

  return (
    <div className="kanban-container">
      <aside className="sidebar">
        <div className="sidebar-content">
          <nav>
            <ul>
              <li className="active">Dashboard</li>
              <li>Stats</li>
              <li>Profile</li>
            </ul>
          </nav>
        </div>
        <button onClick={() => auth.signOut()} className="logout-btn">
          Logout
        </button>
      </aside>

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

        <div className="kanban-board">
          {["backlog", "todo", "done"].map((status, index) => (
            <div
              key={status}
              ref={(el) => (columnsRef.current[index] = el)}
              className="kanban-column"
              style={{ minHeight: maxHeight }}
            >
              <h2>{status}</h2>
              <ul>
                {tasks.filter((task) => task.status === status).map((task) => (
                  <li key={task._id} className={`task-card priority-${task.priority}`} onClick={() => openModal(task)}>
                    <span className="task-title">{task.title}</span>
                    <span className="task-priority">{task.priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && selectedTask && (
  <div className="modal">
    <div className="modal-content">
      <span className="close-x" onClick={closeModal}>&times;</span>
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
      <button onClick={updateTask}>Save</button>
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
