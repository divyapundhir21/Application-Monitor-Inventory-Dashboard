// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { MdAccountCircle, MdSave } from 'react-icons/md';

const SettingsPage = ({ setAlert, onLogout, API_BASE_URL }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '' });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // --- Fetch User Info ---
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) throw new Error(data.message || 'Failed to load user data.');

        setProfileData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        });
        setProfilePicUrl(data.profilePicUrl || '');
      } catch (error) {
        setAlert({ message: `Failed to load settings: ${error.message}`, type: 'error' });
      } finally {
        setIsLoadingProfile(false);
      }
      console.log('Fetching user data from:', `${API_BASE_URL}/api/users/me`);
    };

    fetchUserData();
  }, [onLogout, setAlert, API_BASE_URL]); // ✅ Added API_BASE_URL to dependencies

  // --- Profile Update ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile.');

      localStorage.setItem('firstName', profileData.firstName);
      localStorage.setItem('lastName', profileData.lastName); // ✅ added
      setAlert({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setAlert({ message: `Profile Update Error: ${error.message}`, type: 'error' });
    }
  };

  // --- Password Change ---
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setAlert({ message: 'New passwords do not match.', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to change password.');

      setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      setAlert({ message: 'Password changed successfully! Please log in again.', type: 'success' });

      // ✅ Disable inputs briefly before logout
      setTimeout(() => {
        onLogout();
      }, 1500);
    } catch (error) {
      setAlert({ message: `Password Change Error: ${error.message}`, type: 'error' });
    }
  };

  // --- Profile Picture Upload ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAlert({ message: 'Error: File size exceeds the 2MB limit.', type: 'error' });
      e.target.value = null;
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePictureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setAlert({ message: 'Please select an image file first.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('profilePic', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile-picture`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed.');

      setProfilePicUrl(data.profilePicUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      localStorage.setItem('profilePicUrl', data.profilePicUrl);
      setAlert({ message: 'Profile picture updated!', type: 'success' });
    } catch (error) {
      setPreviewUrl(null); // ✅ reset preview on failure
      setSelectedFile(null);
      setAlert({ message: `Upload Error: ${error.message}`, type: 'error' });
    }
  };

  // --- Safe URL construction for profile picture ---
  const currentImageSource = previewUrl
    ? previewUrl
    : profilePicUrl?.startsWith('http')
    ? profilePicUrl
    : profilePicUrl
    ? `${API_BASE_URL}/${profilePicUrl}`
    : null;

  // --- Render ---
  if (isLoadingProfile) return <div className="settings-page-container">Loading Profile...</div>;

  return (
    <div className="settings-page-container">
      <h2>Account Settings</h2>
      <div className="settings-grid">
        {/* Profile Picture */}
        <form
          onSubmit={handlePictureSubmit}
          className="settings-card profile-card"
          encType="multipart/form-data"
        >
          <h3>Profile Photo</h3>
          <div className="profile-picture-area">
            {currentImageSource ? (
              <img src={currentImageSource} alt="Profile" className="profile-img" />
            ) : (
              <MdAccountCircle className="large-profile-icon" />
            )}

            <input
              type="file"
              id="profilePicFile"
              name="profilePic"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <label htmlFor="profilePicFile" className="upload-btn">
              {selectedFile ? selectedFile.name : 'Upload New Photo'}
            </label>
            <button type="submit" className="save-button" style={{ marginTop: '10px' }}>
              <MdSave /> Save Photo
            </button>
          </div>
        </form>

        {/* Basic Details */}
        <form onSubmit={handleProfileUpdate} className="settings-card details-form">
          <h3>Change Basic Details</h3>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={profileData.firstName}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={profileData.lastName}
              onChange={handleProfileChange}
              required
            />
          </div>
          <button type="submit" className="save-button">
            <MdSave /> Save Profile
          </button>
        </form>

        {/* Password */}
        <form onSubmit={handlePasswordChange} className="settings-card password-form">
          <h3>Change Password</h3>
          <div className="form-group">
            <label>Old Password</label>
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordInputChange}
              required
            />
          </div>
          <button type="submit" className="save-button password-btn">
            <MdSave /> Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
