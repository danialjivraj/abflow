import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Charts from "./pages/Charts";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import PrivateRoute from "./components/PrivateRoute";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { fetchSettingsPreferences } from "./services/preferencesService";
import {
  updateAccentColor,
  updateTopbarAccentColor,
  updatePriorityCSSVariables,
} from "./utils/themeUtils";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, Slide } from "react-toastify";

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
    topbarAccent: "Blue",
    inactivityTimeoutHours: 1,
    inactivityTimeoutNever: true,
    muteNotifications: false,
  });

  const logoutTimerRef = useRef(null);

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
        localStorage.setItem("darkMode", "true");
        document.documentElement.setAttribute("data-theme", "dark");
        updateAccentColor("Green");
        updateTopbarAccentColor("Blue");
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
            if (prefs.themeAccent === "Custom") {
              updateAccentColor(prefs.themeAccentCustom);
            } else {
              updateAccentColor(prefs.themeAccent || "Green");
            }
            if (prefs.topbarAccent === "Custom") {
              updateTopbarAccentColor(prefs.topbarAccentCustom);
            } else {
              updateTopbarAccentColor(prefs.topbarAccent || "Blue");
            }
            if (prefs.priorityColours) {
              updatePriorityCSSVariables(prefs.priorityColours);
            }
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

  useEffect(() => {
    const clearLogoutTimer = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };

    if (!user || userSettings.inactivityTimeoutNever) {
      clearLogoutTimer();
      return;
    }

    const timeoutDuration =
      userSettings.inactivityTimeoutHours * 60 * 60 * 1000;

    const resetTimer = () => {
      clearLogoutTimer();
      logoutTimerRef.current = setTimeout(() => {
        auth
          .signOut()
          .then(() => console.log("User logged out due to inactivity."));
      }, timeoutDuration);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll"];

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearLogoutTimer();
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [
    user,
    userSettings.inactivityTimeoutHours,
    userSettings.inactivityTimeoutNever,
  ]);

  if (loading) return <p>Loading...</p>;

  return (
    <NotificationsProvider muteNotifications={userSettings.muteNotifications}>
      <Router>
        {/* ToastContainer renders toast notifications globally */}
        <ToastContainer
          position="top-center"
          autoClose={2000}
          theme={userSettings.darkMode ? "dark" : "light"}
          transition={Slide}
          hideProgressBar={true}
          pauseOnHover={false}
        />
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
              path="/settings/:section/*"
              element={
                <Settings updateDefaultBoardView={setDefaultBoardView} />
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </NotificationsProvider>
  );
}

export default App;
