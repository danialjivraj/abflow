import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useLocation } from "react-router-dom";
import { topBarConfig } from "../config/topBarConfig";
import "./layout.css";

const Layout = ({ children, openModal, topBarButtons }) => {
  const location = useLocation();
  const buttons = topBarButtons || topBarConfig[location.pathname] || [];

  return (
    <>
      <Sidebar />
      <div className="content-container">
        {buttons.length > 0 && <TopBar buttons={buttons} openModal={openModal} />}
        <div className="main-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default Layout;
