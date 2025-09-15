// src/pages/ApplicationDetailsPage.jsx
import React from 'react';
import './ApplicationDetailsPage.css';

const ApplicationDetailsPage = ({ app, onClose }) => {
  if (!app) {
    return (
      <div className="details-container">
        <h2>No Application Selected</h2>
        <button onClick={onClose} className="back-button">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="details-container">
      <button onClick={onClose} className="back-button">
        ← Back
      </button>
      <div className="app-details-card">
        <h2>{app.name}</h2>
        <div className="details-group">
          <p><strong>App ID:</strong> {app._id}</p>
          <p><strong>Business Owner:</strong> {app.businessOwner}</p>
          <p><strong>Technical Owner:</strong> {app.technicalOwner}</p>
          <p><strong>Product Owner:</strong> {app.productOwner}</p>
          <p><strong>Prod Resource Group:</strong> {app.prodResourceGroup}</p>
          <p><strong>Test Resource Group:</strong> {app.testResourceGroup}</p>
          <p><strong>Production URL:</strong> <a href={app.prodUrl} target="_blank">{app.prodUrl}</a></p>
          <p><strong>ADO Link:</strong> <a href={app.adoLink} target="_blank">{app.adoLink}</a></p>
          <p><strong>Technologies:</strong> {app.domain}</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsPage;