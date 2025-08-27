import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';
import ResidentRegistration from './ResidentRegistration';
import './Auth.css';

const Authentication = ({ initialForm = 'login' }) => {
  const location = useLocation();
  const [currentForm, setCurrentForm] = useState(initialForm); // 'login', 'resident'
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Check URL query parameter for form type
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const formParam = urlParams.get('form');
    if (formParam === 'login' || formParam === 'resident') {
      setCurrentForm(formParam);
    }
  }, [location.search]);

  // Sync form based on pathname changes (/login or /register)
  useEffect(() => {
    if (location.pathname.endsWith('/login')) {
      setCurrentForm('login');
    } else if (location.pathname.endsWith('/register')) {
      setCurrentForm('resident');
    }
  }, [location.pathname]);

  // Scroll behavior for different form types
  useEffect(() => {
    const scrollToForm = () => {
      const formElement = document.querySelector('.auth-container');
      if (formElement) {
        const headerHeight = 80; // Approximate header height
        
        if (currentForm === 'resident') {
          // Registration form: Position with proper spacing from header
          const targetScroll = Math.max(0, headerHeight + 20);
          window.scrollTo({ 
            top: targetScroll, 
            behavior: 'smooth' 
          });
        } else {
          // Login form: Scroll to center the form nicely
          const windowHeight = window.innerHeight;
          const formHeight = formElement.offsetHeight;
          const targetScroll = Math.max(0, headerHeight + (windowHeight - formHeight) / 2);
          
          window.scrollTo({ 
            top: targetScroll, 
            behavior: 'smooth' 
          });
        }
      }
    };
    
    // Small delay to ensure the form is rendered
    setTimeout(scrollToForm, 100);
  }, [currentForm]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.is_verified) {
        navigate('/items');
      } else {
        navigate('/profile');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Don't render anything if user is already authenticated
  if (isAuthenticated && user) {
    return null;
  }

  const renderForm = () => {
    switch (currentForm) {
      case 'login':
        return (
          <Login
            onSwitchToRegister={() => {
              setCurrentForm('resident');
              // Update URL so navigation is consistent and can be revisited/bookmarked
              navigate('/register');
            }}
          />
        );
      case 'resident':
        return (
          <ResidentRegistration
            onSwitchToLogin={() => {
              setCurrentForm('login');
              // Update URL when switching back to login
              navigate('/login');
            }}
          />
        );
      default:
        return <Login onSwitchToRegister={() => setCurrentForm('resident')} />;
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-wrapper ${currentForm === 'resident' ? 'resident-form' : ''}`}>
        {renderForm()}
      </div>
    </div>
  );
};

export default Authentication;
