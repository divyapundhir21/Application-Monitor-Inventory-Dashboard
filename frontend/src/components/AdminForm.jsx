// src/components/AdminForm.jsx
import React, { useState, useEffect } from 'react';
import './AdminForm.css';

// AdminForm now receives props for both add and edit functionality
const AdminForm = ({ onAddApplication, onEditApplication, onClose, editingApp }) => {
  const [formData, setFormData] = useState({
    applicationID: '',
    name: '',
    technicalOwner: '',
    secondaryOwner: '',
    prodUrl: '',
    devUrl: '',
    repoUrl: '',
    prodResourceGroup: '',
    testResourceGroup: '',
    productLine: '',
    productLineArchitect: '',
    productOwner: '',
    businessOwner: '',
    informationSteward: '',
    apm: '',
    technicalTeamLead: '',
    technology: ''
  });

  // Use useEffect to pre-populate the form if an app is being edited
  useEffect(() => {
    if (editingApp) {
      // merge to ensure missing fields are present
      setFormData(prev => ({ ...prev, ...editingApp }));
    } else {
      setFormData({
        applicationID: '',
        name: '',
        technicalOwner: '',
        secondaryOwner: '',
        prodUrl: '',
        devUrl: '',
        repoUrl: '',
        prodResourceGroup: '',
        testResourceGroup: '',
        productLine: '',
        productLineArchitect: '',
        productOwner: '',
        businessOwner: '',
        informationSteward: '',
        apm: '',
        technicalTeamLead: '',
        technology: ''
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
    <div className="admin-form-container">
      <form onSubmit={handleSubmit} className="admin-form" noValidate>
        <h3 className="form-title">{editingApp ? 'Edit Application' : 'Add New Application'}</h3>

        {/* Basic Info Section */}
        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-group">
            <label htmlFor="applicationID">Application ID <span className="required">*</span></label>
            <input
              type="text"
              id="applicationID"
              name="applicationID"
              value={formData.applicationID}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Application Name <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Ownership Section */}
        <div className="form-section">
          <h4>Ownership</h4>
          <div className="form-group">
            <label htmlFor="technicalOwner">Technical Owner <span className="required">*</span></label>
            <input
              type="email"
              id="technicalOwner"
              name="technicalOwner"
              value={formData.technicalOwner}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="secondaryOwner">Secondary Owner</label>
            <input
              type="email"
              id="secondaryOwner"
              name="secondaryOwner"
              value={formData.secondaryOwner}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* URLs Section */}
        <div className="form-section">
          <h4>URLs</h4>
          <div className="form-group">
            <label htmlFor="prodUrl">Production URL <span className="required">*</span></label>
            <input
              type="url"
              id="prodUrl"
              name="prodUrl"
              value={formData.prodUrl}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="devUrl">Development URL</label>
            <input
              type="url"
              id="devUrl"
              name="devUrl"
              value={formData.devUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="repoUrl">Repository URL</label>
            <input
              type="url"
              id="repoUrl"
              name="repoUrl"
              value={formData.repoUrl}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Resource Groups */}
        <div className="form-section">
          <h4>Resource Groups</h4>
          <div className="form-group">
            <label htmlFor="prodResourceGroup">Production Resource Group</label>
            <input
              type="text"
              id="prodResourceGroup"
              name="prodResourceGroup"
              value={formData.prodResourceGroup}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="testResourceGroup">Test Resource Group</label>
            <input
              type="text"
              id="testResourceGroup"
              name="testResourceGroup"
              value={formData.testResourceGroup}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Team & Organization */}
        <div className="form-section">
          <h4>Team & Organization</h4>
          <div className="form-group">
            <label htmlFor="productLine">Product Line</label>
            <input
              type="text"
              id="productLine"
              name="productLine"
              value={formData.productLine}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="productLineArchitect">Product Line Architect</label>
            <input
              type="text"
              id="productLineArchitect"
              name="productLineArchitect"
              value={formData.productLineArchitect}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="productOwner">Product Owner</label>
            <input
              type="text"
              id="productOwner"
              name="productOwner"
              value={formData.productOwner}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="businessOwner">Business Owner</label>
            <input
              type="text"
              id="businessOwner"
              name="businessOwner"
              value={formData.businessOwner}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="informationSteward">Information Steward</label>
            <input
              type="text"
              id="informationSteward"
              name="informationSteward"
              value={formData.informationSteward}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apm">APM</label>
            <input
              type="text"
              id="apm"
              name="apm"
              value={formData.apm}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="technicalTeamLead">Technical Team Lead</label>
            <input
              type="text"
              id="technicalTeamLead"
              name="technicalTeamLead"
              value={formData.technicalTeamLead}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="technology">Technology</label>
            <input
              type="text"
              id="technology"
              name="technology"
              value={formData.technology}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            {editingApp ? 'Update' : 'Add'} Application
          </button>
          <button type="button" className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminForm;