import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import Layout from "../components/Layout";
import { FaSortAlphaDown, FaSortAlphaUp, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { startOfISOWeek, addWeeks, format, isWithinInterval, endOfISOWeek } from "date-fns";
import { auth } from "../firebase"; // Import Firebase auth

const Stats = () => {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [timeTracking, setTimeTracking] = useState([]);
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Fetch weekly stats
    axios.get(`http://localhost:5000/api/stats/weekly?userId=${user.uid}`)
      .then((res) => setWeeklyStats(res.data))
      .catch((err) => console.error("Error fetching weekly stats:", err));

    // Fetch tasks with timeSpent
    axios.get(`http://localhost:5000/api/tasks/${user.uid}`)
      .then((res) => {
        const tasks = res.data;
        const currentWeekStart = startOfISOWeek(new Date());
        const currentWeekEnd = endOfISOWeek(new Date());

        // Filter tasks that were worked on this week
        const tasksThisWeek = tasks.filter((task) => {
          const taskDate = new Date(task.updatedAt || task.createdAt);
          return isWithinInterval(taskDate, { start: currentWeekStart, end: currentWeekEnd });
        });

        // Format tasks for display
        const formattedTasks = tasksThisWeek.map((task) => ({
          id: task._id,
          title: task.title,
          priority: task.priority,
          timeSpent: task.timeSpent || 0, // Ensure timeSpent is defined
          isTimerRunning: task.isTimerRunning || false,
          timerStartTime: task.timerStartTime || null,
        }));

        setTimeTracking(formattedTasks);
      })
      .catch((err) => console.error("Error fetching tasks:", err));
  }, []);

  // Helper function to format timeSpent
  const formatTimeSpent = (timeSpent) => {
    const hours = Math.floor(timeSpent / 3600);
    const minutes = Math.floor((timeSpent % 3600) / 60);

    let formattedTime = "";
    if (hours > 0) formattedTime += `${hours} hour${hours !== 1 ? "s" : ""}`;
    if (minutes > 0) {
      if (formattedTime) formattedTime += " and ";
      formattedTime += `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    return formattedTime || "0 minutes";
  };

  // Calculate total time spent (backend + frontend)
  const calculateTotalTimeSpent = (task) => {
    const backendTimeSpent = task.timeSpent || 0;
    const frontendElapsedTime = task.isTimerRunning ? (new Date() - new Date(task.timerStartTime)) / 1000 : 0;
    return backendTimeSpent + frontendElapsedTime;
  };

  // Sorting logic
  const sortedTimeTracking = [...timeTracking].sort((a, b) => {
    if (sortBy === "priority") {
      return sortOrder === "asc" ? a.priority.localeCompare(b.priority) : b.priority.localeCompare(a.priority);
    } else {
      const totalTimeA = calculateTotalTimeSpent(a);
      const totalTimeB = calculateTotalTimeSpent(b);
      return sortOrder === "asc" ? totalTimeA - totalTimeB : totalTimeB - totalTimeA;
    }
  });

  // Toggle sorting order
  const toggleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("asc");
    }
  };

  // Fetch timeSpent periodically
  useEffect(() => {
    const fetchTimeSpent = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const response = await axios.get(`http://localhost:5000/api/tasks/${user.uid}`);
        const tasks = response.data;

        // Update the timeTracking state with the latest timeSpent
        setTimeTracking((prevTimeTracking) =>
          prevTimeTracking.map((task) => {
            const backendTask = tasks.find((t) => t._id === task.id);
            return backendTask ? { ...task, timeSpent: backendTask.timeSpent } : task;
          })
        );
      } catch (error) {
        console.error("Error fetching timeSpent:", error);
      }
    };

    // Fetch timeSpent every 10 seconds
    const interval = setInterval(fetchTimeSpent, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="stats-container">
        <h1>📊 Stats & Insights</h1>

        {/* Weekly Completed Tasks & Time Spent on Tasks Section */}
        <div className="stats-flex">
          <div className="chart-container weekly-chart">
            <br />
            <h2>📈 Weekly Completed Tasks</h2>
            <br />
            {weeklyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="weekLabel"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={50}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`Tasks Completed: ${value}`, ""]}
                    contentStyle={{ backgroundColor: "#222", color: "#fff", borderRadius: 5, border: "1px solid #555" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasksCompleted"
                    stroke="#00c0ff"
                    strokeWidth={3}
                    dot={{ stroke: "#00c0ff", strokeWidth: 3, fill: "#00c0ff" }}
                    activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No weekly data available.</p>
            )}
          </div>

          {/* Time Spent on Tasks with Sorting */}
          <div className="recommendations">
            <div className="recommendations-header">
              <h2>⏳ Total Time Spent on Tasks this Week</h2>
              <div className="sort-buttons">
                <button onClick={() => toggleSort("priority")} title="Sort by Priority">
                  {sortBy === "priority" && sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                </button>
                <button onClick={() => toggleSort("timeSpent")} title="Sort by Time Spent">
                  {sortBy === "timeSpent" && sortOrder === "asc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
                </button>
              </div>
            </div>

            {sortedTimeTracking.length > 0 ? (
              sortedTimeTracking.map((task) => {
                const totalTimeSpent = calculateTotalTimeSpent(task);
                return (
                  <p key={task.id}>
                    🔹 <strong>{task.title} ({task.priority})</strong> - {formatTimeSpent(totalTimeSpent)}
                  </p>
                );
              })
            ) : (
              <p>No time tracking data available for this week.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Stats;