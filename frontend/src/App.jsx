import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import { updateAccentColor } from "./utils/themeUtils";

const DefaultDashboardRedirect = ({ defaultBoardView, preferencesLoaded }) => {
  if (!preferencesLoaded) return <p>Loading dashboard settings...</p>;
  return <Navigate to={`/dashboard/${defaultBoardView}`} replace />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultBoardView, setDefaultBoardView] = useState("boards");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const [userSettings, setUserSettings] = useState({
    darkMode: false,
    defaultPriority: "A1",
    hideOldCompletedTasksDays: 30,
    defaultBoardView: "boards",
    disableToCreateTask: false,
    confirmBeforeDelete: true,
    notifyNonPriorityGoesOvertime: 60,
    notifyScheduledTaskIsDue: 60,
    themeAccent: "Green",
  });

  useEffect(() => {
    let storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode === null) {
      localStorage.setItem("darkMode", "false");
      storedDarkMode = "false";
    }
    document.documentElement.setAttribute(
      "data-theme",
      storedDarkMode === "true" ? "dark" : "light"
    );
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setUser(null);
        setDefaultBoardView("boards");
        setPreferencesLoaded(false);
        updateAccentColor("Green");
      } else {
        setUser(user);
        fetchSettingsPreferences(user.uid)
          .then((res) => {
            const prefs = res.data.settingsPreferences || {};
            const darkMode =
              prefs.darkMode !== undefined ? prefs.darkMode : false;
            localStorage.setItem("darkMode", darkMode);
            document.documentElement.setAttribute(
              "data-theme",
              darkMode ? "dark" : "light"
            );

            setDefaultBoardView(prefs.defaultBoardView || "boards");
            setUserSettings((prev) => ({ ...prev, ...prefs }));
            setPreferencesLoaded(true);
            updateAccentColor(prefs.themeAccent || "Green");
          })
          .catch((err) => {
            console.error("Error fetching preferences:", err);
            setPreferencesLoaded(true);
          });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <NotificationsProvider muteNotifications={userSettings.muteNotifications}>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route element={<PrivateRoute />}>
            <Route
              path="/dashboard"
              element={
                <DefaultDashboardRedirect
                  defaultBoardView={defaultBoardView}
                  preferencesLoaded={preferencesLoaded}
                />
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <Dashboard
                  userSettings={userSettings}
                  setUserSettings={setUserSettings}
                />
              }
            />
            <Route path="/charts" element={<Charts />} />
            <Route path="/charts/grouptasks/:groupKey" element={<Charts />} />
            <Route
              path="/charts/grouptasks/:groupKey/viewtask/:taskId"
              element={<Charts />}
            />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/settings"
              element={<Settings updateDefaultBoardView={setDefaultBoardView} />}
            />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </NotificationsProvider>
  );
}

export default App;
