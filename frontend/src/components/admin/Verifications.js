import React, { useState, useEffect } from 'react';
import api from '../../lib/apiClient';
import './AdminDashboard.css';

const Verifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  // Add keyboard support for image modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showImageModal) return;
      
      switch (e.key) {
        case 'Escape':
          closeImageModal();
          break;
        case 'Enter':
        case ' ':
          toggleImageZoom();
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          break;
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/verifications');
      setVerifications(response.data.verifications);
    } catch (error) {
      setError('Failed to load verifications');
      console.error('Verifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setProcessing(true);
      await api.put(`/admin/verifications/${userId}/approve`);
      
      // Update local state
      setVerifications(prev => 
        prev.filter(v => v.id !== userId)
      );
      
      // Show success message
      alert('Resident verification approved successfully!');
      
    } catch (error) {
      alert('Failed to approve verification: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (userId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/admin/verifications/${userId}/reject`, {
        reason: rejectReason
      });
      
      // Update local state
      setVerifications(prev => 
        prev.filter(v => v.id !== userId)
      );
      
      // Close modal and reset
      setShowModal(false);
      setSelectedUser(null);
      setRejectReason('');
      
      // Show success message
      alert('Resident verification rejected');
      
    } catch (error) {
      alert('Failed to reject verification: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setRejectReason('');
  };

  const openImageModal = (imageSrc, imageAlt) => {
    setSelectedImage({ src: imageSrc, alt: imageAlt });
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setIsImageZoomed(false);
    setImagePosition({ x: 0, y: 0 });
    setImageLoaded(false);
  };

  const toggleImageZoom = () => {
    setIsImageZoomed(!isImageZoomed);
    if (!isImageZoomed) {
      // When zooming in, start from current position
      setImagePosition({ x: 0, y: 0 });
    } else {
      // When zooming out, reset position
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (!isImageZoomed) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isImageZoomed) return;
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">Loading verifications...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="alert alert-danger">{error}</div>
          <button onClick={fetchVerifications} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Resident Verifications</h1>
          <p>Review and manage resident verification applications</p>
        </div>

        {verifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No Pending Verifications</h3>
            <p>All resident applications have been reviewed</p>
          </div>
        ) : (
          <div className="verifications-list">
            {verifications.map((user) => (
              <div key={user.id} className="verification-card">
                <div className="verification-header">
                  <div className="user-info">
                    <h3>{user.full_name}</h3>
                    <p className="user-username">@{user.username}</p>
                    <p className="user-email">{user.email}</p>
                    <p className="user-details">
                      {user.role === 'resident' && (
                        <span className="barangay">📍 {user.barangay}, {user.municipality}, {user.province}</span>
                      )}
                      <span className="contact">📞 {user.contact_number}</span>
                    </p>
                  </div>
                  <div className="verification-actions">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={processing}
                      className="btn btn-success"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => openRejectModal(user)}
                      disabled={processing}
                      className="btn btn-danger"
                    >
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
                
                <div className="verification-details">
                  <div className="id-upload">
                    <h4>Government ID Document</h4>
                    {user.valid_id && (
                      <img 
                        src={`/uploads/ids/${user.valid_id}`} 
                        alt="Government ID Document"
                        className="id-preview"
                        onClick={() => openImageModal(`/uploads/ids/${user.valid_id}`, 'Government ID Document')}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    {!user.valid_id && (
                      <p className="no-upload">No ID document uploaded</p>
                    )}
                  </div>
                  
                  <div className="selfie-upload">
                    <h4>Selfie with ID</h4>
                    {user.selfie_with_id && (
                      <img 
                        src={`/uploads/selfies/${user.selfie_with_id}`} 
                        alt="Selfie holding ID"
                        className="selfie-preview"
                        onClick={() => openImageModal(`/uploads/selfies/${user.selfie_with_id}`, 'Selfie holding ID')}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    {!user.selfie_with_id && (
                      <p className="no-upload">No selfie with ID uploaded</p>
                    )}
                  </div>
                  
                  <div className="application-info">
                    <p><strong>Application Date:</strong> {formatDate(user.created_at)}</p>
                    <p><strong>Status:</strong> <span className="status pending">Pending Review</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reject Verification</h3>
                <button onClick={closeModal} className="modal-close">&times;</button>
              </div>
              
              <div className="modal-body">
                <p>Are you sure you want to reject <strong>{selectedUser?.full_name}</strong>'s verification?</p>
                
                <div className="form-group">
                  <label htmlFor="rejectReason">Reason for Rejection:</label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows="3"
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={() => handleReject(selectedUser.id)}
                  disabled={processing || !rejectReason.trim()}
                  className="btn btn-danger"
                >
                  {processing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className="modal-overlay" onClick={closeImageModal}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="image-modal-header">
                <h3>{selectedImage.alt}</h3>
                                 <div className="image-modal-controls">
                   <button onClick={closeImageModal} className="modal-close">&times;</button>
                 </div>
              </div>
              <div className="image-modal-body">
                <div className="image-container">
                  <img 
                    src={selectedImage.src} 
                    alt={selectedImage.alt}
                    className={`modal-image ${isImageZoomed ? 'zoomed' : ''}`}
                    onClick={toggleImageZoom}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                      transform: `scale(${isImageZoomed ? 3 : 1}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                      cursor: isImageZoomed ? 'grab' : 'zoom-in'
                    }}
                                         onLoad={() => {
                       setImageLoaded(true);
                     }}
                  />
                                     {!imageLoaded && <div className="image-loading">Loading...</div>}
                </div>
                <div className="image-info">
                  <p className="image-filename">{selectedImage.src.split('/').pop()}</p>
                  <p className="image-dimensions">
                    {isImageZoomed 
                      ? 'Click to zoom out • Drag to pan around' 
                      : 'Click image to zoom in 3x for detailed view'
                    }
                  </p>
                                     {isImageZoomed && (
                     <p className="zoom-indicator">
                       🔍 Zoomed in 3x • Use mouse to drag and explore
                     </p>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verifications;
