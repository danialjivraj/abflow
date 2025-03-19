// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Charts from "./pages/Charts";  
import Profile from "./pages/Profile";  
import PrivateRoute from "./components/PrivateRoute"; 
import { NotificationsProvider } from "./contexts/NotificationsContext";

function App() {
  return (
    <NotificationsProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Navigate to="/dashboard/boards" replace />} />
            <Route path="/dashboard/*" element={<Dashboard />} />

            <Route path="/charts" element={<Charts />} />
            <Route path="/charts/grouptasks/:groupKey" element={<Charts />} />
            <Route path="/charts/grouptasks/:groupKey/viewtask/:taskId" element={<Charts />} />

            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </NotificationsProvider>
  );
}

export default App;
