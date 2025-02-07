import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./TaskList.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("A1");
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
      setTitle("");
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="kanban-container">
      {/* Sidebar */}
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
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Search Bar & Add Button */}
        <div className="top-bar">
          <input className="search-bar" placeholder="Search Tasks..." />
        </div>

        {/* Add Task Form */}
        <div className="task-form">
          <input
            placeholder="Task Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={addTask}>Add</button>
        </div>

        {/* Kanban Board */}
        <div className="kanban-board">
          {["backlog", "todo", "done"].map((status) => (
            <div key={status} className="kanban-column">
              <h2>{status}</h2>
              <ul>
                {tasks.filter((task) => task.status === status).map((task) => (
                  <li key={task._id} className={`task-card priority-${task.priority}`}>
                    <span className="task-title">{task.title}</span>
                    <span className="task-priority">{task.priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskList;
