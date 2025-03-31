import Sidebar from "../navigation/Sidebar";
import TopBar from "../navigation/TopBar";
import "./layout.css";

const Layout = ({ children, topBarButtons = [] }) => {
  return (
    <>
      <Sidebar />
      <div className="content-container">
        {topBarButtons.length > 0 && <TopBar buttons={topBarButtons} />}
        <div className="main-content">{children}</div>
      </div>
    </>
  );
};

export default Layout;
