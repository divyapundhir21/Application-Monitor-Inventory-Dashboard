// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Modal from './components/Modal';
import AdminForm from './components/AdminForm';
import Alert from './components/Alert';
import Dashboard from './components/Dashboard';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import AuthPage from './pages/AuthPage';
import BulkUploadForm from './components/BulkUploadForm';
import SettingsPage from './pages/SettingsPage';
import './App.css';

// ✅ Use environment variable or fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('form');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(window.location.hash.substring(1) || 'dashboard');
  const [selectedApp, setSelectedApp] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState({ firstName: '', profilePicUrl: '' });

  // --- Logout ---
  const handleLogout = useCallback(() => {
    ['token', 'username', 'firstName', 'profilePicUrl'].forEach(key => localStorage.removeItem(key));
    setIsAuthenticated(false);
    setCurrentUser({ firstName: '', profilePicUrl: '' });
    setPage('auth');
    setAlert({ message: 'Logged out successfully.', type: 'success' });
  }, []);

  // --- Auth Fetch Helper ---
  const authFetch = useCallback(
  async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('User not authenticated. Please log in again.');

    // Safely extract any custom headers passed in options
    const { headers: customHeaders = {}, ...restOptions } = options;

    // Use the Headers API to avoid malformed header objects
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...customHeaders,
    });

    try {
      const response = await fetch(url, { ...restOptions, headers });

      // If unauthorized, force logout and throw so callers can handle it
      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }

      return response;
    } catch (err) {
      // Re-throw with a clearer message for upstream handlers
      throw new Error(err.message || 'Network error during request.');
    }
  },
  [handleLogout]
);

  // --- Fetch User Profile ---
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/user/me`);
      const userData = await response.json();

      setCurrentUser({
        firstName: userData.firstName || 'User',
        profilePicUrl: userData.profilePicUrl || '',
      });

      localStorage.setItem('firstName', userData.firstName || 'User');
      localStorage.setItem('profilePicUrl', userData.profilePicUrl || '');
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, [authFetch]);

  // --- Fetch Applications ---
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/applications`);
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  // --- Login Success ---
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setPage('dashboard');
    window.location.hash = 'dashboard';
    fetchApplications();
    fetchUserProfile();
  };

  // --- Add Application ---
  const handleAddApplication = async (newApp) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        body: JSON.stringify(newApp),
      });

      if (!response.ok) throw new Error('Failed to add application.');

      setAlert({ message: 'Application added successfully!', type: 'success' });
      fetchApplications();
      setShowModal(false);
    } catch (error) {
      setAlert({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  // --- Edit Application ---
  const handleEditApplication = async (updatedApp) => {
  try {
    // Ensure _id exists
    if (!updatedApp?._id) throw new Error('Application id missing.');

    const response = await authFetch(`${API_BASE_URL}/api/applications/${updatedApp._id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedApp),
    });

    // handle non-2xx responses
    if (!response.ok) {
      // Try to parse error; fallback to status text
      const errorData = await safeParseJson(response);
      throw new Error(errorData?.message || response.statusText || 'Failed to update application.');
    }

    const updated = await response.json();
    setApplications((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    setAlert({ message: 'Application updated successfully!', type: 'success' });
    fetchApplications();
    setShowModal(false);
  } catch (error) {
    setAlert({ message: `Error: ${error.message}`, type: 'error' });
  }
};

  // --- Delete Application ---
  const handleDeleteApplication = async (appId) => {
  if (!appId) return setAlert({ message: 'Invalid application id.', type: 'error' });

  if (!window.confirm('Are you sure you want to delete this application?')) return;

  try {
    const response = await authFetch(`${API_BASE_URL}/api/applications/${appId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throw new Error(errorData?.message || response.statusText || 'Failed to delete application.');
    }

    setApplications((prev) => prev.filter((app) => app._id !== appId));
    setAlert({ message: 'Application deleted successfully!', type: 'success' });
    fetchApplications();
  } catch (error) {
    setAlert({ message: `Error: ${error.message}`, type: 'error' });
  }
};

async function safeParseJson(response) {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

  // --- Bulk Upload ---
 const handleBulkUpload = async (data, fileType) => {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/api/applications/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // ✅ Added
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      setAlert({ message: result.message, type: 'success' });
      fetchApplications();
    } else {
      throw new Error(result.message || 'Failed to complete bulk upload.');
    }
  } catch (error) {
    setAlert({ message: `Error: ${error.message}`, type: 'error' });
  }
};


  // --- Modal Handlers ---
  const onAddAppClick = () => {
    setEditingApp(null);
    setShowModal(true);
    setModalContent('form');
  };
  const onJSONUploadClick = () => {
    setModalContent('json');
    setShowModal(true);
  };
  const onExcelUploadClick = () => {
    setModalContent('excel');
    setShowModal(true);
  };

  // --- App Click ---
  const handleAppClick = (app) => {
    setSelectedApp(app);
    window.location.hash = 'details';
    setPage('details');
  };

  // --- Initial Fetch ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchUserProfile();
    }
  }, [isAuthenticated, fetchApplications, fetchUserProfile]);

  // --- URL Hash Navigation ---
  useEffect(() => {
    const handleHashChange = () => {
      setPage(window.location.hash.substring(1) || 'dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- Render Page ---
  const renderPage = () => {
    if (!isAuthenticated) {
      return (
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          setErrorAlert={setAlert}
          API_BASE_URL={API_BASE_URL}
        />
      );
    }

    const dashboardProps = {
      applications,
      isLoading,
      error,
      onAppClick: handleAppClick,
      onAddAppClick,
      onJSONUploadClick,
      onExcelUploadClick,
      searchTerm,
    };

    switch (page) {
      case 'dashboard':
        return <Dashboard {...dashboardProps} />;
      case 'applications':
        return (
          <ApplicationsPage
            applications={applications}
            searchTerm={searchTerm}
            onAppClick={handleAppClick}
            onEdit={(app) => {
              setEditingApp(app);
              setShowModal(true);
              setModalContent('form');
            }}
            onDelete={handleDeleteApplication}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            setAlert={setAlert}
            onLogout={handleLogout}
            API_BASE_URL={API_BASE_URL}
          />
        );
      case 'details':
        return (
          <ApplicationDetailsPage
            app={selectedApp}
            onClose={() => {
              setPage('dashboard');
              window.location.hash = 'dashboard';
            }}
          />
        );
      default:
        return <Dashboard {...dashboardProps} />;
    }
  };

  return (
    <div className="app-layout">
      {isAuthenticated && (
        <Sidebar
          onAddAppClick={onAddAppClick}
          onJSONUploadClick={onJSONUploadClick}
          onExcelUploadClick={onExcelUploadClick}
          page={page}
          setPage={setPage}
          onLogout={handleLogout}
        />
      )}

      <div className="main-content">
        {isAuthenticated && (
          <TopBar
            API_BASE_URL={API_BASE_URL}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onLogout={handleLogout}
            firstName={currentUser.firstName}
            profilePicUrl={currentUser.profilePicUrl}
          />
        )}
        {renderPage()}
      </div>

      {isAuthenticated && (
        <Modal show={showModal} onClose={() => setShowModal(false)}>
          {modalContent === 'form' ? (
            <AdminForm
              onAddApplication={handleAddApplication}
              onEditApplication={handleEditApplication}
              onClose={() => setShowModal(false)}
              editingApp={editingApp}
            />
          ) : (
            <BulkUploadForm
              onUpload={handleBulkUpload}
              onClose={() => setShowModal(false)}
              fileType={modalContent}
            />
          )}
        </Modal>
      )}

      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: '', type: '' })}
      />
    </div>
  );
}

export default App;
