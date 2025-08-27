import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/apiClient';

const AddItem = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'donation',
    name: '',
    description: '',
    condition: 'good',
    due_date: '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    setError('');
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!photo) {
      setError('Please attach an item photo');
      return;
    }
    if (form.type === 'lending' && !form.due_date) {
      setError('Due date is required for lending items');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('type', form.type);
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('condition', form.condition);
      if (form.type === 'lending') data.append('due_date', form.due_date);
      data.append('itemPhoto', photo);

      await api.post('/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Item submitted for admin approval.');
      navigate('/my-items');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Add Item</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="profile-form" style={{ maxWidth: 640 }}>
        <div className="form-group">
          <label>Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="form-control">
            <option value="donation">Donation</option>
            <option value="lending">Lending</option>
          </select>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="e.g., Hammer" />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="form-control" rows={3} />
        </div>

        <div className="form-group">
          <label>Condition</label>
          <select name="condition" value={form.condition} onChange={handleChange} className="form-control">
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        {form.type === 'lending' && (
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" name="due_date" value={form.due_date} onChange={handleChange} className="form-control" />
          </div>
        )}

        <div className="form-group">
          <label>Item Photo</label>
          <input type="file" accept="image/*" onChange={handlePhoto} className="form-control" />
          {preview && (
            <div style={{ marginTop: '0.75rem' }}>
              <img src={preview} alt="Preview" style={{ maxWidth: '200px', borderRadius: 8, border: '1px solid #e1e5e9' }} />
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Item'}
        </button>
      </form>
    </div>
  );
};

export default AddItem;


