import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, onContinue, message, title = "🎉 Congratulations!" }) => {
  if (!isOpen) return null;

  return (
    <div className="success-modal-overlay">
      <div className="success-modal">
        <div className="success-modal-header">
          <h2>{title}</h2>
        </div>
        
        <div className="success-modal-content">
          <div className="celebration-animation">
            <div className="confetti">
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
            </div>
            <div className="success-icon">🎊</div>
          </div>
          
          <p className="success-message">{message}</p>
          
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-icon">✅</span>
              <span>Account created successfully</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">📋</span>
              <span>Documents submitted for review</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">⏳</span>
              <span>Admin approval pending</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🔒</span>
              <span>Account will be activated after approval</span>
            </div>
          </div>
        </div>
        
        <div className="success-modal-footer">
          <button className="btn btn-primary btn-celebrate" onClick={onContinue}>
            🚀 Continue to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
