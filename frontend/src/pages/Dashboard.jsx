import { auth } from "../firebase";
import { useEffect, useState } from "react";
import TaskList from "../components/TaskList";
import Layout from "../components/Layout";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  return (
    <Layout>
      <h1>📌 Dashboard</h1>
      <br></br>
      <TaskList />
    </Layout>
  );
};

export default Dashboard;