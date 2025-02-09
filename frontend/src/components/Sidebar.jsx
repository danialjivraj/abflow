import { auth } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current path

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <nav>
          <h2>ABFlow</h2><br></br>
          <ul>
            <li
              className={location.pathname === "/dashboard" ? "active" : ""}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </li>
            <li
              className={location.pathname === "/stats" ? "active" : ""}
              onClick={() => navigate("/stats")}
            >
              Stats
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
      <button onClick={() => auth.signOut()} className="logout-btn">
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
