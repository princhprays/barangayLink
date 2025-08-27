import React, { useState, useEffect } from 'react';
import api from '../../lib/apiClient';
import PasswordInput from '../common/PasswordInput';
import './AdminManagement.css';

const AdminManagement = () => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    email: '',
    contact_number: ''
  });
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setAdminsLoading(true);
      const response = await api.get('/admin/admins');
      setAdmins(response.data.admins);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setMessage({ type: 'error', text: 'Failed to load admin accounts' });
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setFieldErrors({});

    try {
      const response = await api.post('/admin/create', formData);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setFormData({
          username: '',
          full_name: '',
          password: '',
          email: '',
          contact_number: ''
        });
        fetchAdmins(); // Refresh the list
      }
    } catch (error) {
      if (error.response?.data?.fieldErrors) {
        setFieldErrors(error.response.data.fieldErrors);
        setMessage({ type: 'error', text: error.response.data.message });
      } else {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create admin user' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId, username) => {
    if (username === 'Admin') {
      setMessage({ type: 'error', text: 'Cannot delete the default admin user' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete admin user "${username}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/admins/${adminId}`);
      setMessage({ type: 'success', text: 'Admin user deleted successfully' });
      fetchAdmins(); // Refresh the list
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete admin user' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-management">
      <div className="container">
        <div className="section-header">
          <h2>Admin Management</h2>
          <p>Create and manage administrator accounts</p>
        </div>

        {/* Create Admin Form */}
        <div className="create-admin-section">
          <h3>Create New Admin</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={fieldErrors.username ? 'error' : ''}
                  placeholder="Enter username"
                  required
                />
                {fieldErrors.username && <span className="error-message">{fieldErrors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="full_name">Full Name *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={fieldErrors.full_name ? 'error' : ''}
                  placeholder="Enter full name"
                  required
                />
                {fieldErrors.full_name && <span className="error-message">{fieldErrors.full_name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={fieldErrors.email ? 'error' : ''}
                  placeholder="Enter email address"
                  required
                />
                {fieldErrors.email && <span className="error-message">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="contact_number">Contact Number *</label>
                <input
                  type="tel"
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className={fieldErrors.contact_number ? 'error' : ''}
                  placeholder="Enter contact number"
                  required
                />
                {fieldErrors.contact_number && <span className="error-message">{fieldErrors.contact_number}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
                error={fieldErrors.password}
              />
              {fieldErrors.password && <span className="error-message">{fieldErrors.password}</span>}
              <small className="password-hint">
                Password must be at least 6 characters with lowercase, uppercase, and number
              </small>
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin User'}
            </button>
          </form>
        </div>

        {/* Admin List */}
        <div className="admin-list-section">
          <h3>Admin Accounts</h3>
          
          {adminsLoading ? (
            <div className="loading">Loading admin accounts...</div>
          ) : admins.length === 0 ? (
            <div className="no-admins">No admin accounts found</div>
          ) : (
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Contact Number</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>
                        <span className={`username ${admin.username === 'Admin' ? 'default-admin' : ''}`}>
                          {admin.username}
                          {admin.username === 'Admin' && <span className="default-badge">Default</span>}
                        </span>
                      </td>
                      <td>{admin.full_name}</td>
                      <td>{admin.email}</td>
                      <td>{admin.contact_number}</td>
                      <td>{formatDate(admin.created_at)}</td>
                      <td>
                        {admin.username !== 'Admin' && (
                          <button
                            onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                            className="btn btn-danger btn-sm"
                            title="Delete admin user"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
