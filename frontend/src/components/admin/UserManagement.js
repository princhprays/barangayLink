 import React, { useState, useEffect } from 'react';
import api from '../../lib/apiClient';
import './AdminDashboard.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    role: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role })
      });

      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      setError('Failed to load users');
      console.error('Users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      approved: 'status-badge approved',
      pending: 'status-badge pending',
      rejected: 'status-badge rejected'
    };
    
    const statusLabels = {
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected'
    };

    return (
      <span className={statusClasses[status] || 'status-badge'}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      admin: 'role-badge admin',
      resident: 'role-badge resident'
    };

    const roleLabels = {
      admin: 'Administrator',
      resident: 'Resident'
    };

    return (
      <span className={roleClasses[role] || 'role-badge'}>
        {roleLabels[role] || role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="alert alert-danger">{error}</div>
          <button onClick={fetchUsers} className="btn btn-primary">
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
          <h1>User Management</h1>
          <p>View and manage all user accounts in the system</p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <h3>Filters</h3>
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="statusFilter">Verification Status:</label>
              <select
                id="statusFilter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-control"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="roleFilter">User Role:</label>
              <select
                id="roleFilter"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="form-control"
              >
                <option value="">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="resident">Resident</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setFilters({ status: '', role: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-section">
          <div className="section-header">
            <h3>Users ({pagination.total} total)</h3>
            <div className="pagination-info">
              Page {pagination.page} of {pagination.pages}
            </div>
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No Users Found</h3>
              <p>No users match the current filters</p>
            </div>
          ) : (
            <div className="users-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Barangay</th>
                    <th>Contact</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info-cell">
                          <strong>{user.full_name}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        {user.role === 'resident' 
                          ? getStatusBadge(user.is_verified ? 'approved' : 'pending')
                          : <span className="status-badge approved">N/A</span>
                        }
                      </td>
                      <td>{user.role === 'resident' ? (user.barangay || '-') : 'N/A'}</td>
                      <td>{user.role === 'resident' ? (user.contact_number || '-') : 'N/A'}</td>
                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
