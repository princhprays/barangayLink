import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <div className="container">
        {/* Header Section */}
        <section className="about-header">
          <h1>About BarangayLink</h1>
          <p className="lead">
            Building stronger communities through trust, sharing, and mutual support.
          </p>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              BarangayLink aims to strengthen barangay communities by providing a secure 
              platform for residents to share resources, lend items, and build trust through 
              transparent transactions. We believe that strong communities are built on 
              generosity, accountability, and mutual support.
            </p>
          </div>
        </section>

        {/* Vision Section */}
        <section className="vision-section">
          <div className="vision-content">
            <h2>Our Vision</h2>
            <p>
              We envision a future where every barangay in the Philippines has access to 
              a digital platform that fosters community spirit, reduces waste through 
              sharing, and builds lasting relationships among neighbors. Technology should 
              bring people together, not drive them apart.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">🤝</div>
              <h3>Community First</h3>
              <p>Every feature and decision is made with the community's best interest in mind.</p>
            </div>
            
            <div className="value-item">
              <div className="value-icon">🔒</div>
              <h3>Security & Trust</h3>
              <p>We prioritize the safety and verification of all community members.</p>
            </div>
            
            <div className="value-item">
              <div className="value-icon">♻️</div>
              <h3>Sustainability</h3>
              <p>Promoting resource sharing to reduce waste and environmental impact.</p>
            </div>
            
            <div className="value-item">
              <div className="value-icon">📱</div>
              <h3>Accessibility</h3>
              <p>Making technology accessible to all community members regardless of tech experience.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <h2>How BarangayLink Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Registration & Verification</h3>
              <p>
                Residents register with valid identification. Admins verify each account 
                to ensure community safety and authenticity.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3>Item Sharing</h3>
              <p>
                Users can donate items permanently or lend them temporarily. All items 
                go through admin review before becoming available.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3>Request & Approval</h3>
              <p>
                Residents browse available items and submit requests. Admins review 
                and approve requests based on community guidelines.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <h3>Community Connection</h3>
              <p>
                The platform facilitates safe exchanges and builds lasting relationships 
                among community members.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <h2>Our Team</h2>
          <p className="team-intro">
            BarangayLink is developed by a team passionate about community development 
            and technology. We believe in the power of local communities and are committed 
            to building tools that strengthen them.
          </p>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">👨‍💻</div>
              <h3>Development Team</h3>
              <p>Building the platform with modern web technologies</p>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">👥</div>
              <h3>Community Advisors</h3>
              <p>Barangay officials and residents providing feedback</p>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">🔧</div>
              <h3>Support Team</h3>
              <p>Ensuring smooth operation and user assistance</p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <h2>Get in Touch</h2>
          <p>
            Have questions or suggestions? We'd love to hear from you as we build 
            this platform for your community.
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <strong>Email:</strong> info@barangaylink.com
            </div>
            <div className="contact-item">
              <strong>Development:</strong> This is an open-source project
            </div>
            <div className="contact-item">
              <strong>Community:</strong> Join us in building stronger barangays
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
