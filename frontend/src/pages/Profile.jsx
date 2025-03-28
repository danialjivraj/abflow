import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/navigation/Layout";
import TopBar from "../components/navigation/TopBar";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { getProfileTopBarConfig } from "../config/topBarConfig.jsx";
import {
  fetchProfile,
  uploadProfilePicture,
  removeProfilePicture,
  updateName,
} from "../services/profileService";
import "../components/styles.css";
import { toast } from "react-toastify";
import { FaCheck, FaTimes } from "react-icons/fa";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const fetchProfileData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;
    try {
      const response = await fetchProfile(userId);
      setProfile(response.data);
      setEditName(response.data.name);
      setPendingFile(null);
      setPendingPreview(null);
      setPendingRemove(false);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handlePictureClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPendingFile(file);
      setPendingPreview(URL.createObjectURL(file));
      setPendingRemove(false);
    }
  };

  const handleSetPendingRemove = () => {
    setPendingRemove(true);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handleSavePicture = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;
    if (pendingFile) {
      try {
        const response = await uploadProfilePicture(userId, pendingFile);
        setProfile((prev) => ({
          ...prev,
          profilePicture: `${response.data.profilePicture}?t=${Date.now()}`,
        }));
        setPendingFile(null);
        setPendingPreview(null);
        toast.success("Image saved!");
      } catch (error) {
        console.error("Error uploading new picture:", error);
        toast.error("Failed to save image!");
      }
    } else if (pendingRemove) {
      try {
        const response = await removeProfilePicture(userId);
        setProfile((prev) => ({
          ...prev,
          profilePicture: response.data.profilePicture,
        }));
        setPendingRemove(false);
        toast.success("Image saved!");
      } catch (error) {
        console.error("Error removing profile picture:", error);
        toast.error("Failed to remove image!");
      }
    }
  };

  const handleCancelPictureChange = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setPendingRemove(false);
  };

  const handleNameUpdate = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !editName.trim()) return;
    const userId = currentUser.uid;
    try {
      const response = await updateName(userId, editName);
      setProfile((prev) => ({
        ...prev,
        name: response.data.name,
      }));
      setIsEditing(false);
      toast.success("Name saved!");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name!");
    }
  };

  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toString();
  };

  if (!profile) {
    return (
      <Layout>
        <TopBar buttons={getProfileTopBarConfig(() => {}, navigate)} />
        <div className="profile-page">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL_DEPLOY;
  const displayImage = pendingRemove
    ? "/default-profile-image.png"
    : pendingPreview
    ? pendingPreview
    : profile.profilePicture
    ? `${BASE_URL}${profile.profilePicture}`
    : "/default-profile-image.png";

  return (
    <Layout>
      <TopBar buttons={getProfileTopBarConfig(() => {}, navigate)} />
      <h1 className="page-title">Profile</h1>
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-picture-container">
              <img
                src={displayImage}
                alt="Profile"
                className="profile-picture"
                onClick={handlePictureClick}
                onError={(e) => {
                  e.target.src = "/default-profile-image.png";
                }}
                style={{ cursor: "pointer" }}
              />
              {profile.profilePicture && !pendingFile && !pendingRemove && (
                <button
                  className="remove-picture-icon"
                  onClick={handleSetPendingRemove}
                  aria-label="Remove profile picture"
                >
                  ×
                </button>
              )}
            </div>

            {(pendingFile || pendingRemove) && (
              <div className="upload-section">
                <button onClick={handleSavePicture} className="create-task-btn">
                  Save
                </button>
                <button
                  onClick={handleCancelPictureChange}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="name-container">
              <h2
                className="editable-name"
                onClick={() => setIsEditing(true)}
                style={{
                  opacity: isEditing ? 0 : 1,
                  pointerEvents: isEditing ? "none" : "auto",
                }}
              >
                {profile.name}
              </h2>
              <div
                className="edit-name-wrapper"
                style={{
                  opacity: isEditing ? 1 : 0,
                  pointerEvents: isEditing ? "auto" : "none",
                }}
              >
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus={isEditing}
                />
                <div className="button-container">
                  <button className="tick-btn" onClick={handleNameUpdate}>
                    <FaCheck className="icon icon-check" data-testid="tick-icon"/>
                  </button>
                  <button
                    className="cross-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(profile.name);
                    }}
                  >
                    <FaTimes className="icon icon-cross" data-testid="cross-icon"/>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
            accept="image/*"
          />

          <div className="profile-stats">
            <div className="stat-card">
              <h2 title={profile.points}>{formatNumber(profile.points)}</h2>
              <p>Points</p>
            </div>
            <div className="stat-card">
              <h2 title={profile.tasksCompleted}>
                {formatNumber(profile.tasksCompleted)}
              </h2>
              <p>Tasks Completed</p>
            </div>
            <div className="stat-card">
              <h2 title={profile.totalHours}>
                {formatNumber(profile.totalHours)}
              </h2>
              <p>Hours Spent</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
