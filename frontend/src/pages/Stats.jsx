import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import Layout from "../components/Layout";
import { FaSortAlphaDown, FaSortAlphaUp, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa"; // Icons for sorting

const Stats = () => {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [timeTracking, setTimeTracking] = useState([]);
  const [sortBy, setSortBy] = useState("priority"); // Sorting state
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"

  useEffect(() => {
    axios.get("http://localhost:5000/api/stats/weekly")
      .then((res) => setWeeklyStats(res.data))
      .catch((err) => console.error("Error fetching weekly stats:", err));

    axios.get("http://localhost:5000/api/stats/time-tracking")
      .then((res) => setTimeTracking(res.data))
      .catch((err) => console.error("Error fetching time tracking:", err));
  }, []);

  // Sorting logic
  const sortedTimeTracking = [...timeTracking].sort((a, b) => {
    if (sortBy === "priority") {
      return sortOrder === "asc" ? a.priority.localeCompare(b.priority) : b.priority.localeCompare(a.priority);
    } else {
      return sortOrder === "asc" ? a.timeSpent - b.timeSpent : b.timeSpent - a.timeSpent;
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

  return (
    <Layout>
      <div className="main-content">
        <div className="stats-container">
          <h1>📊 Stats & Insights</h1>

          {/* Weekly Completed Tasks & Time Spent on Tasks Section */}
          <div className="stats-flex">
            <div className="chart-container weekly-chart">
              <br></br>
              <h2>📈 Weekly Completed Tasks</h2>
              <br></br>
              {weeklyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="tasksCompleted" stroke="#00c0ff" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p>No weekly data available.</p>
              )}
            </div>

            {/* Time Spent on Tasks with Sorting */}
            <div className="recommendations">
              <div className="recommendations-header">
                <h2>⏳ Time Spent on Tasks</h2>
                <div className="sort-buttons">
                  {/* Sort by Priority (A-Z / Z-A) */}
                  <button onClick={() => toggleSort("priority")} title="Sort by Priority">
                    {sortBy === "priority" && sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                  </button>
                  {/* Sort by Time Spent (Low-High / High-Low) */}
                  <button onClick={() => toggleSort("timeSpent")} title="Sort by Time Spent">
                    {sortBy === "timeSpent" && sortOrder === "asc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
                  </button>
                </div>
              </div>

              {sortedTimeTracking.length > 0 ? (
                sortedTimeTracking.map(item => (
                  <p key={item.priority}>
                    🔹 <strong>{item.priority} tasks:</strong> {item.displayText} spent.
                  </p>
                ))
              ) : (
                <p>No time tracking data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
