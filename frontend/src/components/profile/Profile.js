import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PasswordInput from '../common/PasswordInput';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, updateProfilePicture, changePassword, getProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: '',
    barangay: '',
    contact_number: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pictureLoading, setPictureLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        barangay: user.barangay || '',
        contact_number: user.contact_number || ''
      });
      if (user.profile_picture) {
        setProfilePicturePreview(`/uploads/${user.profile_picture}`);
      }
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setProfilePicturePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(profileData);
      setMessage('Profile updated successfully!');
      
      // Refresh profile data
      await getProfile();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureSubmit = async (e) => {
    e.preventDefault();
    if (!profilePicture) {
      setError('Please select a profile picture');
      return;
    }

    setPictureLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await updateProfilePicture(profilePicture);

      if (response.user) {
        setMessage('Profile picture updated successfully!');
        // Refresh profile data
        await getProfile();
        setProfilePicture(null);
      }
    } catch (error) {
      setError(error.message || 'Failed to update profile picture');
    } finally {
      setPictureLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    setMessage('');
    setError('');

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="container">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information and security</p>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          <button
            className={`tab-button ${activeTab === 'picture' ? 'active' : ''}`}
            onClick={() => setActiveTab('picture')}
          >
            Profile Picture
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        {message && (
          <div className="alert alert-success" onClick={clearMessages}>
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" onClick={clearMessages}>
            {error}
          </div>
        )}

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="profile-info">
                <div className="info-item">
                  <label>Email:</label>
                  <span>{user.email}</span>
                  <small>Email cannot be changed</small>
                </div>
                
                <div className="info-item">
                  <label>Role:</label>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Administrator' : 'Resident'}
                  </span>
                </div>
                
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${user.status || 'pending'}`}>
                    {user.status === 'approved' ? 'Approved' : user.status === 'denied' ? 'Denied' : 'Pending'}
                  </span>
                </div>
                
                <div className="info-item">
                  <label>Verification Status:</label>
                  <span className={`status-badge ${user.is_verified ? 'approved' : 'pending'}`}>
                    {user.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                
                <div className="info-item">
                  <label>Member Since:</label>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="profile-form">
                <h3>Update Profile Information</h3>
                
                <div className="form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileChange}
                    className="form-control"
                    required
                  />
                </div>

                {user.role === 'resident' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="barangay">Barangay</label>
                      <input
                        type="text"
                        id="barangay"
                        name="barangay"
                        value={profileData.barangay}
                        onChange={handleProfileChange}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact_number">Contact Number</label>
                      <input
                        type="tel"
                        id="contact_number"
                        name="contact_number"
                        value={profileData.contact_number}
                        onChange={handleProfileChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'picture' && (
            <div className="picture-tab">
              <div className="current-picture">
                <h3>Current Profile Picture</h3>
                <div className="picture-display">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" className="profile-picture" />
                  ) : (
                    <div className="placeholder-avatar">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfilePictureSubmit} className="picture-form">
                <h3>Upload New Profile Picture</h3>
                
                <div className="form-group">
                  <label htmlFor="profile_picture">Profile Picture</label>
                  <input
                    type="file"
                    id="profile_picture"
                    name="profile_picture"
                    onChange={handleProfilePictureChange}
                    className="form-control"
                    accept="image/*"
                    required
                  />
                  <small className="form-text">
                    Upload an image file (JPG, PNG, GIF). Maximum size: 5MB.
                  </small>
                </div>

                {profilePicturePreview && profilePicture && (
                  <div className="picture-preview">
                    <h4>Preview:</h4>
                    <img src={profilePicturePreview} alt="Preview" className="preview-image" />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={pictureLoading || !profilePicture}
                >
                  {pictureLoading ? 'Uploading...' : 'Upload Picture'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="password-tab">
              <form onSubmit={handlePasswordSubmit} className="password-form">
                <h3>Change Password</h3>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <PasswordInput
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                  <small className="form-text">
                    Password must be at least 6 characters long and contain lowercase, uppercase, and number
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
