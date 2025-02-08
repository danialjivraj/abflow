import { auth } from "../firebase";
import { useEffect, useState } from "react";
import TaskList from "../components/TaskList";
import Sidebar from "../components/Sidebar"; // Import Sidebar

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar /> {/* Sidebar is now separate from TaskList */}
      <div className="p-6">
        <TaskList />
      </div>
    </div>
  );
};

export default Dashboard;
