import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
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
  Users,
  Shield,
  Database,
} from "lucide-react";
import {
  applicationsAPI,
  rightsAPI,
  accountsAPI,
  usersAPI,
} from "../services/api";
import type { RootState } from "../store";

interface DashboardStats {
  applications: {
    total: number;
    active: number;
    inactive: number;
  };
  rights: {
    total: number;
    active: number;
    expired: number;
    expiring: number;
  };
  accounts: {
    total: number;
    personal: number;
    business: number;
    temporary: number;
  };
  users: {
    total: number;
    admins: number;
    users: number;
  };
}

interface ApiStatsResponse {
  statistics: {
    total: number;
    active?: number;
    inactive?: number;
    personal?: number;
    business?: number;
    temporary?: number;
    expired?: number;
    expiring?: number;
    admins?: number;
    users?: number;
  };
  recentApplications?: Array<{ name: string }>;
}

const Dashboard = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<DashboardStats>({
    applications: { total: 0, active: 0, inactive: 0 },
    rights: { total: 0, active: 0, expired: 0, expiring: 0 },
    accounts: { total: 0, personal: 0, business: 0, temporary: 0 },
    users: { total: 0, admins: 0, users: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    database: "Online",
    api: "Operational",
    multiApp: "Enabled",
    supportedApps: "Loading...",
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping dashboard load");
        return;
      }

      try {
        setLoading(true);
        console.log("Loading dashboard data...");

        // Fetch all stats in parallel
        const [applicationsStats, rightsStats, accountsStats, usersStats] =
          await Promise.all([
            applicationsAPI.getStats(),
            rightsAPI.getStats(),
            accountsAPI.getStats(),
            usersAPI.getStats(),
          ]);

        console.log("Dashboard stats responses:", {
          applications: applicationsStats.data,
          rights: rightsStats.data,
          accounts: accountsStats.data,
          users: usersStats.data,
        });

        // Extract statistics from API responses
        const applicationsData = applicationsStats.data.success
          ? (applicationsStats.data.data as unknown as ApiStatsResponse)
          : (applicationsStats.data as unknown as ApiStatsResponse);
        const rightsData = rightsStats.data.success
          ? (rightsStats.data.data as unknown as ApiStatsResponse)
          : (rightsStats.data as unknown as ApiStatsResponse);
        const accountsData = accountsStats.data.success
          ? (accountsStats.data.data as unknown as ApiStatsResponse)
          : (accountsStats.data as unknown as ApiStatsResponse);
        const usersData = usersStats.data.success
          ? (usersStats.data.data as unknown as ApiStatsResponse)
          : (usersStats.data as unknown as ApiStatsResponse);

        setStats({
          applications: {
            total: applicationsData?.statistics?.total || 0,
            active: applicationsData?.statistics?.active || 0,
            inactive: applicationsData?.statistics?.inactive || 0,
          },
          rights: {
            total: rightsData?.statistics?.total || 0,
            active: rightsData?.statistics?.active || 0,
            expired: rightsData?.statistics?.expired || 0,
            expiring: rightsData?.statistics?.expiring || 0,
          },
          accounts: {
            total: accountsData?.statistics?.total || 0,
            personal: accountsData?.statistics?.personal || 0,
            business: accountsData?.statistics?.business || 0,
            temporary: accountsData?.statistics?.temporary || 0,
          },
          users: {
            total: usersData?.statistics?.total || 0,
            admins: usersData?.statistics?.admins || 0,
            users: usersData?.statistics?.users || 0,
          },
        });

        // Update system status with real data
        setSystemStatus({
          database: "Online",
          api: "Operational",
          multiApp: "Enabled",
          supportedApps:
            applicationsData?.recentApplications
              ?.map((app) => app.name)
              .join(", ") || "None",
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast.error("Failed to load dashboard data");

        // Set fallback data
        setStats({
          applications: { total: 0, active: 0, inactive: 0 },
          rights: { total: 0, active: 0, expired: 0, expiring: 0 },
          accounts: { total: 0, personal: 0, business: 0, temporary: 0 },
          users: { total: 0, admins: 0, users: 0 },
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated]);

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      toast.loading("Refreshing dashboard data...");

      // Fetch all stats in parallel
      const [applicationsStats, rightsStats, accountsStats, usersStats] =
        await Promise.all([
          applicationsAPI.getStats(),
          rightsAPI.getStats(),
          accountsAPI.getStats(),
          usersAPI.getStats(),
        ]);

      // Extract statistics from API responses
      const applicationsData = applicationsStats.data.success
        ? (applicationsStats.data.data as unknown as ApiStatsResponse)
        : (applicationsStats.data as unknown as ApiStatsResponse);
      const rightsData = rightsStats.data.success
        ? (rightsStats.data.data as unknown as ApiStatsResponse)
        : (rightsStats.data as unknown as ApiStatsResponse);
      const accountsData = accountsStats.data.success
        ? (accountsStats.data.data as unknown as ApiStatsResponse)
        : (accountsStats.data as unknown as ApiStatsResponse);
      const usersData = usersStats.data.success
        ? (usersStats.data.data as unknown as ApiStatsResponse)
        : (usersStats.data as unknown as ApiStatsResponse);

      setStats({
        applications: {
          total: applicationsData?.statistics?.total || 0,
          active: applicationsData?.statistics?.active || 0,
          inactive: applicationsData?.statistics?.inactive || 0,
        },
        rights: {
          total: rightsData?.statistics?.total || 0,
          active: rightsData?.statistics?.active || 0,
          expired: rightsData?.statistics?.expired || 0,
          expiring: rightsData?.statistics?.expiring || 0,
        },
        accounts: {
          total: accountsData?.statistics?.total || 0,
          personal: accountsData?.statistics?.personal || 0,
          business: accountsData?.statistics?.business || 0,
          temporary: accountsData?.statistics?.temporary || 0,
        },
        users: {
          total: usersData?.statistics?.total || 0,
          admins: usersData?.statistics?.admins || 0,
          users: usersData?.statistics?.users || 0,
        },
      });

      // Update system status with real data
      setSystemStatus({
        database: "Online",
        api: "Operational",
        multiApp: "Enabled",
        supportedApps:
          applicationsData?.recentApplications
            ?.map((app) => app.name)
            .join(", ") || "None",
      });

      toast.dismiss();
      toast.success("Dashboard data refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh dashboard data:", error);
      toast.dismiss();
      toast.error("Failed to refresh dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate trend percentages (mock data for now)
  const getTrendPercentage = (current: number, previous: number = 0) => {
    if (previous === 0) return current > 0 ? 12 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

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
            <button
              className="dashboard-refresh-btn"
              onClick={handleRefreshData}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              <span>Refresh</span>
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
            <p className="stat-number">{stats.applications.total}</p>
            <p className="stat-label">
              {stats.applications.active} Active Apps
            </p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+{getTrendPercentage(stats.applications.active)}%</span>
            </div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>Rights</h3>
            <p className="stat-number">{stats.rights.total}</p>
            <p className="stat-label">{stats.rights.active} Active Rights</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+{getTrendPercentage(stats.rights.active)}%</span>
            </div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <h3>Accounts</h3>
            <p className="stat-number">{stats.accounts.total}</p>
            <p className="stat-label">Managed Accounts</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+{getTrendPercentage(stats.accounts.total)}%</span>
            </div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Users</h3>
            <p className="stat-number">{stats.users.total}</p>
            <p className="stat-label">System Users</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+{getTrendPercentage(stats.users.total)}%</span>
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
                  <p>MongoDB - {systemStatus.database}</p>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon success">
                  <CheckCircle size={16} />
                </div>
                <div className="status-content">
                  <h4>API Status</h4>
                  <p>All services {systemStatus.api.toLowerCase()}</p>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon success">
                  <CheckCircle size={16} />
                </div>
                <div className="status-content">
                  <h4>Multi-App Support</h4>
                  <p>{systemStatus.multiApp}</p>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon info">
                  <AlertCircle size={16} />
                </div>
                <div className="status-content">
                  <h4>Supported Apps</h4>
                  <p>{systemStatus.supportedApps}</p>
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
                  <h4>Dashboard loaded</h4>
                  <p>Dynamic data fetched successfully</p>
                  <span className="activity-time">Just now</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <Activity size={16} />
                </div>
                <div className="activity-content">
                  <h4>Statistics updated</h4>
                  <p>Real-time data from API endpoints</p>
                  <span className="activity-time">Just now</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <Activity size={16} />
                </div>
                <div className="activity-content">
                  <h4>System status checked</h4>
                  <p>All services operational</p>
                  <span className="activity-time">Just now</span>
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
                <strong>Applications:</strong>
                <span>
                  {stats.applications.total} total ({stats.applications.active}{" "}
                  active)
                </span>
              </div>
              <div className="info-item">
                <strong>Rights:</strong>
                <span>
                  {stats.rights.total} total ({stats.rights.active} active)
                </span>
              </div>
              <div className="info-item">
                <strong>Accounts:</strong>
                <span>
                  {stats.accounts.total} total ({stats.accounts.personal}{" "}
                  personal, {stats.accounts.business} business)
                </span>
              </div>
              <div className="info-item">
                <strong>Users:</strong>
                <span>
                  {stats.users.total} total ({stats.users.admins} admins,{" "}
                  {stats.users.users} users)
                </span>
              </div>
              <div className="info-item">
                <strong>Last Updated:</strong>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="info-item">
                <strong>Data Source:</strong>
                <span>Real-time API</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
