import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { auth } from "../firebase";
import { FaTrophy, FaTasks, FaMedal } from "react-icons/fa"; 

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        axios.get(`http://localhost:5000/api/profile/${currentUser.uid}`)
          .then((res) => setProfileData(res.data))
          .catch((err) => console.error("Error fetching profile data:", err));
      }
    });

    return () => unsubscribe();
  }, []);

  if (!user || !profileData) return <p>Loading profile...</p>;

  return (
    <Layout>
      <div className="profile-container">
        <h1>🏅 Profile Overview</h1>
        <div className="profile-card">
          <h2><FaTrophy /> {profileData.userTitle} <FaMedal /></h2>
          <p><FaTasks /> <strong>Total Tasks Completed:</strong> {profileData.totalTasks}</p>
          <p>⭐ <strong>Total Points:</strong> {profileData.totalPoints}</p>
        </div>
        <div className="profile-achievements">
          <h3>🎯 Keep completing tasks to level up!</h3>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
