import React, { useEffect, useState } from "react";
import Layout from "../components/navigation/Layout";
import TopBar from "../components/navigation/TopBar";
import { auth } from "../firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getProfileTopBarConfig } from "../config/topBarConfig.jsx";
import "../components/styles.css";

const Profile = () => {
  const [profile, setProfile] = useState({ points: 0, tasksCompleted: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userId = currentUser.uid;
      try {
        const response = await axios.get(
          `http://localhost:5000/api/profile/${userId}`
        );
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <TopBar buttons={getProfileTopBarConfig(() => {}, navigate)} />
      <h1 className="page-title">Profile</h1>
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-stat">
              <h2>{profile.points}</h2>
              <p>Points</p>
            </div>
            <div className="profile-stat">
              <h2>{profile.tasksCompleted}</h2>
              <p>Tasks Completed</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
