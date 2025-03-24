import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Charts from "./pages/Charts";  
import Profile from "./pages/Profile";  
import Settings from "./pages/Settings";
import PrivateRoute from "./components/PrivateRoute"; 
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { fetchSettingsPreferences } from "./services/preferencesService";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode === null) {
      localStorage.setItem("darkMode", "false");
      storedDarkMode = "false";
    }
    document.documentElement.setAttribute("data-theme", storedDarkMode === "true" ? "dark" : "light");
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchSettingsPreferences(user.uid)
          .then((res) => {
            const prefs = res.data.settingsPreferences || {};
            const darkMode = prefs.darkMode !== undefined ? prefs.darkMode : false;
            localStorage.setItem("darkMode", darkMode);
            document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
          })
          .catch((err) => {
            console.error("Error fetching preferences:", err);
          });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <NotificationsProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard/boards" replace /> : <Login />}
          />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Navigate to="/dashboard/boards" replace />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/charts/grouptasks/:groupKey" element={<Charts />} />
            <Route path="/charts/grouptasks/:groupKey/viewtask/:taskId" element={<Charts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </NotificationsProvider>
  );
}

export default App;
