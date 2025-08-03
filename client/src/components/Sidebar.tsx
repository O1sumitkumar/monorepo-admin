import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import {
  LayoutDashboard,
  Rocket,
  Shield,
  Users,
  User,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";
import type { RootState, AppDispatch } from "../store";

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-layout">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        <Menu size={20} />
      </button>

      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">
              <Shield size={24} />
            </div>
            <div className="logo-text">
              <h2>APP-ADMIN</h2>
              <p>Multi-Application Management</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronRight size={16} className="nav-arrow" />
          </Link>
          <Link
            to="/applications"
            className={`nav-item ${isActive("/applications") ? "active" : ""}`}
          >
            <Rocket size={18} />
            <span>Applications</span>
            <ChevronRight size={16} className="nav-arrow" />
          </Link>
          <Link
            to="/rights"
            className={`nav-item ${isActive("/rights") ? "active" : ""}`}
          >
            <Shield size={18} />
            <span>Rights</span>
            <ChevronRight size={16} className="nav-arrow" />
          </Link>
          <Link
            to="/accounts"
            className={`nav-item ${isActive("/accounts") ? "active" : ""}`}
          >
            <Users size={18} />
            <span>Accounts</span>
            <ChevronRight size={16} className="nav-arrow" />
          </Link>
          <Link
            to="/users"
            className={`nav-item ${isActive("/users") ? "active" : ""}`}
          >
            <User size={18} />
            <span>Users</span>
            <ChevronRight size={16} className="nav-arrow" />
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <p className="user-name">Welcome, {user?.username || "Admin"}!</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">{children}</div>
    </div>
  );
};

export default Sidebar;
