import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useLocation } from "react-router-dom";
import { topBarConfig } from "../config/topBarConfig";

const Layout = ({ children, openModal }) => {
  const location = useLocation();
  const buttons = topBarConfig[location.pathname] || [];

  return (
    <div className="dashboard-container">
      {/* Sidebar (Fixed Width) */}
      <div className="sidebar-container">
        <Sidebar />
      </div>

      {/* Top Bar (Conditional Rendering) */}
      {buttons.length > 0 && <TopBar buttons={buttons} openModal={openModal} />}

      {/* Main Content Wrapper (Applies to ALL Pages) */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;