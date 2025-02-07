import { auth } from "../firebase";
import { useEffect, useState } from "react";
import TaskList from "../components/TaskList";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  return (
    <div className="p-6">
      <TaskList />
    </div>
  );
};

export default Dashboard;
