import React, { useState, useEffect } from 'react';
import api from '../../lib/apiClient';
import './AdminDashboard.css';
import '../items/Items.css';

const RequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filters, currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        ...filters
      });
      
      const response = await api.get(`/admin/requests?${params}`);
      setRequests(response.data.requests || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      setError('Failed to load requests');
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleAction = async (requestId, action) => {
    if (!remarks.trim() && action === 'deny') {
      alert('Please provide a reason for denial');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/requests/${requestId}/${action}`, {
        remarks: remarks.trim() || undefined
      });

      if (response.data.success) {
        // Update the request in the list
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === 'approve' ? 'approved' : 'denied', remarks: remarks.trim() || req.remarks }
            : req
        ));
        
        setShowModal(false);
        setSelectedRequest(null);
        setRemarks('');
        
        // Refresh the list
        fetchRequests();
      }
    } catch (error) {
      console.error(`${action} request error:`, error);
      alert(`Failed to ${action} request. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (request, action) => {
    setSelectedRequest({ ...request, action });
    setRemarks('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setRemarks('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: '⏳ Pending', color: '#f39c12' },
      approved: { class: 'status-approved', text: '✅ Approved', color: '#27ae60' },
      denied: { class: 'status-denied', text: '❌ Denied', color: '#e74c3c' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span 
        className={`status-badge ${config.class}`}
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemTypeIcon = (type) => {
    return type === 'donation' ? '🎁' : '📚';
  };

  const getStatusCount = (status) => {
    return requests.filter(req => req.status === status).length;
  };

  if (loading) {
    return (
      <div className="request-management">
        <div className="container">
          <div className="loading">Loading requests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-management">
        <div className="container">
          <div className="alert alert-danger">{error}</div>
          <button onClick={fetchRequests} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="request-management">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <div>
              <h1>Request Management</h1>
              <p>Review and manage item requests from residents</p>
            </div>
            <div className="header-actions">
              <button onClick={fetchRequests} className="btn btn-outline-primary">
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="status-summary">
          <div className="status-card">
            <span className="status-count pending">{getStatusCount('pending')}</span>
            <span className="status-label">Pending</span>
          </div>
          <div className="status-card">
            <span className="status-count approved">{getStatusCount('approved')}</span>
            <span className="status-label">Approved</span>
          </div>
          <div className="status-card">
            <span className="status-count denied">{getStatusCount('denied')}</span>
            <span className="status-label">Denied</span>
          </div>
          <div className="status-card">
            <span className="status-count total">{requests.length}</span>
            <span className="status-label">Total</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="status">Status:</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by item name or resident..."
              className="form-control"
            />
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Requests Found</h3>
            <p>There are no requests matching your current filters.</p>
            <button onClick={() => setFilters({ status: 'all', search: '' })} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <h3>{request.item_name}</h3>
                    <div className="request-meta">
                      <span className="item-type">
                        {getItemTypeIcon(request.item_type)} {request.item_type}
                      </span>
                      <span className="item-condition">
                        Condition: {request.item_condition}
                      </span>
                      
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="requester-info">
                  <strong>Requested by:</strong> {request.resident_name} ({request.resident_email})
                  <br />
                  <strong>Barangay:</strong> {request.resident_barangay}
                  <br />
                  <strong>Submitted:</strong> {formatDate(request.created_at)}
                </div>

                <div className="request-details">
                  <div className="purpose">
                    <strong>Purpose:</strong>
                    <p>{request.purpose}</p>
                  </div>



                  {request.remarks && (
                    <div className="remarks">
                      <strong>Admin Response:</strong>
                      <p>{request.remarks}</p>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      onClick={() => openActionModal(request, 'approve')}
                      className="btn btn-success"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => openActionModal(request, 'deny')}
                      className="btn btn-danger"
                    >
                      ❌ Deny
                    </button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="approved-note">
                    ✅ Request approved on {formatDate(request.updated_at)}
                  </div>
                )}

                {request.status === 'denied' && (
                  <div className="denied-note">
                    ❌ Request denied on {formatDate(request.updated_at)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline-primary"
            >
              ← Previous
            </button>
            
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline-primary"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedRequest.action === 'approve' ? 'Approve' : 'Deny'} Request
              </h3>
              <button onClick={closeModal} className="close-btn">&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="request-summary">
                <strong>Item:</strong> {selectedRequest.item_name}
                <br />
                <strong>Resident:</strong> {selectedRequest.resident_name}
                <br />
                <strong>Purpose:</strong> {selectedRequest.purpose}
              </div>

              {selectedRequest.action === 'deny' && (
                <div className="form-group">
                  <label htmlFor="remarks">Reason for Denial *</label>
                  <textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="form-control"
                    rows="4"
                    placeholder="Please provide a reason for denying this request..."
                    required
                  />
                </div>
              )}

              {selectedRequest.action === 'approve' && (
                <div className="form-group">
                  <label htmlFor="remarks">Optional Remarks</label>
                  <textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="form-control"
                    rows="4"
                    placeholder="Add any special instructions or notes..."
                  />
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeModal} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, selectedRequest.action)}
                className={`btn ${selectedRequest.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                disabled={actionLoading || (selectedRequest.action === 'deny' && !remarks.trim())}
              >
                {actionLoading ? 'Processing...' : (selectedRequest.action === 'approve' ? 'Approve' : 'Deny')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;
