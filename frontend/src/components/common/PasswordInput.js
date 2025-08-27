import React, { useState } from 'react';
import './PasswordInput.css';

const PasswordInput = ({ 
  id, 
  name, 
  value, 
  onChange, 
  placeholder = "Enter password", 
  className = "", 
  required = false,
  error = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-input-container">
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`${className} ${error ? 'error' : ''}`}
        placeholder={placeholder}
        required={required}
        {...props}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={togglePasswordVisibility}
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <svg className="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.35 1.49-2.59 2.54-3.68" />
            <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
            <path d="M23 1 1 23" />
          </svg>
        ) : (
          <svg className="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
