// frontend/src/components/BulkUploadForm.jsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { HiUpload } from 'react-icons/hi';
import { MdCheckCircle, MdErrorOutline } from 'react-icons/md';
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
  { key: 'technology', label: 'Technology' }
  // Removed { key: 'domain', label: 'Domain' }
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
  let techValue = '';
  Object.entries(rawRow).forEach(([excelHeader, value]) => {
    const normalized = normalizeHeader(excelHeader);
    const mappedHeader = columnMapping[normalized];
    if (mappedHeader) {
      mappedRow[mappedHeader] = value;
      if (mappedHeader === 'technology' || mappedHeader === 'domain') {
        techValue = value;
      }
    }
  });
  // Set both for backend, but only show technology in UI
  if (techValue) {
    mappedRow.technology = techValue;
    mappedRow.domain = techValue;
  }
  return mappedRow;
}

const BulkUploadForm = ({ onBulkUpload, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    setError('');
    setPreview([]);
    setSuccess(false);

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

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
    setError('');
    setSuccess(false);
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
          setSuccess(true);
          setFile(null);
          setPreview([]);
          if (typeof onBulkUpload === 'function') {
            const result = await response.json();
            await onBulkUpload(result);
          }
        } catch (err) {
          setError(err.message || 'Upload failed.');
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <HiUpload size={32} color="#2563eb" />
        <h3 className="form-title" style={{ margin: 0 }}>Bulk Upload Applications</h3>
      </div>
      <p style={{ color: '#64748b', marginBottom: 18, fontSize: '1.05em' }}>
        Upload multiple applications at once using an Excel file. Download the template for correct column names.
      </p>
      {error && (
        <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MdErrorOutline size={22} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="loading-message" style={{ background: '#e6fbe8', color: '#15803d', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MdCheckCircle size={22} style={{ flexShrink: 0 }} />
          <span>Applications uploaded successfully!</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bulk-upload-form" noValidate>
        {/* Only show drag-and-drop and template download if no file is selected */}
        {!file && (
          <>
            <div
              className="form-group"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 10,
                background: '#f8fafc',
                padding: '24px 0 18px 0',
                textAlign: 'center',
                marginBottom: 0,
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                id="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="file-input"
                placeholder="Choose an Excel file"
                disabled={isUploading}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <div style={{ color: '#2563eb', fontWeight: 600, fontSize: '1.08em', marginBottom: 6 }}>
                Drag & drop your Excel file here, or <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>browse</span>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.98em' }}>
                Accepted formats: .xlsx, .xls
              </div>
            </div>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button type="button" className="template-button" onClick={handleDownloadTemplate} disabled={isUploading}>
                Download Excel Template
              </button>
            </div>
          </>
        )}
        {/* Show selected file name and a remove option */}
        {file && (
          <div style={{ margin: '8px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#334155', fontWeight: 500 }}>
              Selected file: <span style={{ color: '#2563eb' }}>{file.name}</span>
            </div>
            <button
              type="button"
              className="cancel-button"
              style={{ padding: '4px 12px', fontSize: '0.95em', marginLeft: 10 }}
              onClick={() => { setFile(null); setPreview([]); setError(''); setSuccess(false); }}
              disabled={isUploading}
            >
              Remove
            </button>
          </div>
        )}
        {/* Preview and actions */}
        {preview.length > 0 && (
          <div className="preview-section" style={{ marginTop: 12 }}>
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
        {/* Move actions closer to preview */}
        {(file || preview.length > 0) && (
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="submit-button" disabled={!file || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Applications'}
            </button>
            <button type="button" className="cancel-button" onClick={onClose} disabled={isUploading}>
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default BulkUploadForm;