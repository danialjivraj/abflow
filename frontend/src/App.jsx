import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";  // ✅ Import Stats
import Profile from "./pages/Profile";  // ✅ Import Profile
import PrivateRoute from "./components/PrivateRoute"; // Protect dashboard

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/" element={<h1>Welcome to the Priority Management App</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
