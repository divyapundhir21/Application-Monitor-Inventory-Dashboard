// src/App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Modal from './components/Modal';
import AdminForm from './components/AdminForm';
import Alert from './components/Alert';
import Dashboard from './components/Dashboard';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import './App.css';
import BulkUploadForm from './components/BulkUploadForm';

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

  useEffect(() => {
    const handleHashChange = () => {
      setPage(window.location.hash.substring(1) || 'dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApplication = async (newApp) => {
    try {
      const response = await fetch('http://localhost:3000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApp),
      });

      if (response.ok) {
        setAlert({ message: 'Application added successfully!', type: 'success' });
        fetchApplications();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add application.');
      }
    } catch (error) {
      setAlert({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  const handleEditApplication = async (updatedApp) => {
    try {
      const response = await fetch(`http://localhost:3000/api/applications/${updatedApp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedApp),
      });

      if (response.ok) {
        setAlert({ message: 'Application updated successfully!', type: 'success' });
        fetchApplications();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update application.');
      }
    } catch (error) {
      setAlert({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteApplication = async (appId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/applications/${appId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAlert({ message: 'Application deleted successfully!', type: 'success' });
        fetchApplications();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete application.');
      }
    } catch (error) {
      setAlert({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  const handleAppClick = (app) => {
    setSelectedApp(app);
    window.location.hash = 'details';
    setPage('details');
  };

  const handleBulkUpload = async (data, fileType) => {
    try {
      const response = await fetch('http://localhost:3000/api/applications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  useEffect(() => {
    fetchApplications();
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard
          applications={applications}
          isLoading={isLoading}
          error={error}
          onAppClick={handleAppClick}
          onAddAppClick={() => { setEditingApp(null); setShowModal(true); setModalContent('form'); }}
          onExcelUploadClick={() => { setShowModal(true); setModalContent('excel'); }}
        />;
      case 'applications':
        return <ApplicationsPage
          applications={applications}
          searchTerm={searchTerm}
          onAppClick={handleAppClick}
          onEdit={(app) => {
            setEditingApp(app);
            setShowModal(true);
            setModalContent('form');
          }}
          onDelete={handleDeleteApplication}
        />;
      case 'details':
        return <ApplicationDetailsPage app={selectedApp} onClose={() => { setPage('dashboard'); window.location.hash = 'dashboard'; }} />;
      default:
        return <Dashboard applications={applications} isLoading={isLoading} error={error} searchTerm={searchTerm} onAppClick={handleAppClick} onAddAppClick={() => { setEditingApp(null); setShowModal(true); setModalContent('form'); }} onJSONUploadClick={() => { setShowModal(true); setModalContent('json'); }} onExcelUploadClick={() => { setShowModal(true); setModalContent('excel'); }}/>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        onAddAppClick={() => { setEditingApp(null); setShowModal(true); setModalContent('form'); }}
        onExcelUploadClick={() => { setShowModal(true); setModalContent('excel'); }}
        page={page}
        setPage={setPage}
      />
      <div className="main-content">
        <TopBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        {renderPage()}
      </div>
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
      <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />
    </div>
  );
}

export default App;