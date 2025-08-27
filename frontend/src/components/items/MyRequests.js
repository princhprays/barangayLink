import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/apiClient';
import './Items.css';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/requests/my-requests');
      setRequests(response.data.requests || []);
    } catch (error) {
      setError('Failed to load your requests');
      console.error('Fetch my requests error:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="my-requests">
        <div className="container">
          <div className="loading">Loading your requests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-requests">
        <div className="container">
          <div className="alert alert-danger">{error}</div>
          <button onClick={fetchMyRequests} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-requests">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <div>
              <h1>My Requests</h1>
              <p>Track the status of your item requests</p>
            </div>
                         <Link to="/requests/new" className="btn btn-primary">
               📝 New Request
             </Link>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="no-requests">
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Requests Yet</h3>
              <p>You haven't made any requests yet. Start by browsing available items and creating your first request.</p>
              <div className="empty-actions">
                <Link to="/items" className="btn btn-primary">
                  Browse Items
                </Link>
                <Link to="/requests/new" className="btn btn-outline-primary">
                  Create Request
                </Link>
              </div>
            </div>
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

                <div className="request-details">
                  <div className="purpose">
                    <strong>Your Purpose:</strong>
                    <p>{request.purpose}</p>
                  </div>



                  {request.remarks && (
                    <div className="remarks">
                      <strong>Admin Response:</strong>
                      <p>{request.remarks}</p>
                    </div>
                  )}

                  <div className="request-timestamps">
                    <small>Submitted: {formatDate(request.created_at)}</small>
                    {request.updated_at !== request.created_at && (
                      <small>Updated: {formatDate(request.updated_at)}</small>
                    )}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="request-status-info">
                    <div className="status-message">
                      ⏳ Your request is currently under review by an administrator.
                      You'll receive a notification once it's been processed.
                    </div>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="request-status-info">
                    <div className="status-message approved">
                      ✅ Your request has been approved! 
                      {request.item_type === 'lending' && ' Please return the item by the due date.'}
                    </div>
                    <div className="next-steps">
                      <strong>Next Steps:</strong>
                      <ul>
                        <li>Contact the item owner to arrange pickup</li>
                        {request.item_type === 'lending' && (
                          <li>Ensure you return the item in good condition</li>
                        )}
                        <li>Follow any specific instructions from the admin</li>
                      </ul>
                    </div>
                  </div>
                )}

                {request.status === 'denied' && (
                  <div className="request-status-info">
                    <div className="status-message denied">
                      ❌ Your request was not approved. Please review the admin's feedback below.
                    </div>
                    <div className="denial-reason">
                      <strong>Reason for Denial:</strong>
                      <p>{request.remarks}</p>
                    </div>
                    <div className="next-steps">
                      <strong>What you can do:</strong>
                      <ul>
                        <li>Review the feedback and adjust your request if needed</li>
                        <li>Consider requesting a different item</li>
                        <li>Contact support if you have questions</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="page-actions">
          <Link to="/items" className="btn btn-outline-primary">
            ← Back to Items
          </Link>
          <Link to="/requests/new" className="btn btn-primary">
            📝 New Request
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyRequests;
