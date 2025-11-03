// frontend/src/components/TopBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import './TopBar.css';
import { MdAccountCircle, MdLogout, MdSettings } from 'react-icons/md';

// --- UPDATED: Accept profilePicUrl and firstName as props ---
function TopBar({ searchTerm, onSearchChange, onLogout, profilePicUrl, firstName, API_BASE_URL }) { 
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); 
  
  // FIX: Use prop data for display name
  const userDisplayName = firstName || 'Admin User';
  
  // FIX: Construct the full server path directly from the prop
  const profilePicSource = profilePicUrl 
    ? `${API_BASE_URL}/${profilePicUrl}` 
    : null; 

  // --- Effect to handle clicks outside the dropdown (Unchanged) ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]); 
  
  // --- Helper function to render the profile image/icon (Uses prop data) ---
  const renderProfileImage = (isHeader = false) => {
    const className = isHeader ? 'header-image' : 'profile-image';
    const WrapperClass = isHeader ? 'header-icon-wrapper' : 'profile-icon-wrapper';
    const PlaceholderClass = isHeader ? 'header-icon-placeholder' : 'profile-icon-placeholder';
    
    return (
      <div className={WrapperClass}>
        {profilePicSource ? (
          <img 
            src={profilePicSource} 
            alt="Profile" 
            className={className}
          />
        ) : (
          <MdAccountCircle className={PlaceholderClass} />
        )}
      </div>
    );
  };

  const handleSettingsClick = (e) => {
      e.preventDefault();
      window.location.hash = 'settings';
      setShowDropdown(false);
  };


  return (
    <div className="topbar">
      <h2 className="topbar-heading">Application Monitor & Inventory Dashboard</h2>
      <div className="topbar-right">
        <input 
          type="text" 
          placeholder="Search applications..." 
          className="search-bar"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        
        {/* Profile Dropdown Container - Attach the ref here */}
        <div className="user-profile-container" ref={dropdownRef}> 
          {/* --- MAIN PROFILE ICON/IMAGE --- */}
          <div className="profile-icon-wrapper" onClick={() => setShowDropdown(!showDropdown)}>
             {renderProfileImage()}
          </div>
          
          {showDropdown && (
            <div className="profile-dropdown-menu">
              
              {/* User Name/Header */}
              <div className="dropdown-header">
                {renderProfileImage(true)}
                <span className="header-name">{userDisplayName}</span>
              </div>
              
              {/* Settings Option */}
              <a href="#settings" className="dropdown-item" onClick={handleSettingsClick}>
                <MdSettings /> Settings
              </a>
              
              {/* Logout Button */}
              <button className="dropdown-item logout-button" onClick={onLogout}>
                <MdLogout /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopBar;