// frontend/src/pages/ApplicationsPage.jsx
import React from 'react'; // Removed useState import
import './ApplicationsPage.css';
import { MdEdit, MdDelete } from 'react-icons/md';

// 1. Accept the global 'searchTerm' prop from App.jsx
const ApplicationsPage = ({ applications, searchTerm, onAppClick, onEdit, onDelete }) => {
  // REMOVED: const [localSearchTerm, setLocalSearchTerm] = useState('');

  // 2. The filtering logic now uses the global 'searchTerm' directly
  const filteredApplications = applications.filter(app => {
    const nameString = (app?.name || '').toLowerCase();
    const idString = (app?.applicationID?.toString() || '').toLowerCase();
    const searchString = (searchTerm || '').toLowerCase(); // Use the passed prop

    return nameString.includes(searchString) || idString.includes(searchString);
  });

  const handleEdit = async (app) => {
    try {
      if (onEdit) {
        await onEdit(app);
      }
    } catch (error) {
      console.error('Edit error:', error);
      // Add error handling UI if needed
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      if (onDelete) {
        await onDelete(appId);
      }
    } catch (error) {
      console.error('Delete error:', error);
      // Add error handling UI if needed
    }
  };

  return (
    <div className="applications-page">
      <h2>All Applications</h2>

      {/* REMOVED: The local search input field */}

      <table className="applications-table">
        <thead>
          <tr>
            <th>Application Name</th>
            <th>Technical Owner</th>
            <th>Domain</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredApplications.map(app => (
            <tr key={app.applicationID}>
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
                <button onClick={() => handleEdit(app)} className="action-button edit-button">
                  <MdEdit /> Edit
                </button>
                <button onClick={() => handleDelete(app._id)} className="action-button delete-button">
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