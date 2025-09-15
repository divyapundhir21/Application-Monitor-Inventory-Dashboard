// frontend/src/pages/ApplicationsPage.jsx
import React, { useState } from 'react';
import './ApplicationsPage.css';
import { MdEdit, MdDelete } from 'react-icons/md';

const ApplicationsPage = ({ applications, onAppClick, onEdit, onDelete }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const filteredApplications = applications.filter(app => {
    const nameString = (app?.name || '').toLowerCase();
    const idString = (app?._id?.toString() || '').toLowerCase();
    const searchString = (localSearchTerm || '').toLowerCase();

    return nameString.includes(searchString) || idString.includes(searchString);
  });

  return (
    <div className="applications-page">
      <h2>All Applications</h2>
      <input
        type="text"
        placeholder="Search applications by name or ID..."
        className="search-input"
        value={localSearchTerm}
        onChange={(e) => setLocalSearchTerm(e.target.value)}
      />
      <table className="applications-table">
        <thead>
          <tr>
            <th>Application Name</th>
            <th>Technical Owner</th>
            <th>Technologies</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredApplications.map(app => (
            <tr key={app._id}>
              <td>
                <a href="#" className="app-name-link" onClick={(e) => {
                  e.preventDefault();
                  onAppClick(app);
                }}>
                  {app.name}
                </a>
              </td>
              <td>{app.technicalOwner}</td>
              <td>{app.domain}</td>
                <td>
                <span className={`status-text ${app.status === 'up' ? 'status-up' : 'status-down'}`}>
                  {app.status}
                </span>
              </td>
              <td>
                <button onClick={() => onEdit(app)} className="action-button edit-button">
                  <MdEdit /> Edit
                </button>
                <button onClick={() => onDelete(app._id)} className="action-button delete-button">
                  <MdDelete /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredApplications.length === 0 && <p>No applications found.</p>}
    </div>
  );
};

export default ApplicationsPage;