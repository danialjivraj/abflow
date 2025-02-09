import { auth } from "../firebase";
import { useEffect, useState } from "react";
import axios from "axios";
import TaskList from "../components/TaskList";
import Layout from "../components/Layout";
import TaskModal from "../components/TaskModal";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  useEffect(() => {
    if (user) {
      axios
        .get(`http://localhost:5000/api/tasks/${user.uid}`)
        .then((res) => setTasks(res.data))
        .catch((err) => console.error("Error fetching tasks:", err));
    }
  }, [user]);

  return (
    <Layout>
      <div className="main-content">
        <h1>📌 Dashboard</h1>
        <p>Welcome back, {user?.displayName || "User"}!</p>

        {/* Task Summary */}
        <div className="task-summary">
          <p>📋 {tasks.length} tasks total</p>
          <button className="add-task-btn" onClick={() => setIsCreateModalOpen(true)}>
            + Add Task
          </button>
        </div>

        {/* Task List */}
        <TaskList tasks={tasks} setTasks={setTasks} />

        {/* Task Creation Modal */}
        {isCreateModalOpen && (
          <TaskModal
            closeModal={() => setIsCreateModalOpen(false)}
            setTasks={setTasks}
            isCreating={true}
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
