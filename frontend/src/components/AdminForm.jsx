// src/components/AdminForm.jsx
import React, { useState, useEffect } from 'react';
import './AdminForm.css';

// AdminForm now receives props for both add and edit functionality
const AdminForm = ({ onAddApplication, onEditApplication, onClose, editingApp }) => {
  const [formData, setFormData] = useState({
    name: '',
    prodUrl: '',
    technicalOwner: '',
    productOwner: '',
    businessOwner: '',
    prodResourceGroup: '',
    adoLink: '',
    domain: '',
  });

  // Use useEffect to pre-populate the form if an app is being edited
  useEffect(() => {
    if (editingApp) {
      setFormData(editingApp);
    } else {
      setFormData({
        name: '',
        prodUrl: '',
        technicalOwner: '',
        productOwner: '',
        businessOwner: '',
        prodResourceGroup: '',
        adoLink: '',
        domain: '',
      });
    }
  }, [editingApp]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingApp) {
      // If editing, call the onEditApplication function with the updated data
      await onEditApplication(formData);
    } else {
      // If adding, call the onAddApplication function
      await onAddApplication(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <h3>{editingApp ? 'Edit Application' : 'Add New Application'}</h3>
      <div className="form-group">
        <label htmlFor="applicationID">Application ID</label>
        <input type="number" id="applicationID" name="applicationID" value={formData.applicationID} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="name">Application Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="prodUrl">Production URL</label>
        <input type="url" id="prodUrl" name="prodUrl" value={formData.prodUrl} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="adoLink">ADO Link</label>
        <input type="url" id="adoLink" name="adoLink" value={formData.adoLink} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="technicalOwner">Technical Owner</label>
        <input type="text" id="technicalOwner" name="technicalOwner" value={formData.technicalOwner} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label htmlFor="businessOwner">Business Owner</label>
        <input type="text" id="businessOwner" name="businessOwner" value={formData.businessOwner} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label htmlFor="productOwner">Product Owner</label>
        <input type="text" id="productOwner" name="productOwner" value={formData.productOwner} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label htmlFor="domain">Domain</label>
        <input type="text" id="domain" name="domain" value={formData.domain} onChange={handleChange} />
      </div>
      <div className="form-actions">
        <button type="submit" className="submit-button">
          {editingApp ? 'Update' : 'Add'} Application
        </button>
        <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
};

export default AdminForm;