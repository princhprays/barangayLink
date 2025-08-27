import React, { useEffect, useState } from 'react';
import api from '../../lib/apiClient';
import './AdminDashboard.css';

const PendingItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items/pending');
      setItems(res.data.items || []);
    } catch (e) {
      setError('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      setProcessingId(id);
      if (action === 'approve') {
        await api.put(`/items/${id}/approve`);
      } else {
        await api.put(`/items/${id}/reject`);
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard"><div className="container"><div className="loading">Loading items...</div></div></div>
    );
  }
  if (error) {
    return (
      <div className="admin-dashboard"><div className="container"><div className="alert alert-danger">{error}</div></div></div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Pending Items</h1>
          <p>Approve or reject newly submitted items</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📦</div><h3>No Pending Items</h3><p>All items have been reviewed</p></div>
        ) : (
          <div className="verifications-list">
            {items.map((it) => (
              <div key={it.id} className="verification-card">
                <div className="verification-header">
                  <div className="user-info">
                    <h3>{it.name}</h3>
                    <p className="user-email">{it.type} • {it.condition}</p>
                    <p className="user-details"><span className="barangay">Owner: {it.owner_name || it.owner_id}</span></p>
                  </div>
                  <div className="verification-actions">
                    <button className="btn btn-success" disabled={processingId===it.id} onClick={() => act(it.id,'approve')}>{processingId===it.id ? 'Processing...' : 'Approve'}</button>
                    <button className="btn btn-danger" disabled={processingId===it.id} onClick={() => act(it.id,'reject')}>{processingId===it.id ? 'Processing...' : 'Reject'}</button>
                  </div>
                </div>
                <div className="verification-details">
                  <div className="id-upload">
                    <h4>Photo</h4>
                    {it.photo && <img src={it.photo} alt={it.name} className="id-preview" onClick={() => window.open(it.photo,'_blank')} />}
                  </div>
                  <div className="application-info">
                    <p><strong>Description:</strong> {it.description || '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingItems;


