import React, { useEffect, useState } from 'react';
import api from '../../lib/apiClient';

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await api.get('/items/mine');
        setItems(res.data.items || []);
      } catch (err) {
        setError('Failed to load your items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) return <div className="container"><div className="loading">Loading your items...</div></div>;
  if (error) return <div className="container"><div className="alert alert-danger">{error}</div></div>;

  return (
    <div className="container">
      <h1>My Items</h1>
      {items.length === 0 ? (
        <p>You have not posted any items yet.</p>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              {item.photo && (
                <img src={item.photo} alt={item.name} className="item-photo" />
              )}
              <h3>{item.name}</h3>
              <p>Status: <strong>{item.status}</strong></p>
              <div className="meta">
                <span className="badge">{item.type}</span>
                <span className="badge">{item.condition}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyItems;


