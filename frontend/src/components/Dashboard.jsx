// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import AppCard from './AppCard';
import SummaryCards from './SummaryCards';
import FilterControls from './FilterControls';
import './Dashboard.css';

const Dashboard = ({ 
  applications, 
  isLoading, 
  error, 
  onAppClick, 
  onAddAppClick, 
  onExcelUploadClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [technicalOwnerFilter, setTechnicalOwnerFilter] = useState('All');  

  const appList = Array.isArray(applications) ? applications : [];

  const filteredApplications = appList.filter(app => {
    const nameString = (app?.name || '').toLowerCase();
    const idString = (app?._id?.toString() || '').toLowerCase();
    const searchString = (searchTerm || '').toLowerCase();

    const matchesSearch = nameString.includes(searchString) || idString.includes(searchString);
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter.toLowerCase();
    const matchesDomain = domainFilter === 'All' || app.domain === domainFilter;
    const matchesOwner = technicalOwnerFilter === 'All' || app.technicalOwner ===technicalOwnerFilter;

    return matchesSearch && matchesStatus && matchesDomain && matchesOwner;
  });

  if (isLoading) {
    return <div className="loading">Loading applications...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  const allDomains = ['All', ...new Set(appList.map(app => app.domain))];
  const allTechnicalOwners = ['All', ...new Set(appList.map(app => app.technicalOwner))];
 
  return (
    <div className="dashboard-content">
      <SummaryCards applications={filteredApplications} />
      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        domainFilter={domainFilter}
        setDomainFilter={setDomainFilter}
        allDomains={allDomains}
        technicalOwnerFilter={technicalOwnerFilter}
        setTechnicalOwnerFilter = {setTechnicalOwnerFilter}  
        allTechnicalOwners={allTechnicalOwners}
        filteredApplications={filteredApplications}
        onAddAppClick={onAddAppClick}
        onExcelUploadClick={onExcelUploadClick}
      />
      <div className="application-grid">
        {filteredApplications.length > 0 ? (
          filteredApplications.map(app => (
            <AppCard key={app._id} app={app} onClick={onAppClick} />
          ))
        ) : (
          <p>No applications found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;