import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/apiClient';
import './ResidentDashboard.css';

const ResidentDashboard = () => {
  const { user, isPending } = useAuth();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    itemsBorrowed: 0,
    itemsDonated: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since the backend endpoints might not exist yet
      // In the future, this would be: const response = await api.get('/resident/dashboard');
      setStats({
        pendingRequests: 2,
        approvedRequests: 5,
        itemsBorrowed: 3,
        itemsDonated: 1
      });
    } catch (error) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="resident-dashboard">
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resident-dashboard">
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
    <div className="resident-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Resident Dashboard</h1>
          <p>Welcome {user?.full_name || 'Resident'}, here is your dashboard overview.</p>
          
          {isPending && (
            <div className="pending-notice">
              <div className="alert alert-warning">
                <strong>⚠️ Account Pending Approval</strong>
                <p>Your account is currently pending admin approval. You can browse items and benefits, but cannot request items or add new items until approved.</p>
              </div>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon pending">📋</div>
            <div className="stat-content">
              <h3>{stats.pendingRequests}</h3>
              <p>Requests Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon approved">✅</div>
            <div className="stat-content">
              <h3>{stats.approvedRequests}</h3>
              <p>Requests Approved</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon borrowed">📦</div>
            <div className="stat-content">
              <h3>{stats.itemsBorrowed}</h3>
              <p>Items Borrowed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon donated">🎁</div>
            <div className="stat-content">
              <h3>{stats.itemsDonated}</h3>
              <p>Items Donated</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/profile" className="action-card">
              <div className="action-icon">👤</div>
              <h3>My Profile</h3>
              <p>Edit your details, ID, address, and emergency contact</p>
            </Link>

            <Link to="/items" className="action-card">
              <div className="action-icon">🔍</div>
              <h3>Browse Items</h3>
              <p>Find items to borrow or request from the community</p>
            </Link>

            <Link to="/my-items" className="action-card">
              <div className="action-icon">📋</div>
              <h3>My Requests</h3>
              <p>View and manage your submitted requests with statuses</p>
            </Link>

            <Link 
              to={isPending ? "#" : "/items/new"} 
              className={`action-card ${isPending ? 'disabled' : ''}`}
              onClick={isPending ? (e) => e.preventDefault() : undefined}
              title={isPending ? "Available after admin approval" : undefined}
            >
              <div className="action-icon">➕</div>
              <h3>Add Item</h3>
              <p>Donate or lend an item to the community</p>
              {isPending && <div className="pending-overlay">Pending Approval</div>}
            </Link>

            <Link to="/benefits" className="action-card">
              <div className="action-icon">🎁</div>
              <h3>Benefits</h3>
              <p>Community and Barangay benefits available to residents</p>
            </Link>
          </div>
        </div>

        {isPending && (
          <div className="pending-info">
            <h3>What You Can Do While Pending</h3>
            <div className="pending-actions">
              <div className="pending-action">
                <span className="action-icon">✅</span>
                <div>
                  <h4>Browse Community Items</h4>
                  <p>View available items in your community</p>
                </div>
              </div>
              <div className="pending-action">
                <span className="action-icon">✅</span>
                <div>
                  <h4>View Benefits</h4>
                  <p>See what benefits are available to residents</p>
                </div>
              </div>
              <div className="pending-action">
                <span className="action-icon">✅</span>
                <div>
                  <h4>Manage Profile</h4>
                  <p>Update your personal information and profile picture</p>
                </div>
              </div>
            </div>
            
            <div className="pending-note">
              <p><strong>Note:</strong> You'll be able to request items, add new items, and access all features once an admin approves your account.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentDashboard;
