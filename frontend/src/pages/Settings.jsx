import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/navigation/Layout";
import TopBar from "../components/navigation/TopBar";
import { auth } from "../firebase";
import {
  fetchSettingsPreferences,
  updateSettingsPreferences,
} from "../services/preferencesService";
import { getSettingsTopBarConfig } from "../config/topBarConfig.jsx";
import {
  updateAccentColor,
  updateTopbarAccentColor,
  updatePriorityCSSVariables,
} from "../utils/themeUtils";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../components/styles.css";

const SECTIONS = [
  "Productivity & UX",
  "Scheduling",
  "Notifications",
  "Interface Customisation",
  "Account & Behavior",
];

const sectionToSlug = {
  "Productivity & UX": "productivity-ux",
  Scheduling: "scheduling",
  Notifications: "notifications",
  "Interface Customisation": "interface-customisation",
  "Account & Behavior": "account-behavior",
};

const slugToSection = Object.fromEntries(
  Object.entries(sectionToSlug).map(([key, value]) => [value, key])
);

const DEFAULT_SECTION = "Productivity & UX";

const DEFAULT_SETTINGS = {
  darkMode: true,
  muteNotifications: false,
  inactivityTimeoutHours: 24,
  inactivityTimeoutNever: true,
  defaultPriority: "A1",
  hideOldCompletedTasksDays: 365,
  hideOldCompletedTasksNever: true,
  defaultBoardView: "boards",
  disableToCreateTask: false,
  confirmBeforeDeleteTask: true,
  confirmBeforeDeleteBoard: true,
  notifyNonPriorityGoesOvertime: 1,
  notifyScheduledTaskIsDue: 5,
  themeAccent: "Green",
  themeAccentCustom: "",
  topbarAccent: "Blue",
  topbarAccentCustom: "",
  priorityColours: {
    A1: "#ff4d4d",
    A2: "#ff6666",
    A3: "#ff9999",
    B1: "#4d4dff",
    B2: "#6666ff",
    B3: "#9999ff",
    C1: "#4dff4d",
    C2: "#66ff66",
    C3: "#99ff99",
    D: "#cc66ff",
    E: "#ff9966",
  },
};

const CATEGORY_DEFAULTS = {
  "Productivity & UX": {
    defaultBoardView: DEFAULT_SETTINGS.defaultBoardView,
    defaultPriority: DEFAULT_SETTINGS.defaultPriority,
    confirmBeforeDeleteTask: DEFAULT_SETTINGS.confirmBeforeDeleteTask,
    confirmBeforeDeleteBoard: DEFAULT_SETTINGS.confirmBeforeDeleteBoard,
    hideOldCompletedTasksDays: DEFAULT_SETTINGS.hideOldCompletedTasksDays,
    hideOldCompletedTasksNever: DEFAULT_SETTINGS.hideOldCompletedTasksNever,
  },
  Scheduling: {
    disableToCreateTask: DEFAULT_SETTINGS.disableToCreateTask,
  },
  Notifications: {
    muteNotifications: DEFAULT_SETTINGS.muteNotifications,
    notifyNonPriorityGoesOvertime:
      DEFAULT_SETTINGS.notifyNonPriorityGoesOvertime,
    notifyScheduledTaskIsDue: DEFAULT_SETTINGS.notifyScheduledTaskIsDue,
  },
  "Interface Customisation": {
    themeAccent: DEFAULT_SETTINGS.themeAccent,
    themeAccentCustom: DEFAULT_SETTINGS.themeAccentCustom,
    topbarAccent: DEFAULT_SETTINGS.topbarAccent,
    topbarAccentCustom: DEFAULT_SETTINGS.topbarAccentCustom,
    priorityColours: DEFAULT_SETTINGS.priorityColours,
  },
  "Account & Behavior": {
    inactivityTimeoutHours: DEFAULT_SETTINGS.inactivityTimeoutHours,
    inactivityTimeoutNever: DEFAULT_SETTINGS.inactivityTimeoutNever,
  },
};

const presetColors = {
  Green: "#4CAF50",
  Blue: "#007bff",
  Orange: "#ff9800",
  Purple: "#9c27b0",
  Yellow: "#ffeb3b",
};

const Settings = ({ updateDefaultBoardView }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(null);
  const [userId, setUserId] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showPriorityColors, setShowPriorityColors] = useState(false);

  const themeAccentColorRef = useRef(null);
  const topbarAccentColorRef = useRef(null);

  const { section } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!section) {
      navigate(`/settings/${sectionToSlug[DEFAULT_SECTION]}`, {
        replace: true,
      });
    }
  }, [section, navigate]);

  const activeSection = slugToSection[section] || DEFAULT_SECTION;

  const applyTheme = (isDarkMode) => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  };

  const resetCategory = (category) => {
    const defaults = CATEGORY_DEFAULTS[category];
    setSettings((prev) => ({ ...prev, ...defaults }));
  };

  const resetAll = () => {
    setSettings((prevSettings) => ({
      ...DEFAULT_SETTINGS,
      darkMode: prevSettings.darkMode,
    }));
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const id = currentUser.uid;
      setUserId(id);
      fetchSettingsPreferences(id)
        .then((res) => {
          const prefs = res.data.settingsPreferences || {};
          const merged = { ...DEFAULT_SETTINGS, ...prefs };
          setSettings(merged);
          setInitialSettings(merged);
          setSettingsLoaded(true);
          applyTheme(merged.darkMode);
          updatePriorityCSSVariables(merged.priorityColours);
        })
        .catch((err) => {
          console.error("Failed to fetch settings:", err);
          setSettingsLoaded(true);
        });
    }
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    let val = type === "checkbox" ? checked : value;
    if (type === "number") {
      val = Math.max(0, Number(val));
    }
    const updated = { ...settings, [name]: val };
    setSettings(updated);

    if (name === "darkMode") {
      applyTheme(val);
      localStorage.setItem("darkMode", val);
      if (userId) {
        updateSettingsPreferences(userId, updated).catch((err) =>
          console.error("Failed to update dark mode:", err)
        );
      }
    }
  };

  const handleAccentSelectChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (value === "Custom") {
      setTimeout(() => {
        if (name === "themeAccent" && themeAccentColorRef.current) {
          if (themeAccentColorRef.current.showPicker) {
            themeAccentColorRef.current.showPicker();
          } else {
            themeAccentColorRef.current.click();
          }
        }
        if (name === "topbarAccent" && topbarAccentColorRef.current) {
          if (topbarAccentColorRef.current.showPicker) {
            topbarAccentColorRef.current.showPicker();
          } else {
            topbarAccentColorRef.current.click();
          }
        }
      }, 0);
    }
  };

  const handleThemeAccentCustomChange = (e) => {
    setSettings((prev) => ({ ...prev, themeAccentCustom: e.target.value }));
  };

  const handleTopbarAccentCustomChange = (e) => {
    setSettings((prev) => ({ ...prev, topbarAccentCustom: e.target.value }));
  };

  const handlePriorityColorChange = (e, priority) => {
    const newColor = e.target.value;
    setSettings((prev) => ({
      ...prev,
      priorityColours: {
        ...prev.priorityColours,
        [priority]: newColor,
      },
    }));
  };

  const handleSave = () => {
    if (!userId) return;
    updateSettingsPreferences(userId, settings)
      .then(() => {
        setInitialSettings(settings);
        updateDefaultBoardView(settings.defaultBoardView);

        if (settings.themeAccent === "Custom") {
          updateAccentColor(settings.themeAccentCustom);
        } else {
          updateAccentColor(settings.themeAccent);
        }
        if (settings.topbarAccent === "Custom") {
          updateTopbarAccentColor(settings.topbarAccentCustom);
        } else {
          updateTopbarAccentColor(settings.topbarAccent);
        }
        updatePriorityCSSVariables(settings.priorityColours);
        toast.success("Settings saved!");
      })
      .catch((err) => {
        console.error("Failed to save settings:", err);
        toast.error("Failed to save settings.");
      });
  };

  const isChanged = (() => {
    if (!initialSettings) return false;
    const { darkMode, ...currentWithoutDarkMode } = settings;
    const { darkMode: initialDarkMode, ...initialWithoutDarkMode } =
      initialSettings;
    return (
      JSON.stringify(currentWithoutDarkMode) !==
      JSON.stringify(initialWithoutDarkMode)
    );
  })();

  if (!settingsLoaded) {
    return (
      <Layout>
        <div className="settings-loading">Loading settings...</div>
      </Layout>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "Productivity & UX":
        return (
          <>
            <label className="setting-row">
              <span>Default Board View</span>
              <select
                name="defaultBoardView"
                value={settings.defaultBoardView}
                onChange={handleChange}
              >
                <option value="boards">Boards</option>
                <option value="schedule">Schedule</option>
                <option value="completedtasks">Completed Tasks</option>
              </select>
            </label>

            <label className="setting-row">
              <span>Default Task Priority on Create</span>
              <select
                name="defaultPriority"
                value={settings.defaultPriority}
                onChange={handleChange}
              >
                {[
                  "A1",
                  "A2",
                  "A3",
                  "B1",
                  "B2",
                  "B3",
                  "C1",
                  "C2",
                  "C3",
                  "D",
                  "E",
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="setting-row">
              <span>Require Confirmation Before Deleting Task</span>
              <input
                type="checkbox"
                name="confirmBeforeDeleteTask"
                checked={settings.confirmBeforeDeleteTask}
                onChange={handleChange}
              />
            </label>

            <label className="setting-row">
              <span>Require Confirmation Before Deleting Board</span>
              <input
                type="checkbox"
                name="confirmBeforeDeleteBoard"
                checked={settings.confirmBeforeDeleteBoard}
                onChange={handleChange}
              />
            </label>

            <label className="setting-row">
              <span>Hide Completed Tasks Older Than (days)</span>
              <div className="hide-tasks-right">
                <input
                  type="number"
                  name="hideOldCompletedTasksDays"
                  value={settings.hideOldCompletedTasksDays}
                  onChange={handleChange}
                  className="setting-number-input"
                  disabled={settings.hideOldCompletedTasksNever}
                />
                <label className="never-checkbox">
                  <input
                    type="checkbox"
                    name="hideOldCompletedTasksNever"
                    checked={settings.hideOldCompletedTasksNever}
                    onChange={handleChange}
                  />
                  <span>Never</span>
                </label>
              </div>
            </label>

            <div className="category-button-row">
              <button
                className="btn-sm default-category-btn"
                onClick={() => resetCategory("Productivity & UX")}
              >
                Default Productivity & UX
              </button>
            </div>
          </>
        );
      case "Scheduling":
        return (
          <>
            <label className="setting-row">
              <span>Disable Drag to Create Task</span>
              <input
                type="checkbox"
                name="disableToCreateTask"
                checked={settings.disableToCreateTask}
                onChange={handleChange}
              />
            </label>

            <div className="category-button-row">
              <button
                className="btn-sm default-category-btn"
                onClick={() => resetCategory("Scheduling")}
              >
                Default Scheduling
              </button>
            </div>
          </>
        );
      case "Notifications":
        return (
          <>
            <label className="setting-row">
              <span>Mute Notifications</span>
              <input
                type="checkbox"
                name="muteNotifications"
                checked={settings.muteNotifications}
                onChange={handleChange}
              />
            </label>

            <label className="setting-row">
              <span>
                Notify When Non-Priority Task Goes Overtime (in hours)
              </span>
              <input
                type="number"
                name="notifyNonPriorityGoesOvertime"
                value={settings.notifyNonPriorityGoesOvertime}
                onChange={handleChange}
                className="setting-number-input"
              />
            </label>

            <label className="setting-row">
              <span>Notify When a Scheduled Task is Due (in minutes)</span>
              <input
                type="number"
                name="notifyScheduledTaskIsDue"
                value={settings.notifyScheduledTaskIsDue}
                onChange={handleChange}
                className="setting-number-input"
              />
            </label>

            <div className="category-button-row">
              <button
                className="btn-sm default-category-btn"
                onClick={() => resetCategory("Notifications")}
              >
                Default Notifications
              </button>
            </div>
          </>
        );
      case "Interface Customisation":
        return (
          <>
            <label className="setting-row">
              <span>Sidebar Theme Accent</span>
              <div className="accent-container">
                <input
                  type="color"
                  className="custom-color-input"
                  ref={themeAccentColorRef}
                  value={
                    settings.themeAccent === "Custom"
                      ? settings.themeAccentCustom
                      : presetColors[settings.themeAccent] || "#4CAF50"
                  }
                  onChange={handleThemeAccentCustomChange}
                  disabled={settings.themeAccent !== "Custom"}
                />
                <select
                  name="themeAccent"
                  value={settings.themeAccent}
                  onChange={handleAccentSelectChange}
                >
                  {[
                    "Green",
                    "Blue",
                    "Orange",
                    "Purple",
                    "Yellow",
                    "Custom",
                  ].map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="setting-row">
              <span>Topbar Theme Accent</span>
              <div className="accent-container">
                <input
                  type="color"
                  className="custom-color-input"
                  ref={topbarAccentColorRef}
                  value={
                    settings.topbarAccent === "Custom"
                      ? settings.topbarAccentCustom
                      : presetColors[settings.topbarAccent] || "#007bff"
                  }
                  onChange={handleTopbarAccentCustomChange}
                  disabled={settings.topbarAccent !== "Custom"}
                />
                <select
                  name="topbarAccent"
                  value={settings.topbarAccent}
                  onChange={handleAccentSelectChange}
                >
                  {[
                    "Green",
                    "Blue",
                    "Orange",
                    "Purple",
                    "Yellow",
                    "Custom",
                  ].map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div
              className="priority-colors-header"
              onClick={() => setShowPriorityColors(!showPriorityColors)}
            >
              <span>Task Priority Colors</span>
              <span className="dropdown-arrow">
                {showPriorityColors ? "▲" : "▼"}
              </span>
            </div>
            {showPriorityColors && (
              <div className="priority-colors-container">
                {[
                  ["A1", "A2", "A3"],
                  ["B1", "B2", "B3"],
                  ["C1", "C2", "C3"],
                  ["D"],
                  ["E"],
                ].map((group, groupIndex) => (
                  <div className="priority-row" key={groupIndex}>
                    {group.map((priority) => (
                      <div className="priority-color-row" key={priority}>
                        <label>{priority}</label>
                        <input
                          type="color"
                          name={priority}
                          value={settings.priorityColours[priority]}
                          onChange={(e) =>
                            handlePriorityColorChange(e, priority)
                          }
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="category-button-row">
              <button
                className="btn-sm default-category-btn"
                onClick={() => resetCategory("Interface Customisation")}
              >
                Default Interface Customisation
              </button>
            </div>
          </>
        );
      case "Account & Behavior":
        return (
          <>
            <label className="setting-row">
              <span>Inactivity Timeout (hours)</span>
              <div className="hide-tasks-right">
                <input
                  type="number"
                  name="inactivityTimeoutHours"
                  value={settings.inactivityTimeoutHours}
                  onChange={handleChange}
                  className="setting-number-input"
                  disabled={settings.inactivityTimeoutNever}
                />
                <label className="never-checkbox">
                  <input
                    type="checkbox"
                    name="inactivityTimeoutNever"
                    checked={settings.inactivityTimeoutNever}
                    onChange={handleChange}
                  />
                  <span>Never</span>
                </label>
              </div>
            </label>

            <div className="category-button-row">
              <button
                className="btn-sm default-category-btn"
                onClick={() => resetCategory("Account & Behavior")}
              >
                Default Account & Behavior
              </button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const handleSectionClick = (sec) => {
    navigate(`/settings/${sectionToSlug[sec]}`);
  };

  return (
    <Layout>
      <TopBar
        buttons={getSettingsTopBarConfig(() => {
          const newDarkMode = !settings.darkMode;
          setSettings((prev) => ({ ...prev, darkMode: newDarkMode }));
          applyTheme(newDarkMode);
          if (userId) {
            updateSettingsPreferences(userId, {
              ...settings,
              darkMode: newDarkMode,
            }).catch((err) =>
              console.error("Failed to update dark mode:", err)
            );
          }
        }, settings.darkMode)}
      />
      <h1 className="page-title">Settings</h1>

      <div className="settings-wrapper">
        <aside className="settings-sidebar">
          {SECTIONS.map((sec) => (
            <div
              key={sec}
              className={`sidebar-item ${
                activeSection === sec ? "active" : ""
              }`}
              onClick={() => handleSectionClick(sec)}
            >
              {sec}
            </div>
          ))}
        </aside>
        <div className="settings-main-container">
          <div className="settings-scroll-container">
            <div className="settings-content">
              <h1 className="settings-title">{activeSection}</h1>
              <div className="settings-section">{renderSection()}</div>
            </div>
          </div>
          <div className="settings-footer">
            <button
              className="btn save-settings-btn"
              onClick={handleSave}
              disabled={!isChanged}
            >
              Save Settings
            </button>
            <button className="btn default-all-btn" onClick={resetAll}>
              Default All
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
