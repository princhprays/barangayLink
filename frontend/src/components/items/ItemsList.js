import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/apiClient';
import './Items.css';

const ItemsList = () => {
  const { isAuthenticated, isPending, isVerified } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', type: '', condition: '', barangay: '' });
  const navigate = useNavigate();

  const fetchItems = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
        const qs = params.toString();
        const res = await api.get(`/items${qs ? `?${qs}` : ''}`);
        setItems(res.data.items || []);
      } catch (err) {
        setError('Failed to load items');
      } finally {
        setLoading(false);
      }
    };
  
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.type, filters.condition, filters.barangay]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestItem = (itemId) => {
    navigate(`/requests/new?item_id=${itemId}`);
  };

  if (loading) return <div className="container"><div className="loading">Loading items...</div></div>;
  if (error) return <div className="container"><div className="alert alert-danger">{error}</div></div>;

  return (
    <div className={`${!isAuthenticated ? 'items-page-landing' : ''}`}>
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <div>
              <h1>{!isAuthenticated ? 'Community Items' : 'Browse Items'}</h1>
              <p>Discover items available for donation and lending in your community</p>
            </div>
            {isAuthenticated && !isPending && isVerified && (
              <button 
                onClick={() => navigate('/requests/new')} 
                className="btn btn-primary"
              >
                📝 Create Request
              </button>
            )}
          </div>
        </div>
      
      {/* Show browse-only message for non-authenticated users and pending users */}
      {!isAuthenticated && (
        <div className="alert alert-info browse-only-notice">
          <strong>Browse Only Mode</strong> - You can view community items, register to gain full access.
        </div>
      )}
      {isAuthenticated && isPending && (
        <div className="alert alert-info browse-only-notice">
          <strong>Browse Only Mode</strong> - You can view community items while your account is being reviewed. 
          Requesting items will be available after admin approval.
        </div>
      )}
      
      <div className="items-toolbar">
        <input name="q" value={filters.q} onChange={onChange} placeholder="Search..." className="form-control" />
        <select name="type" value={filters.type} onChange={onChange} className="form-control">
          <option value="">All Types</option>
          <option value="donation">Donation</option>
          <option value="lending">Lending</option>
        </select>
        <select name="condition" value={filters.condition} onChange={onChange} className="form-control">
          <option value="">Any Condition</option>
          <option value="new">New</option>
          <option value="like_new">Like New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>
        <input name="barangay" value={filters.barangay} onChange={onChange} placeholder="Barangay" className="form-control" />
      </div>
      {items.length === 0 ? (
        <div className="no-items">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Items Available</h3>
            <p>There are currently no items available in your community.</p>
            {isAuthenticated && !isPending && isVerified && (
              <button onClick={() => navigate('/items/new')} className="btn btn-primary">
                Add First Item
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className={`item-card ${(!isAuthenticated || isPending) ? 'browse-only' : ''}`}>
              {item.photo && (
                <img src={item.photo} alt={item.name} className="item-photo" />
              )}
              <h3>{item.name}</h3>
              <p>{item.description || 'No description provided.'}</p>
              <div className="meta">
                <span className="badge">{item.type}</span>
                <span className="badge">{item.condition}</span>
                {item.owner_barangay && (
                  <span className="badge location">{item.owner_barangay}</span>
                )}
              </div>
              
              {/* Show different actions based on user status */}
              {!isAuthenticated ? (
                <div className="item-actions disabled">
                  <button className="btn btn-secondary" disabled>
                    Register to Request
                  </button>
                </div>
              ) : !isPending && isVerified ? (
                <div className="item-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleRequestItem(item.id)}
                  >
                    Request Item
                  </button>
                </div>
              ) : isPending ? (
                <div className="item-actions disabled">
                  <button className="btn btn-secondary" disabled>
                    Request Available After Approval
                  </button>
                </div>
              ) : (
                <div className="item-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleRequestItem(item.id)}
                  >
                    Request Item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Page actions for verified users */}
      {isAuthenticated && !isPending && isVerified && (
        <div className="page-actions">
          <button onClick={() => navigate('/my-requests')} className="btn btn-outline-primary">
            View My Requests
          </button>
                     <button onClick={() => navigate('/requests/new')} className="btn btn-primary">
             📝 Create New Request
           </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default ItemsList;


