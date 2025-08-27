import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Footer.css';

const Footer = () => {
  const { isAuthenticated, isAdmin, isPending } = useAuth();
  const location = useLocation();

  // Check if current route is an admin route, admin on profile page, or resident on profile page
  const isAdminRoute = location.pathname.startsWith('/admin') || (location.pathname === '/profile' && isAdmin);
  const isResidentRoute = location.pathname.startsWith('/items') || location.pathname.startsWith('/my-items') || location.pathname.startsWith('/resident') || location.pathname === '/benefits' || (location.pathname === '/profile' && !isAdmin && isAuthenticated);

  // Helper function to handle smooth scrolling to sections
  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      // If already on home page, scroll to section
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home page first, then scroll to section
      window.location.href = `/#${sectionId}`;
    }
  };

  // Render quick links based on current route and user status
  const renderQuickLinks = () => {
    if (isAdminRoute) {
      // Admin Navigation - Keep minimal in footer per request
      return (
        <ul>
          <li><Link to="/admin/dashboard">📊 Dashboard</Link></li>
          <li><Link to="/admin/users">👥 Manage Users</Link></li>
          <li><Link to="/admin/items/pending">📦 Pending Items</Link></li>
        </ul>
      );
    } else if (isResidentRoute) {
      // Resident Navigation - Enhanced resident links
      return (
        <ul>
          <li>
            <Link 
              to="/resident/dashboard" 
              className={isPending ? 'disabled' : ''}
              title={isPending ? "Available after admin approval" : undefined}
            >
              Dashboard
            </Link>
          </li>
          <li><Link to="/items">Community Items</Link></li>
          <li>
            <Link 
              to="/my-items" 
              className={isPending ? 'disabled' : ''}
              title={isPending ? "Available after admin approval" : undefined}
            >
              My Requests
            </Link>
          </li>
          <li>
            <Link 
              to="/items/new" 
              className={isPending ? 'disabled' : ''}
              title={isPending ? "Available after admin approval" : undefined}
            >
              Add Item
            </Link>
          </li>
          <li><Link to="/benefits">Benefits</Link></li>
          <li><Link to="/profile">My Profile</Link></li>
        </ul>
      );
    } else {
      // Public Navigation - Show landing page links
      return (
        <ul>
          <li><a href="#what-we-do" onClick={(e) => { 
            e.preventDefault(); 
            scrollToSection('what-we-do');
          }}>🎯 What We Do</a></li>
          <li><a href="#how-it-works" onClick={(e) => { 
            e.preventDefault(); 
            scrollToSection('how-it-works');
          }}>⚙️ How It Works</a></li>
          <li><a href="#community-benefits" onClick={(e) => { 
            e.preventDefault(); 
            scrollToSection('community-benefits');
          }}>🎁 Benefits</a></li>
          <li><a href="#community-marketplace" onClick={(e) => { 
            e.preventDefault(); 
            scrollToSection('community-marketplace');
          }}>🛒 Community Marketplace</a></li>
          <li><a href="#about" onClick={(e) => { 
            e.preventDefault(); 
            scrollToSection('about');
          }}>ℹ️ About</a></li>
          
          {/* Admin Navigation for non-admin routes */}
          {isAdmin && (
            <>
              <li><Link to="/admin/dashboard">📊 Admin Dashboard</Link></li>
              <li><Link to="/admin/users">👥 Manage Users</Link></li>
            </>
          )}
          
          {/* Resident Navigation for non-resident routes */}
          {isAuthenticated && !isAdmin && (
            <>
              <li>
                <Link 
                  to="/resident/dashboard" 
                  className={isPending ? 'disabled' : ''}
                  title={isPending ? "Available after admin approval" : undefined}
                >
                  Dashboard
                </Link>
              </li>
              <li><Link to="/items">Community Items</Link></li>
              <li>
                <Link 
                  to="/my-items" 
                  className={isPending ? 'disabled' : ''}
                  title={isPending ? "Available after admin approval" : undefined}
                >
                  My Requests
                </Link>
              </li>
              <li>
                <Link 
                  to="/items/new" 
                  className={isPending ? 'disabled' : ''}
                  title={isPending ? "Available after admin approval" : undefined}
                >
                  Add Item
                </Link>
              </li>
              <li><Link to="/benefits">Benefits</Link></li>
              <li><Link to="/profile">My Profile</Link></li>
            </>
          )}
        </ul>
      );
    }
  };

  return (
    <footer className={`footer ${isAdminRoute ? 'admin-route' : ''} ${isResidentRoute ? 'resident-route' : ''}`}>
      <div className="container">
        <div className="footer-content">
          {/* Main Footer Section */}
          <div className="footer-main">
            <div className="footer-brand">
              <h3>BarangayLink</h3>
              <p>Connecting barangay residents and admins through verified resource sharing and community management.</p>
            </div>
            
            <div className="footer-links">
              <h4>Quick Links</h4>
              {renderQuickLinks()}
            </div>
            
            <div className="footer-contact">
              <h4>Contact</h4>
              <p>📧 support@barangaylink.com</p>
              <p>📱 +63 912 345 6789</p>
              <p>🕒 Mon-Fri: 8AM-6PM</p>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p>&copy; 2025 BarangayLink. All rights reserved.</p>
              <div className="footer-bottom-links">
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
                <a href="/help">Help</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
