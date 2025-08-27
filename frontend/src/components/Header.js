import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout, isAdmin, isPending, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuRef = useRef(null);
  const authMenuRef = useRef(null);

  // Check if current route is an admin route, admin on profile page, or resident on profile page
  const isAdminRoute = isAdmin;
  const isResidentRoute = isAuthenticated && !isAdmin;

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the mobile menu toggle button
      if (event.target.closest('.mobile-menu-toggle')) {
        return;
      }
      
      const clickedInsideMobileNav = mobileMenuRef.current && mobileMenuRef.current.contains(event.target);
      const clickedAuthToggle = event.target.closest('.auth-button');
      const clickedInsideAuthMenu = authMenuRef.current && authMenuRef.current.contains(event.target);

      if (!clickedInsideMobileNav) {
        setShowMobileMenu(false);
      }

      if (!clickedAuthToggle && !clickedInsideAuthMenu) {
        setShowAuthMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track viewport to differentiate mobile vs larger screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    try {
      mq.addEventListener('change', update);
    } catch (e) {
      // Safari fallback
      mq.addListener(update);
    }
    return () => {
      try {
        mq.removeEventListener('change', update);
      } catch (e) {
        mq.removeListener(update);
      }
    };
  }, []);

  // Auto-close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowAuthMenu(false);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleProfile = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  // Helper function to handle smooth scrolling to sections
  const scrollToSection = (sectionId) => {
    setShowMobileMenu(false); // Close mobile menu
    
    if (location.pathname === '/') {
      // If already on home page, scroll to section
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home page first, then scroll to section
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleHomeClick = () => {
    setShowMobileMenu(false);
    if (isAdminRoute) {
      navigate('/admin/dashboard');
    } else if (isResidentRoute) {
      navigate('/resident/dashboard');
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const toggleMobileMenu = () => {
    console.log('Toggle mobile menu called, current state:', showMobileMenu);
    setShowMobileMenu(prevState => {
      const newState = !prevState;
      console.log('Setting mobile menu to:', newState);
      // When opening the mobile menu, collapse any open dropdowns
      if (newState) {
        setShowUserMenu(false);
        setShowAuthMenu(false);
      }
      return newState;
    });
  };

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Link to="/">
                <h1>BarangayLink</h1>
              </Link>
            </div>
            <div className="loading">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`header ${isAdminRoute ? 'admin-route' : ''} ${isResidentRoute ? 'resident-route' : ''}`}>
      <div className="container">
        <div className="header-content">
          {/* Mobile Menu Toggle - shown on small screens, placed left */}
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label={showMobileMenu ? "Close mobile menu" : "Open mobile menu"}
            aria-expanded={showMobileMenu}
          >
            <span className={`hamburger ${showMobileMenu ? 'active' : ''}`}></span>
          </button>
          <div className="logo">
            <button onClick={handleHomeClick} className="logo-button">
              <h1>BarangayLink</h1>
            </button>
          </div>
          
          <nav className={`nav ${showMobileMenu ? 'mobile-open' : ''}`} ref={mobileMenuRef}>
            <ul className="nav-list">
              {isMobile && (
                <li className="nav-item">
                  <button onClick={handleHomeClick} className="nav-link">Home</button>
                </li>
              )}
              {/* Role-based navigation */}
              {isAdminRoute ? (
                <>
                  <li className="nav-item">
                    <Link 
                      to="/admin/dashboard" 
                      className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/admin/verifications" 
                      className={`nav-link ${location.pathname.startsWith('/admin/verifications') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      Verifications
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/admin/requests" 
                      className={`nav-link ${location.pathname.startsWith('/admin/requests') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      Requests
                    </Link>
                  </li>
                </>
              ) : isResidentRoute ? (
                <>
                  <li className="nav-item">
                    <Link 
                      to="/resident/dashboard" 
                      className={`nav-link ${location.pathname === '/resident/dashboard' ? 'active' : ''} ${isPending ? 'disabled' : ''}`}
                      onClick={isPending ? undefined : closeMobileMenu}
                      title={isPending ? 'Available after admin approval' : undefined}
                    >
                      Community
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item"><button onClick={() => scrollToSection('what-we-do')} className="nav-link">What We Do</button></li>
                  <li className="nav-item"><button onClick={() => scrollToSection('how-it-works')} className="nav-link">How It Works</button></li>
                  <li className="nav-item"><button onClick={() => scrollToSection('community-benefits')} className="nav-link">Community Benefits</button></li>
                  <li className="nav-item"><button onClick={() => scrollToSection('community-marketplace')} className="nav-link">Marketplace</button></li>
                  <li className="nav-item"><button onClick={() => scrollToSection('about')} className="nav-link">About</button></li>
                </>
              )}
            </ul>
          </nav>
          
          {/* User Section - Positioned after navigation */}
          <div className="user-section">
            {isAuthenticated ? (
              <div className="user-menu">
                <button 
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="user-avatar">
                    {user?.profile_picture ? (
                      <img 
                        src={`/uploads/${user.profile_picture}`} 
                        alt="Profile" 
                        className="avatar-image"
                      />
                    ) : (
                      user?.full_name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </span>
                  <span className="user-name">
                    {user?.full_name || user?.name || 'User'}
                    {isAdmin && <span className="role-indicator"> Admin</span>}
                    {!isAdmin && isPending && <span className="status-indicator"> Pending</span>}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-section">
                      <div className="dropdown-title">My Account</div>
                      <button onClick={handleProfile} className="dropdown-item">
                        <span className="item-icon">👤</span>
                        Profile
                      </button>
                    </div>

                    {!isAdmin && (
                      <div className="dropdown-section">
                        <div className="dropdown-title">Requests</div>
                        <Link 
                          to="/my-requests" 
                          className={`dropdown-item ${isPending ? 'disabled' : ''}`}
                          onClick={() => setShowUserMenu(false)}
                          title={isPending ? 'Available after admin approval' : undefined}
                        >
                          <span className="item-icon">🗂️</span>
                          My Requests
                        </Link>
                        <Link 
                          to="/requests/new" 
                          className={`dropdown-item ${isPending ? 'disabled' : ''}`}
                          onClick={() => setShowUserMenu(false)}
                          title={isPending ? 'Available after admin approval' : undefined}
                        >
                          <span className="item-icon">📝</span>
                          Create Request
                        </Link>
                      </div>
                    )}

                    {!isAdmin && (
                      <div className="dropdown-section">
                        <div className="dropdown-title">Items</div>
                        <Link 
                          to="/items/new" 
                          className={`dropdown-item ${isPending ? 'disabled' : ''}`}
                          onClick={() => setShowUserMenu(false)}
                          title={isPending ? 'Available after admin approval' : undefined}
                        >
                          <span className="item-icon">➕</span>
                          Add Item
                        </Link>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="dropdown-section">
                        <div className="dropdown-title">Admin</div>
                        <Link 
                          to="/admin/dashboard" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="item-icon">📊</span>
                          Dashboard
                        </Link>
                        <Link 
                          to="/admin/verifications" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="item-icon">🔍</span>
                          Verifications
                        </Link>
                        <Link 
                          to="/admin/requests" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="item-icon">📝</span>
                          Requests
                        </Link>
                        <Link 
                          to="/admin/users" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="item-icon">👥</span>
                          Manage Users
                        </Link>
                        <Link 
                          to="/admin/management" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="item-icon">👨‍💼</span>
                          Admin Management
                        </Link>
                        <Link 
                          to="/admin/items/pending" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="item-icon">⏳</span>
                          Pending Items
                        </Link>
                      </div>
                    )}

                    <div className="dropdown-section">
                      <button onClick={handleLogout} className="dropdown-item danger">
                        <span className="item-icon">🚪</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              isMobile ? (
                <div className="auth-menu" ref={authMenuRef}>
                  <button 
                    className="auth-button"
                    onClick={() => setShowAuthMenu(prev => !prev)}
                    aria-haspopup="true"
                    aria-expanded={showAuthMenu}
                    aria-label="Open authentication menu"
                  >
                    {/* Modern user icon (SVG) */}
                    <svg className="auth-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="currentColor"/>
                      <path d="M4 20.2C4 16.984 6.984 14 10.2 14h3.6c3.216 0 6.2 2.984 6.2 6.2 0 .994-.806 1.8-1.8 1.8H5.8A1.8 1.8 0 0 1 4 20.2z" fill="currentColor"/>
                    </svg>
                  </button>
                  {showAuthMenu && (
                    <div className="user-dropdown">
                      <div className="dropdown-section">
                        <div className="dropdown-title">Account</div>
                        <Link to="/login" className="dropdown-item" onClick={() => setShowAuthMenu(false)}>
                          <span className="item-icon">🔓</span>
                          Login
                        </Link>
                        <Link to="/register" className="dropdown-item" onClick={() => setShowAuthMenu(false)}>
                          <span className="item-icon">📝</span>
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/auth" className="auth-button">
                  <span className="auth-text">Login / Register</span>
                </Link>
              )
            )}
          </div>
          
          {/* End of header-content */}
        </div>
      </div>
    </header>
  );
};

export default Header;
