// src/pages/ApplicationDetailsPage.jsx
import React from 'react';
import './ApplicationDetailsPage.css';

function ApplicationDetailsPage({ app, onBack }) {
  if (!app) return <div className="details-container">No application selected.</div>;

  // List all relevant fields
  const fields = [
    { key: 'applicationID', label: 'App ID' },
    { key: 'name', label: 'App Name' },
    { key: 'technicalOwner', label: 'Technical Owner' },
    { key: 'secondaryOwner', label: 'Secondary Owner' },
    { key: 'businessOwner', label: 'Business Owner' },
    { key: 'informationSteward', label: 'Information Steward' },
    { key: 'productLine', label: 'Product Line' },
    { key: 'productOwner', label: 'Product Owner' },
    { key: 'productLineArchitect', label: 'Product Line Architect' },
    { key: 'technicalTeamLead', label: 'Technical Team Lead' },
    { key: 'apm', label: 'APM' },
    { key: 'prodUrl', label: 'Prod URL' },
    { key: 'devUrl', label: 'Dev URL' },
    { key: 'repoUrl', label: 'Repo URL' },
    { key: 'prodResourceGroup', label: 'Prod Resource Group' },
    { key: 'testResourceGroup', label: 'Test Resource Group' },
    { key: 'technology', label: 'Technology' },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="details-container">
      <div className="details-card">
        <div className="details-header">
          <h2>{app.name || app.applicationID || 'Application Details'}</h2>
          <span className="status-badge">{(app.status || 'Unknown').toUpperCase()}</span>
        </div>
        <button className="back-button" onClick={onBack}>
          ← Back to Applications
        </button>
        <div className="section-heading">
          Application Information
        </div>
        <table className="details-table">
          <tbody>
            {fields.map(f => (
              <tr key={f.key}>
                <td className="details-label">{f.label}</td>
                <td className="details-value">
                  {f.key.toLowerCase().includes('url') && app[f.key] ? (
                    <a href={app[f.key]} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                      {app[f.key]}
                    </a>
                  ) : (
                    app[f.key] || <span style={{ color: '#bbb' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ApplicationDetailsPage;