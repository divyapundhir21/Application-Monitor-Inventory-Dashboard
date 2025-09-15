// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import './Sidebar.css';
import { MdDashboard, MdOutlineApps, MdOutlineWarningAmber, MdBarChart, MdAddCircleOutline, MdOutlineSettings, MdDns } from 'react-icons/md';

function Sidebar({ onAddAppClick, page, setPage, onJSONUploadClick, onExcelUploadClick }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNavClick = (newPage) => {
    window.location.hash = newPage;
    setPage(newPage);
  };

  return (
    <div className="sidebar">
      <div className="logo-section">
        <h3 className="app-logo"><MdDns /> App Monitor</h3>
      </div>
      <nav className="main-nav">
        <ul>
          <li className={page === 'dashboard' ? 'active' : ''}>
            <a href="#dashboard" onClick={() => handleNavClick('dashboard')}><MdDashboard className="nav-icon" /> Dashboard</a>
          </li>
          <li className={page === 'applications' ? 'active' : ''}>
            <a href="#applications" onClick={() => handleNavClick('applications')}><MdOutlineApps className="nav-icon" /> Applications</a>
          </li>
        </ul>
      </nav>
      <div className="admin-section">
        <h4>ADMIN</h4>
        <div className="add-app-dropdown-container">
          <button 
            className="add-app-button-header" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MdAddCircleOutline className="button-icon side-bar-btn" /> Add Application
          </button>
          {showDropdown && (
            <div className="dropdown-menu side-bar-btn">
              <a href="#" onClick={(e) => { e.preventDefault(); onAddAppClick(); setShowDropdown(false); }}>Normal Form</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onExcelUploadClick(); setShowDropdown(false); }}>Excel Upload</a>
            </div>
          )}
        </div>
      </div>
      {/* <div className="settings-section">
        <a href="#settings" onClick={() => handleNavClick('settings')} className={page === 'settings' ? 'active' : ''}>
          <MdOutlineSettings className="nav-icon" /> Settings
        </a>
      </div> */}
    </div>
  );
}

export default Sidebar;