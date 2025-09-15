// frontend/src/components/TopBar.jsx
import React from 'react';
import './TopBar.css';
import { MdAccountCircle } from 'react-icons/md'; // Import the user icon

function TopBar({ searchTerm, onSearchChange }) {
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
        <div className="user-profile">
          <MdAccountCircle className="profile-icon" />
        </div>
      </div>
    </div>
  );
}

export default TopBar;