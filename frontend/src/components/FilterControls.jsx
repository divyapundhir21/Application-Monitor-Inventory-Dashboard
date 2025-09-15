// frontend/src/components/FilterControls.jsx
import React, { useState } from 'react';
import './FilterControls.css';
import { MdAddCircleOutline } from 'react-icons/md';
import { FaDownload } from "react-icons/fa";

const FilterControls = ({
  statusFilter,
  setStatusFilter,
  domainFilter,
  setDomainFilter,
  allDomains,
  technicalOwnerFilter,
  setTechnicalOwnerFilter,
  allTechnicalOwners,
  searchTerm,
  setSearchTerm,
  filteredApplications,
  onAddAppClick, // Now used for normal form
  onExcelUploadClick, // New prop for Excel upload
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = () => {
    if (filteredApplications.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = Object.keys(filteredApplications[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n'
      + filteredApplications.map(e => headers.map(header => {
        // Handle nested objects by converting to a string
        const value = e[header];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "applications_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="filter-controls">
      <div className="filters">
        <label>Status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Up">Up</option>
          <option value="Down">Down</option>
        </select>
        <label>Technologies:</label>
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          {allDomains.map(domain => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
        <label>Technical Owner:</label>
        <select value={technicalOwnerFilter} onChange={(e) => setTechnicalOwnerFilter(e.target.value)}>
        {allTechnicalOwners.map(technicalOwner => (
          <option key={technicalOwner} value={technicalOwner}>{technicalOwner}</option>
          ))}
        </select>
      </div>
      <div className="actions">
        <button onClick={handleExport} className="export-button">
            <FaDownload/>
            Export</button>
        <div className="add-app-dropdown-container">
          <button 
            className="add-app-button-header" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MdAddCircleOutline className="button-icon" /> Add Application
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <a href="#" onClick={(e) => { e.preventDefault(); onAddAppClick(); setShowDropdown(false); }}>Normal Form</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onExcelUploadClick(); setShowDropdown(false); }}>Excel Upload</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterControls;