import React, { useEffect, useState } from "react";
import Layout from "../components/navigation/Layout";
import TopBar from "../components/navigation/TopBar";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  fetchSettingsPreferences,
  updateSettingsPreferences,
} from "../services/preferencesService";
import { getSettingsTopBarConfig } from "../config/topBarConfig.jsx";
import { updateAccentColor, updateTopbarAccentColor } from "../utils/themeUtils";
import "../components/styles.css";

const SECTIONS = [
  "Productivity & UX",
  "Scheduling",
  "Notifications",
  "Interface Customization",
  "Account & Behavior",
];

const Settings = ({ updateDefaultBoardView }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    darkMode: false,
    muteNotifications: false,
    inactivityTimeoutHours: 1,
    defaultPriority: "A1",
    hideOldCompletedTasksDays: 30,
    hideOldCompletedTasksNever: false,
    defaultBoardView: "boards",
    disableToCreateTask: false,
    confirmBeforeDelete: true,
    notifyNonPriorityGoesOvertime: 60,
    notifyScheduledTaskIsDue: 60,
    themeAccent: "Green",
    topbarAccent: "Blue",
  });
  const [initialSettings, setInitialSettings] = useState(null);
  const [userId, setUserId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);

  const applyTheme = (isDarkMode) => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const id = currentUser.uid;
      setUserId(id);
      fetchSettingsPreferences(id)
        .then((res) => {
          const prefs = res.data.settingsPreferences || {};
          const merged = { ...settings, ...prefs };
          setSettings(merged);
          setInitialSettings(merged);
          setSettingsLoaded(true);
          applyTheme(merged.darkMode);
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

  const handleSave = () => {
    if (!userId) return;
    updateSettingsPreferences(userId, settings)
      .then(() => {
        setSaveStatus("Settings saved!");
        setInitialSettings(settings);
        updateDefaultBoardView(settings.defaultBoardView);
        updateAccentColor(settings.themeAccent);
        updateTopbarAccentColor(settings.topbarAccent);
        setTimeout(() => setSaveStatus(""), 2000);
      })
      .catch((err) => {
        console.error("Failed to save settings:", err);
        setSaveStatus("Failed to save.");
        setTimeout(() => setSaveStatus(""), 3000);
      });
  };

  const isChanged =
    JSON.stringify(settings) !== JSON.stringify(initialSettings);

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
                {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
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
              <span>Notify When Non-Priority Task Goes Overtime (in hours)</span>
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
          </>
        );
      case "Interface Customization":
        return (
          <>
            <label className="setting-row">
              <span>Sidebar Theme Accent</span>
              <select
                name="themeAccent"
                value={settings.themeAccent}
                onChange={handleChange}
              >
                {["Green", "Blue", "Orange", "Purple", "Yellow"].map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
            <label className="setting-row">
              <span>Topbar Theme Accent</span>
              <select
                name="topbarAccent"
                value={settings.topbarAccent}
                onChange={handleChange}
              >
                {["Blue", "Red", "Purple", "Black"].map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
          </>
        );
      case "Account & Behavior":
        return (
          <>
            <label className="setting-row">
              <span>Inactivity Timeout (hours)</span>
              <input
                type="number"
                name="inactivityTimeoutHours"
                value={settings.inactivityTimeoutHours}
                onChange={handleChange}
                className="setting-number-input"
              />
            </label>
            <label className="setting-row">
              <span>Require Confirmation Before Deleting</span>
              <input
                type="checkbox"
                name="confirmBeforeDelete"
                checked={settings.confirmBeforeDelete}
                onChange={handleChange}
              />
            </label>
          </>
        );
      default:
        return null;
    }
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
      <div className="settings-wrapper">
        <aside className="settings-sidebar">
          {SECTIONS.map((section) => (
            <div
              key={section}
              className={`sidebar-item ${activeSection === section ? "active" : ""}`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </div>
          ))}
        </aside>
        <div className="settings-content">
          <h1 className="settings-title">{activeSection}</h1>
          <div className="settings-section">{renderSection()}</div>
          <div className="settings-save-footer">
            <button className="save-settings-btn" onClick={handleSave} disabled={!isChanged}>
              Save Settings
            </button>
            <div className="save-status-placeholder">
              {saveStatus && <div className="save-status-msg">{saveStatus}</div>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
