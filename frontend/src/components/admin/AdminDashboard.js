import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/apiClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setStats(response.data.stats);
    } catch (error) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="alert alert-danger">{error}</div>
          <button onClick={fetchDashboardStats} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome to the BarangayLink administration panel</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon pending">📋</div>
            <div className="stat-content">
              <h3>{stats?.pendingVerifications || 0}</h3>
              <p>Pending Verifications</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon approved">✅</div>
            <div className="stat-content">
              <h3>{stats?.approvedResidents || 0}</h3>
              <p>Approved Residents</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rejected">❌</div>
            <div className="stat-content">
              <h3>{stats?.rejectedResidents || 0}</h3>
              <p>Rejected Residents</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon total">👥</div>
            <div className="stat-content">
              <h3>{stats?.totalResidents || 0}</h3>
              <p>Total Residents</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon admins">👨‍💼</div>
            <div className="stat-content">
              <h3>{stats?.totalAdmins || 0}</h3>
              <p>Total Admins</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/admin/verifications" className="action-btn primary">
              <span className="action-icon">🔍</span>
              <div className="action-content">
                <h3>Review Verifications</h3>
                <p>Review and approve/reject resident applications</p>
              </div>
            </Link>

            <Link to="/admin/requests" className="action-btn primary">
              <span className="action-icon">📝</span>
              <div className="action-content">
                <h3>Request Management</h3>
                <p>Review and approve/reject item requests</p>
              </div>
            </Link>

            <Link to="/admin/management" className="action-btn primary">
              <span className="action-icon">👨‍💼</span>
              <div className="action-content">
                <h3>Admin Management</h3>
                <p>Create and manage administrator accounts</p>
              </div>
            </Link>

            <Link to="/admin/users" className="action-btn secondary">
              <span className="action-icon">👥</span>
              <div className="action-content">
                <h3>Manage Users</h3>
                <p>View and manage all user accounts</p>
              </div>
            </Link>

            <Link to="/profile" className="action-btn secondary">
              <span className="action-icon">⚙️</span>
              <div className="action-content">
                <h3>Profile Settings</h3>
                <p>Update your admin profile and settings</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-placeholder">
            <p>Recent verification activities will appear here</p>
            <small>This feature will be enhanced in future updates</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
