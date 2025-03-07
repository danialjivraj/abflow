import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useLocation } from "react-router-dom";
import { topBarConfig } from "../config/topBarConfig";

const Layout = ({ children, openModal }) => {
  const location = useLocation();
  const buttons = topBarConfig[location.pathname] || [];

  return (
    <div className="dashboard-container">
      <div className="sidebar-container">
        <Sidebar />
      </div>

      {buttons.length > 0 && <TopBar buttons={buttons} openModal={openModal} />}

      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;