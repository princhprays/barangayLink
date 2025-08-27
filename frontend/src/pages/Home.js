import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, isAdmin, isVerified, user, loading } = useAuth();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && !loading) {
      if (isAdmin) {
        setIsRedirecting(true);
        window.location.href = '/admin/dashboard';
      } else if (isVerified) {
        setIsRedirecting(true);
        window.location.href = '/resident/dashboard';
      } else {
        // Pending users stay on home page but see resident view
        setIsRedirecting(false);
      }
    }
  }, [isAuthenticated, isAdmin, isVerified, loading]);

  // Handle hash navigation for smooth scrolling to sections
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        // Add a small delay to ensure the page is fully rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  // Admin-focused home content
  const AdminHome = () => (
    <div className="home">
      <section className="hero admin-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome, <span className="highlight">{user?.name || 'Administrator'}!</span>
            </h1>
            <p className="hero-subtitle">
              Manage your BarangayLink community platform.
            </p>

            <div className="admin-quick-actions">
              <div className="action-card">
                <div className="action-icon">📊</div>
                <h3>Dashboard</h3>
                <p>View system statistics and overview</p>
                <Link to="/admin/dashboard" className="btn btn-primary">Go to Dashboard</Link>
              </div>

              <div className="action-card">
                <div className="action-icon">✅</div>
                <h3>Verifications</h3>
                <p>Review resident applications</p>
                <Link to="/admin/verifications" className="btn btn-primary">Review Applications</Link>
              </div>

              <div className="action-card">
                <div className="action-icon">👥</div>
                <h3>User Management</h3>
                <p>Manage all user accounts</p>
                <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Resident-focused home content
  const ResidentHome = () => (
    <div className="home">
      <section className="hero resident-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="highlight">BarangayLink</span>!
            </h1>
            <p className="hero-subtitle">
              {isVerified
                ? `Hello ${user?.name || 'Resident'}! You're all set to start sharing and borrowing items.`
                : `Hello ${user?.name || 'Resident'}! Your account is pending verification. You'll be notified once approved.`}
            </p>

            {isVerified ? (
              <div className="resident-actions">
                <Link to="/items" className="btn btn-primary btn-large">Browse Available Items</Link>
                <Link to="/my-items" className="btn btn-secondary btn-large">Manage My Items</Link>
              </div>
            ) : (
              <div className="verification-notice">
                <div className="notice-icon">⏳</div>
                <h3>Account Verification Pending</h3>
                <p>Your account is currently under review by our administrators.</p>
                <Link to="/profile" className="btn btn-secondary">View Profile</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="resident-features" className="features">
        <div className="container">
          <h2 className="section-title">What You Can Do</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Donate Items</h3>
              <p>Give items you no longer need to help your community</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Lend Items</h3>
              <p>Share items temporarily with your neighbors</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Find Items</h3>
              <p>Discover items you need from your community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="coming-soon">
        <div className="container">
          <div className="coming-soon-content">
            <h2>Development Roadmap</h2>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-marker current">1</div>
                <div className="timeline-content">
                  <h4>Week 1: Foundation ✅</h4>
                  <p>Backend + Frontend setup, Database connection</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-marker current">2</div>
                <div className="timeline-content">
                  <h4>Week 2: Authentication ✅</h4>
                  <p>User registration, login, JWT tokens</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-marker current">3</div>
                <div className="timeline-content">
                  <h4>Week 3: Verification ✅</h4>
                  <p>Admin approval of resident IDs</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-marker">4</div>
                <div className="timeline-content">
                  <h4>Week 4: Items</h4>
                  <p>Post donations and lending items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Guest-focused home content
  const GuestHome = () => (
    <div className="home">
      {/* Hero Section */}
      <section className="hero guest-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="highlight">BarangayLink</span>
            </h1>
            <p className="hero-subtitle">
              A community-based platform that connects residents and barangay officials through secure item sharing, lending, and community trust building.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large">Register Now</Link>
              <Link to="/login" className="btn btn-secondary btn-large">Login</Link>
            </div>
          </div>
        </div>
      </section>



      {/* What We Do Section */}
      <section id="what-we-do" className="what-we-do">
        <div className="container">
          <h2 className="section-title">What We Do</h2>
          <p className="section-subtitle">
            BarangayLink bridges the gap between residents and barangay officials, creating a secure platform where communities can share resources, build trust, and strengthen neighborly bonds.
          </p>
          <div className="what-we-do-grid">
            <div className="what-we-do-card">
              <div className="card-icon">🔗</div>
              <h3>Connect Communities</h3>
              <p>Bring residents and barangay officials together in a digital space that fosters collaboration and mutual support.</p>
            </div>
            <div className="what-we-do-card">
              <div className="card-icon">🔒</div>
              <h3>Ensure Security</h3>
              <p>Implement verified registration and admin oversight to maintain a safe, trustworthy community environment.</p>
            </div>
            <div className="what-we-do-card">
              <div className="card-icon">🤝</div>
              <h3>Build Trust</h3>
              <p>Create transparent sharing systems that help neighbors build lasting relationships and community bonds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Our simple 4-step process makes community sharing easy and secure.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Register</h3>
              <p>Create your account with valid ID verification and personal details</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Verify</h3>
              <p>Wait for admin approval to ensure community safety and authenticity</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Share Items</h3>
              <p>Donate permanently or lend temporarily to your verified neighbors</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Track & Return</h3>
              <p>Monitor all lending activities, due dates, and successful returns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Benefits Section */}
      <section id="community-benefits" className="community-benefits">
        <div className="container">
          <h2 className="section-title">Community Benefits</h2>
          <p className="section-subtitle">
            Discover how BarangayLink strengthens your community in multiple ways.
          </p>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Save Money</h3>
              <p>Access items you need without buying them, reducing household expenses</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🌱</div>
              <h3>Reduce Waste</h3>
              <p>Give new life to items you no longer need, promoting sustainability</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🏘️</div>
              <h3>Stronger Bonds</h3>
              <p>Build meaningful relationships with neighbors through sharing and cooperation</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🛡️</div>
              <h3>Community Safety</h3>
              <p>Verified identities and admin oversight ensure a secure sharing environment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Moved here */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Why Choose BarangayLink?</h2>
          <p className="section-subtitle">
            Our platform is designed to strengthen community bonds through secure and transparent sharing.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Registration & Verification</h3>
              <p>Residents register with ID verification. Admins approve accounts to ensure community safety and trust.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Item Donations & Lending</h3>
              <p>Donate items permanently or lend them temporarily. All transactions are managed through our secure system.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Admin Dashboard</h3>
              <p>Barangay officials have powerful tools to manage users, verify residents, and oversee community activities.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Transparent Transactions</h3>
              <p>Track all lending activities, due dates, and returns. Build community trust through complete transparency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Marketplace Section */}
      <section id="community-marketplace" className="community-marketplace">
        <div className="container">
          <h2 className="section-title">Community Marketplace</h2>
          <p className="section-subtitle">
            Browse available items from your community. Register to start sharing and borrowing!
          </p>
          <div className="marketplace-preview">
            <div className="marketplace-notice">
              <div className="notice-icon">👀</div>
              <h3>Preview Mode</h3>
              <p>You're currently viewing items in preview mode. Register to request items, lend your own items, and participate in community sharing.</p>
              <div className="marketplace-actions">
                <Link to="/register" className="btn btn-primary">Register Now</Link>
                <Link to="/login" className="btn btn-secondary">Already Have Account?</Link>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* About Us Section */}
      <section id="about" className="about-us">
        <div className="container">
          <h2 className="section-title">About BarangayLink</h2>
          <p className="section-subtitle">
            We're building stronger, more connected communities through technology and trust.
          </p>
          
          <div className="about-content">
            <div className="about-text">
              <h3>Our Mission</h3>
              <p>
                BarangayLink exists to bridge the gap between residents and barangay officials, creating a secure platform 
                where communities can share resources, build trust, and strengthen neighborly bonds. We believe that 
                technology should bring people together, not drive them apart.
              </p>
              
              <h3>Why It Matters</h3>
              <p>
                In today's fast-paced world, maintaining strong community connections is more important than ever. 
                Our platform ensures security through verified identities, builds trust through transparent transactions, 
                and empowers communities to help each other in meaningful ways.
              </p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );

  // Show loading state while redirecting
  if (loading || isRedirecting) {
    return (
      <div className="home">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render by role
  if (isAdmin) return <AdminHome />;
  if (isAuthenticated) return <ResidentHome />;
  return <GuestHome />;
};

export default Home;

