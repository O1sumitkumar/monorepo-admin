import React from "react";
import {
  Plus,
  Search,
  Bell,
  Activity,
  TrendingUp,
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";

const Dashboard = () => {
  return (
    <>
      {/* Top Header */}
      <div className="top-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>Multi-Application Rights Management System</p>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button className="search-btn">
              <Search size={18} />
            </button>
            <button className="notifications-btn">
              <Bell size={18} />
              <span className="notification-badge">3</span>
            </button>
            <button className="add-btn">
              <Plus size={16} />
              <span>Quick Action</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card blue">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Applications</h3>
            <p className="stat-number">3</p>
            <p className="stat-label">Active Apps</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+12%</span>
            </div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Rights</h3>
            <p className="stat-number">12</p>
            <p className="stat-label">Active Rights</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+8%</span>
            </div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Accounts</h3>
            <p className="stat-number">8</p>
            <p className="stat-label">Managed Accounts</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+15%</span>
            </div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Users</h3>
            <p className="stat-number">15</p>
            <p className="stat-label">System Users</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <div className="content-grid">
          {/* Quick Actions */}
          <div className="section-card">
            <div className="card-header">
              <h2>
                <Zap size={20} />
                Quick Actions
              </h2>
              <p>Common tasks and shortcuts</p>
            </div>
            <div className="action-buttons">
              <a href="/applications" className="action-btn">
                <Plus size={16} />
                <span>Add Application</span>
              </a>
              <a href="/rights" className="action-btn">
                <Activity size={16} />
                <span>Manage Rights</span>
              </a>
              <a href="/accounts" className="action-btn">
                <Activity size={16} />
                <span>Add Account</span>
              </a>
              <a href="/users" className="action-btn">
                <Activity size={16} />
                <span>Add User</span>
              </a>
            </div>
          </div>

          {/* System Status */}
          <div className="section-card">
            <div className="card-header">
              <h2>
                <Activity size={20} />
                System Status
              </h2>
              <p>Real-time system information</p>
            </div>
            <div className="status-grid">
              <div className="status-item">
                <div className="status-icon success">
                  <CheckCircle size={16} />
                </div>
                <div className="status-content">
                  <h4>Database</h4>
                  <p>MongoDB - Online</p>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon success">
                  <CheckCircle size={16} />
                </div>
                <div className="status-content">
                  <h4>API Status</h4>
                  <p>All services operational</p>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon success">
                  <CheckCircle size={16} />
                </div>
                <div className="status-content">
                  <h4>Multi-App Support</h4>
                  <p>Enabled</p>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon info">
                  <AlertCircle size={16} />
                </div>
                <div className="status-content">
                  <h4>Supported Apps</h4>
                  <p>APP-X, APP-Y, APP-Z</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="section-card">
            <div className="card-header">
              <h2>
                <Clock size={20} />
                Recent Activity
              </h2>
              <p>Latest system events</p>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">
                  <Plus size={16} />
                </div>
                <div className="activity-content">
                  <h4>New application added</h4>
                  <p>APP-Z was added to the system</p>
                  <span className="activity-time">2 minutes ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <Activity size={16} />
                </div>
                <div className="activity-content">
                  <h4>Rights updated</h4>
                  <p>User permissions modified for APP-X</p>
                  <span className="activity-time">15 minutes ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <Activity size={16} />
                </div>
                <div className="activity-content">
                  <h4>New user registered</h4>
                  <p>John Doe joined the system</p>
                  <span className="activity-time">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="section-card">
            <div className="card-header">
              <h2>
                <Settings size={20} />
                System Information
              </h2>
              <p>Technical details and configuration</p>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <strong>Database:</strong>
                <span>MongoDB v6.0</span>
              </div>
              <div className="info-item">
                <strong>API Version:</strong>
                <span>v1.2.0</span>
              </div>
              <div className="info-item">
                <strong>Frontend:</strong>
                <span>React 18 + Vite</span>
              </div>
              <div className="info-item">
                <strong>Backend:</strong>
                <span>Node.js + Express</span>
              </div>
              <div className="info-item">
                <strong>Last Updated:</strong>
                <span>Today, 2:30 PM</span>
              </div>
              <div className="info-item">
                <strong>Uptime:</strong>
                <span>99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
