// frontend/src/components/BulkUploadForm.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './BulkUploadForm.css';

const previewFields = [
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
  { key: 'domain', label: 'Domain' }
];

// Map Excel headers to internal keys (case-insensitive, space-insensitive)
const columnMapping = {
  'appid': 'applicationID',
  'app id': 'applicationID',
  'app-id': 'applicationID',
  'application id': 'applicationID',
  'appname': 'name',
  'app name': 'name',
  'application name': 'name',
  'name': 'name',
  'technical owner': 'technicalOwner',
  'secondary owner': 'secondaryOwner',
  'business owner': 'businessOwner',
  'information steward': 'informationSteward',
  'product line': 'productLine',
  'product owner': 'productOwner',
  'product line architect': 'productLineArchitect',
  'technical team lead': 'technicalTeamLead',
  'apm': 'apm',
  'prod url': 'prodUrl',
  'dev url': 'devUrl',
  'repo url': 'repoUrl',
  'prod resource group': 'prodResourceGroup',
  'test resource group': 'testResourceGroup',
  'technology': 'technology',
  'domain': 'domain'
};

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function mapExcelRow(rawRow) {
  const mappedRow = {};
  Object.entries(rawRow).forEach(([excelHeader, value]) => {
    const normalized = normalizeHeader(excelHeader);
    const mappedHeader = columnMapping[normalized];
    if (mappedHeader) {
      mappedRow[mappedHeader] = value;
    }
  });
  return mappedRow;
}

const BulkUploadForm = ({ onBulkUpload, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    setError('');
    setPreview([]);

    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const workbook = XLSX.read(ev.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          const mappedData = rawData.map(row => mapExcelRow(row));
          setPreview(mappedData.slice(0, 5));
        } catch (err) {
          setError('Error reading file. Please ensure it is a valid Excel file.');
          setPreview([]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authorized. Please login first.');
      return;
    }
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const workbook = XLSX.read(ev.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          const mappedData = rawData.map(row => mapExcelRow(row));
          const apiUrl = '/api/applications/bulk';
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(mappedData),
          });
          if (!response.ok) {
            let errorMsg = 'Upload failed.';
            try {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
            } catch {}
            throw new Error(errorMsg);
          }
          const result = await response.json();
          if (typeof onBulkUpload === 'function') {
            await onBulkUpload(result);
          }
          onClose();
        } catch (err) {
          setError(err.message || 'Upload failed.');
          console.error('Upload error:', err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError(err.message || 'Upload failed.');
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{}], {
      header: previewFields.map(f => f.label)
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'applications-template.xlsx');
  };

  return (
    <div className="bulk-upload-container">
      <h3 className="form-title">Bulk Upload Applications</h3>
      {error && <div className="error-message">{error}</div>}
      {isUploading && <div className="loading-message">Uploading applications...</div>}
      <form onSubmit={handleSubmit} className="bulk-upload-form" noValidate>
        <div className="form-group">
          <label htmlFor="file">Select Excel File</label>
          <input
            type="file"
            id="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="file-input"
            placeholder="Choose an Excel file"
            disabled={isUploading}
          />
          <small className="hint">Upload an Excel file with the required columns. <b>Download the template if unsure.</b></small>
        </div>
        {preview.length > 0 && (
          <div className="preview-section">
            <h4>Preview (First 5 rows)</h4>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    {previewFields.map(f => (
                      <th key={f.key}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {previewFields.map(f => (
                        <td key={f.key}>
                          {row[f.key] || <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '0.95em', color: '#666', marginTop: 8 }}>
              <span>Only the first 5 rows are shown. All columns will be uploaded.</span>
            </div>
          </div>
        )}
        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Applications'}
          </button>
          <button type="button" className="cancel-button" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button type="button" className="template-button" onClick={handleDownloadTemplate} disabled={isUploading}>
            Download Excel Template
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkUploadForm;