import { auth } from "../../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <nav>
          <h2>ABFlow</h2>
          <br />
          <ul>
            <li
              className={location.pathname.startsWith("/dashboard") ? "active" : ""}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </li>
            <li
              className={location.pathname.startsWith("/charts") ? "active" : ""}
              onClick={() => navigate("/charts")}
            >
              Charts
            </li>
            <li
              className={location.pathname === "/profile" ? "active" : ""}
              onClick={() => navigate("/profile")}
            >
              Profile
            </li>
          </ul>
        </nav>
      </div>
      <button
        onClick={() => navigate("/settings/productivity-ux")}
        className={`settings-btn ${location.pathname.startsWith("/settings") ? "active" : ""}`}
      >
        Settings
      </button>
      <button onClick={() => auth.signOut()} className="logout-btn">
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
