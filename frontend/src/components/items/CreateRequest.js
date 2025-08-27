import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/apiClient';
import './Items.css';

const CreateRequest = () => {
  const [formData, setFormData] = useState({
    item_id: '',
    purpose: ''
  });
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableItems();
    // Check if item_id is provided in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('item_id');
    if (itemId) {
      setFormData(prev => ({ ...prev, item_id: itemId }));
    }
  }, []);

  const fetchAvailableItems = async () => {
    try {
      setItemsLoading(true);
      const response = await api.get('/items');
      setAvailableItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch available items:', error);
      setErrors({ general: 'Failed to load available items' });
    } finally {
      setItemsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear general errors
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.item_id) {
      newErrors.item_id = 'Please select an item';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    } else if (formData.purpose.trim().length < 10) {
      newErrors.purpose = 'Purpose must be at least 10 characters long';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await api.post('/requests', formData);
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/my-requests');
        }, 2000);
      }
    } catch (error) {
      console.error('Create request error:', error);
      
      if (error.response?.data?.fieldErrors) {
        setErrors(error.response.data.fieldErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Failed to create request. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getItemTypeIcon = (type) => {
    return type === 'donation' ? '🎁' : '📚';
  };

  if (itemsLoading) {
    return (
      <div className="create-request">
        <div className="container">
          <div className="loading">Loading available items...</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="create-request">
        <div className="container">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Request Submitted Successfully!</h2>
            <p>Your request has been submitted and is pending admin approval.</p>
            <p>Redirecting to your requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-request">
      <div className="container">
        <div className="page-header">
          <h1>Create New Request</h1>
          <p>Request an item from the available donations and lending items</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger">
            {errors.general}
          </div>
        )}

        <div className="request-form-container">
          <form onSubmit={handleSubmit} className="request-form">
            <div className="form-group">
              <label htmlFor="item_id">Select Item *</label>
              <select
                id="item_id"
                name="item_id"
                value={formData.item_id}
                onChange={handleChange}
                className={`form-control ${errors.item_id ? 'is-invalid' : ''}`}
                required
              >
                <option value="">Choose an item...</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {getItemTypeIcon(item.type)} {item.name} - {item.condition} condition
                    {item.owner_barangay && ` (${item.owner_barangay})`}
                  </option>
                ))}
              </select>
              {errors.item_id && (
                <div className="invalid-feedback">{errors.item_id}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="purpose">Purpose/Reason *</label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className={`form-control ${errors.purpose ? 'is-invalid' : ''}`}
                rows="4"
                placeholder="Please describe why you need this item and how you plan to use it..."
                required
              />
              {errors.purpose && (
                <div className="invalid-feedback">{errors.purpose}</div>
              )}
              <small className="form-text">
                Minimum 10 characters. Be specific about your need and intended use.
              </small>
            </div>



            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/items')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        {availableItems.length === 0 && (
          <div className="no-items-available">
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No Items Available</h3>
              <p>There are currently no items available for requests.</p>
              <button onClick={fetchAvailableItems} className="btn btn-primary">
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRequest;
