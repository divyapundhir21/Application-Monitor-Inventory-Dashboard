// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import './Sidebar.css';
import {
  MdDashboard,
  MdOutlineApps,
  MdAddCircleOutline,
  MdDns,
  MdAdminPanelSettings,
  MdVisibility,
  MdHistory,
  MdVisibilityOff,
  MdPeople
} from 'react-icons/md';

function Sidebar({
  onAddAppClick,
  page,
  setPage,
  onExcelUploadClick,
  currentUser,  // Add this prop
  API_BASE_URL,
  setErrorAlert
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: ''
  });

  const handleNavClick = (newPage) => {
    window.location.hash = newPage;
    setPage(newPage);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized. Please log in again.");
        return;
      }

      const res = await fetch("http://localhost:3000/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add admin.");
        return;
      }

      alert("✅ Admin added successfully!");
      setShowAdminModal(false);
      setFormData({ firstName: "", lastName: "", username: "", password: "" });
    } catch (err) {
      console.error("Error adding admin:", err);
      alert("Something went wrong while adding admin.");
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isAdminOrUser = currentUser?.role === 'admin' || currentUser?.role === 'user';

  return (
    <>
      <div className="sidebar">
        <div className="logo-section">
          <a href="/"><h3 className="app-logo"><MdDns /> App Monitor</h3></a>
        </div>

        <nav className="main-nav">
          <ul>
            <li className={page === 'dashboard' ? 'active' : ''}>
              <a href="#dashboard" onClick={() => handleNavClick('dashboard')}>
                <MdDashboard className="nav-icon" /> Dashboard
              </a>
            </li>
            <li className={page === 'applications' ? 'active' : ''}>
              <a href="#applications" onClick={() => handleNavClick('applications')}>
                <MdOutlineApps className="nav-icon" /> Applications
              </a>
            </li>
            <li className={page === 'history' ? 'active' : ''}>
              <a href="#history" onClick={() => handleNavClick('history')}>
                <MdHistory className="nav-icon" /> Audit History & Logs
              </a>
            </li>
            {isAdmin && (
              <div className="admin-section">
                <h4>ADMIN</h4>
                <div className="add-app-dropdown-container">
                  <button className="add-app-button-header" onClick={() => setShowDropdown(!showDropdown)}>
                    <MdAddCircleOutline className="button-icon side-bar-btn" /> Add Application
                  </button>

                  {showDropdown && (
                    <div className="dropdown-menu side-bar-btn">
                      <a href="#" onClick={(e) => { e.preventDefault(); onAddAppClick(); setShowDropdown(false); }}>Normal Form</a>
                      <a href="#" onClick={(e) => { e.preventDefault(); onExcelUploadClick(); setShowDropdown(false); }}>Excel Upload</a>
                    </div>
                  )}
                </div>

                <button className="add-admin-button" onClick={() => setShowAdminModal(true)}>
                  <MdAdminPanelSettings className="nav-icon" /> Add Admin
                </button>
                <li className={page === 'users' ? 'active' : ''}>
                  <a href="#users" onClick={() => handleNavClick('users')}>
                    <MdPeople className="nav-icon" /> User Management
                  </a>
                </li>
              </div>
            )}
            {isAdminOrUser && (
              <div className="sidebar-section">
                <h3>Applications</h3>
                <button onClick={() => window.location.hash = 'applications'}>
                  Manage Applications
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="sidebar-section">
                <h3>Admin</h3>
                <button onClick={() => window.location.hash = 'admin'}>
                  Manage Users
                </button>
              </div>
            )}
          </ul>
        </nav>
      </div>

      {/* MODAL */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Admin</h3>
            <form className="admin-form" onSubmit={handleAddAdmin}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
              <div className="password-field">
                <input
                  className='add-admin-password-field'
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </span>
              </div>
              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={() => setShowAdminModal(false)}>Cancel</button>
                <button onClick={() => setShowAdminModal(true)}>
                  <MdAddCircleOutline className="button-icon side-bar-btn" /> Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
