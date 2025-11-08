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
                <li className={page === 'users' ? 'active' : ''}>
                  <a href="#users" onClick={() => handleNavClick('users')}>
                    <MdPeople className="nav-icon" /> User Management
                  </a>
                </li>
              </div>
            )}
          </ul>
        </nav>
      </div>
  );
}
export default Sidebar;
