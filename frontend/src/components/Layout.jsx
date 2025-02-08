import Sidebar from "../components/Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="dashboard-container flex h-screen">
      {/* Sidebar (Fixed Width) */}
      <div className="w-64 bg-gray-200 p-4 h-full fixed left-0 top-0">
        <Sidebar />
      </div>

      {/* Main Content Wrapper (Applies to ALL Pages) */}
      <div className="main-content flex-1 p-6 pl-64">
        {children}
      </div>
    </div>
  );
};

export default Layout;
