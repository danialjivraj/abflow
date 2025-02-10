import Sidebar from "../components/Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="dashboard-container">
      {/* Sidebar (Fixed Width) */}
      <div className="sidebar-container">
        <Sidebar />
      </div>

      {/* Main Content Wrapper (Applies to ALL Pages) */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;