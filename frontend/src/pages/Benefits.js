import React from 'react';
import './Benefits.css';

const Benefits = () => {
  return (
    <div className="benefits-page">
      <div className="container">
        <div className="page-header">
          <h1>Community Benefits</h1>
          <p>Discover the benefits and services available to BarangayLink residents</p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">💰</div>
            <h3>Save Money</h3>
            <p>Access items you need without buying them, reducing household expenses.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">🌱</div>
            <h3>Reduce Waste</h3>
            <p>Give new life to items you no longer need, promoting sustainability.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">🏘️</div>
            <h3>Stronger Bonds</h3>
            <p>Build meaningful relationships with neighbors through sharing and cooperation.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">🛡️</div>
            <h3>Community Safety</h3>
            <p>Verified users and secure transactions ensure safe community interactions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benefits;


