import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdBarChart,
  MdPerson,
  MdSettings,
  MdLogout,
} from "react-icons/md";
import LogoutModal from "../modals/LogoutModal";
import "./sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-content">
          <nav>
            <h2>ABFlow</h2>
            <br />
            <ul>
              <li
                className={
                  location.pathname.startsWith("/dashboard") ? "active" : ""
                }
                onClick={() => navigate("/dashboard")}
              >
                <MdDashboard size={20} style={{ marginRight: "8px" }} />
                Dashboard
              </li>
              <li
                className={
                  location.pathname.startsWith("/charts") ? "active" : ""
                }
                onClick={() => navigate("/charts")}
              >
                <MdBarChart size={20} style={{ marginRight: "8px" }} />
                Charts
              </li>
              <li
                className={location.pathname === "/profile" ? "active" : ""}
                onClick={() => navigate("/profile")}
              >
                <MdPerson size={20} style={{ marginRight: "8px" }} />
                Profile
              </li>
            </ul>
          </nav>
        </div>
        <button
          onClick={() => navigate("/settings/productivity-ux")}
          className={`settings-btn ${location.pathname.startsWith("/settings") ? "active" : ""}`}
        >
          <MdSettings size={20} style={{ marginRight: "8px" }} />
          Settings
        </button>
        <button onClick={() => setShowLogoutModal(true)} className="logout-btn">
          <MdLogout size={20} style={{ marginRight: "8px" }} />
          Logout
        </button>
      </aside>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </>
  );
};

export default Sidebar;
