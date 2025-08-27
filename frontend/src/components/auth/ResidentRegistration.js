import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PasswordInput from '../common/PasswordInput';
import SuccessModal from '../common/SuccessModal';
import './Auth.css';

const ResidentRegistration = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    barangay: '',
    contact_number: '',
    email: '',
    municipality: '',
    province: ''
  });
  const [validIdFile, setValidIdFile] = useState(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState(null);
  const [validIdPreview, setValidIdPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { registerResident, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

    // Clear auth error when user starts typing
    if (error) clearError();
  };

  const handleValidIdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValidType) {
        setErrors(prev => ({ ...prev, validId: 'Please upload an image or PDF file' }));
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, validId: 'File size must be less than 10MB' }));
        return;
      }

      setValidIdFile(file);
      setErrors(prev => ({ ...prev, validId: '' }));

      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setValidIdPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setValidIdPreview('PDF file selected');
      }
    }
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (only images for selfie)
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, selfieWithId: 'Please upload an image file' }));
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, selfieWithId: 'File size must be less than 10MB' }));
        return;
      }

      setSelfieWithIdFile(file);
      setErrors(prev => ({ ...prev, selfieWithId: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setSelfiePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain lowercase, uppercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Barangay validation
    if (!formData.barangay.trim()) {
      newErrors.barangay = 'Barangay is required';
    }

    // Contact number validation
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required';
    } else if (formData.contact_number.length < 10) {
      newErrors.contact_number = 'Contact number must be at least 10 digits';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Municipality validation
    if (!formData.municipality.trim()) {
      newErrors.municipality = 'Municipality is required';
    }

    // Province validation
    if (!formData.province.trim()) {
      newErrors.province = 'Province is required';
    }

    // File validation
    if (!validIdFile) {
      newErrors.validId = 'Valid ID document is required';
    }
    if (!selfieWithIdFile) {
      newErrors.selfieWithId = 'Selfie with ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('barangay', formData.barangay);
      formDataToSend.append('contact_number', formData.contact_number);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('municipality', formData.municipality);
      formDataToSend.append('province', formData.province);
      
      if (validIdFile) {
        formDataToSend.append('valid_id', validIdFile);
      }
      if (selfieWithIdFile) {
        formDataToSend.append('selfie_with_id', selfieWithIdFile);
      }

      const response = await registerResident(formDataToSend);
      
      if (response.success) {
        // Show success modal instead of alert
        setSuccessMessage(response.message || 'Your account has been created successfully! 🎉');
        setShowSuccessModal(true);
      }
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    navigate('/auth?form=login');
  };



  return (
    <>
      <div className="auth-form">
        <h2>Resident Registration</h2>
        <p className="auth-subtitle">Create your BarangayLink account</p>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
              />
              {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="full_name" className="form-label">Full Name *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {errors.full_name && <div className="invalid-feedback">{errors.full_name}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password *</label>
              <PasswordInput
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="barangay" className="form-label">Barangay *</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                className={`form-control ${errors.barangay ? 'is-invalid' : ''}`}
                value={formData.barangay}
                onChange={handleChange}
                placeholder="Enter your barangay"
              />
              {errors.barangay && <div className="invalid-feedback">{errors.barangay}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="contact_number" className="form-label">Contact Number *</label>
              <input
                type="tel"
                id="contact_number"
                name="contact_number"
                className={`form-control ${errors.contact_number ? 'is-invalid' : ''}`}
                value={formData.contact_number}
                onChange={handleChange}
                placeholder="Enter contact number"
              />
              {errors.contact_number && <div className="invalid-feedback">{errors.contact_number}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Gmail Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Gmail address"
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="municipality" className="form-label">Municipality *</label>
              <input
                type="text"
                id="municipality"
                name="municipality"
                className={`form-control ${errors.municipality ? 'is-invalid' : ''}`}
                value={formData.municipality}
                onChange={handleChange}
                placeholder="Enter municipality"
              />
              {errors.municipality && <div className="invalid-feedback">{errors.municipality}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="province" className="form-label">Province *</label>
              <input
                type="text"
                id="province"
                name="province"
                className={`form-control ${errors.province ? 'is-invalid' : ''}`}
                value={formData.province}
                onChange={handleChange}
                placeholder="Enter province"
              />
              {errors.province && <div className="invalid-feedback">{errors.province}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="valid_id" className="form-label">Valid ID Document *</label>
              <input
                type="file"
                id="valid_id"
                name="valid_id"
                className={`form-control ${errors.validId ? 'is-invalid' : ''}`}
                onChange={handleValidIdChange}
                accept="image/*,.pdf"
              />
              {errors.validId && <div className="invalid-feedback">{errors.validId}</div>}
              {validIdPreview && (
                <div className="image-preview">
                  {validIdPreview.startsWith('data:') ? (
                    <img src={validIdPreview} alt="ID Preview" />
                  ) : (
                    <p className="preview-label">{validIdPreview}</p>
                  )}
                  <button type="button" className="btn btn-outline-danger" onClick={() => { setValidIdFile(null); setValidIdPreview(''); }}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="selfie_with_id" className="form-label">Selfie with ID *</label>
              <input
                type="file"
                id="selfie_with_id"
                name="selfie_with_id"
                className={`form-control ${errors.selfieWithId ? 'is-invalid' : ''}`}
                onChange={handleSelfieChange}
                accept="image/*"
              />
              {errors.selfieWithId && <div className="invalid-feedback">{errors.selfieWithId}</div>}
              {selfiePreview && (
                <div className="image-preview">
                  <img src={selfiePreview} alt="Selfie Preview" />
                  <button type="button" className="btn btn-outline-danger" onClick={() => { setSelfieWithIdFile(null); setSelfiePreview(''); }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="btn-link"
              onClick={onSwitchToLogin}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onContinue={handleSuccessContinue}
        message={successMessage}
        title="🎉 Welcome to BarangayLink!"
      />
    </>
  );
};

export default ResidentRegistration;
