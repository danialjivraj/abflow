import Sidebar from "../navigation/Sidebar";
import TopBar from "../navigation/TopBar";
import "./layout.css";

const Layout = ({ children, openModal, topBarButtons = [] }) => {
  return (
    <>
      <Sidebar />
      <div className="content-container">
        {topBarButtons.length > 0 && (
          <TopBar buttons={topBarButtons} openModal={openModal} />
        )}
        <div className="main-content">{children}</div>
      </div>
    </>
  );
};

export default Layout;
