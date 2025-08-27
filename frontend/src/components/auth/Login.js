import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PasswordInput from '../common/PasswordInput';
import './Auth.css';

const Login = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine if identifier is email or username
      const isEmail = formData.identifier.includes('@');
      
      // Prepare login data
      const loginData = {
        password: formData.password
      };
      
      if (isEmail) {
        loginData.email = formData.identifier;
      } else {
        loginData.username = formData.identifier;
      }

      const response = await login(loginData);
      
      // Redirect based on user role after successful login
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.user.is_verified) {
        navigate('/items');
      } else {
        navigate('/profile'); // For pending residents
      }
      
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Welcome Back</h2>
      <p className="auth-subtitle">Sign in to your BarangayLink account</p>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group identifier-field">
          <label htmlFor="identifier" className="form-label">Username or Email</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            className="form-control"
            value={formData.identifier}
            onChange={handleChange}
            required
            placeholder="Enter your username or email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className="form-control"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <button
            type="button"
            className="btn-link"
            onClick={onSwitchToRegister}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
