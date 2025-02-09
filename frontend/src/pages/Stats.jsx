import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import Layout from "../components/Layout";
import { FaSortAlphaDown, FaSortAlphaUp, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { startOfISOWeek, addWeeks, format, isWithinInterval, endOfISOWeek } from "date-fns";

const Stats = () => {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [timeTracking, setTimeTracking] = useState([]);
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    axios.get("http://localhost:5000/api/stats/weekly")
      .then((res) => setWeeklyStats(res.data))
      .catch((err) => console.error("Error fetching weekly stats:", err));

    axios.get("http://localhost:5000/api/stats/time-tracking")
      .then((res) => setTimeTracking(res.data))
      .catch((err) => console.error("Error fetching time tracking:", err));
  }, []);

  // 🔹 Convert week numbers to actual calendar week date ranges
  const formatWeekToDateRange = (weekNumber) => {
    const startDate = startOfISOWeek(new Date(new Date().getFullYear(), 0, 1)); // First Monday of the year
    const weekStart = addWeeks(startDate, weekNumber - 1);
    const weekEnd = addWeeks(weekStart, 1);

    return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;
  };

  // Get the current week range
  const today = new Date();
  const currentWeekStart = startOfISOWeek(today);
  const currentWeekEnd = endOfISOWeek(today);

  // 🔹 Transform weekly stats data & remove future weeks
  let formattedWeeklyStats = weeklyStats
    .map((stat) => {
      const weekLabel = formatWeekToDateRange(stat.week);
      const [startLabel, endLabel] = weekLabel.split(" - ");
      const weekStartDate = new Date(`${startLabel}, ${today.getFullYear()}`);
      const weekEndDate = new Date(`${endLabel}, ${today.getFullYear()}`);

      return {
        ...stat,
        weekLabel,
        isCurrentWeek: isWithinInterval(today, { start: weekStartDate, end: weekEndDate }),
        isFutureWeek: weekStartDate > currentWeekEnd,
      };
    })
    .filter(stat => !stat.isFutureWeek); // ✅ Remove future weeks

  // 🔹 Ensure last data point is the current week
  if (!formattedWeeklyStats.some(stat => stat.isCurrentWeek)) {
    const lastWeek = formattedWeeklyStats[formattedWeeklyStats.length - 1];
  }

  // Sorting logic
  const sortedTimeTracking = [...timeTracking].sort((a, b) => {
    if (sortBy === "priority") {
      return sortOrder === "asc" ? a.priority.localeCompare(b.priority) : b.priority.localeCompare(a.priority);
    } else {
      return sortOrder === "asc" ? a.timeSpent - b.timeSpent : b.timeSpent - a.timeSpent;
    }
  });

  // 🔹 Toggle sorting order
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
              <br />
              <h2>📈 Weekly Completed Tasks</h2>
              <br />
              {formattedWeeklyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formattedWeeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekLabel"
                      angle={-30} /* ✅ Keeps rotated text */
                      textAnchor="end"
                      interval={0} /* ✅ Forces all labels to be shown */
                      height={50} /* ✅ Adds space for rotated labels */
                      tick={{ fontSize: 12 }} /* ✅ Ensures text is smaller */
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`Tasks Completed: ${value}`, ""]} // ✅ Fix tooltip readability
                      contentStyle={{ backgroundColor: "#222", color: "#fff", borderRadius: 5, border: "1px solid #555" }} // ✅ Improved tooltip styling
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasksCompleted"
                      stroke="#00c0ff" /* ✅ Default Blue Line */
                      strokeWidth={3}
                      dot={{ stroke: "#00c0ff", strokeWidth: 3, fill: "#00c0ff" }} /* ✅ Default dot styling */
                      activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }} /* ✅ Hover dot improvement */
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
                sortedTimeTracking.map((item) => (
                  <p key={item.priority}>
                    🔹 <strong>{item.priority} tasks:</strong> {item.displayText} spent.
                  </p>
                ))
              ) : (
                <p>No time tracking data available for this week.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

/* === Custom Dot Component === */
const CustomDot = ({ cx, cy, payload, today }) => {
  if (!payload) return null;

  const isCurrentWeek = payload.isCurrentWeek;

  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={6} 
      fill={isCurrentWeek ? "#ff5733" : "#00c0ff"} 
      stroke="none"
    />
  );
};

/* === Custom Active Dot Component === */
const CustomActiveDot = ({ cx, cy, payload, today }) => {
  if (!payload) return null;

  const isCurrentWeek = payload.isCurrentWeek;

  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={8} /* ✅ Enlarged on hover */
      fill={isCurrentWeek ? "#ff5733" : "#00c0ff"} /* ✅ Keep red for current week */
      stroke="white" /* ✅ White outline on hover */
      strokeWidth={2} /* ✅ Applies white border for all hovered dots */
    />
  );
};

export default Stats;
