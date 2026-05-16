import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadPDF } from '../../api';
import './Dropzone.css';

function Dropzone({ sessionId, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success | error
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file) => {
    // Validate it's a PDF
    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload a PDF file.');
      setUploadState('error');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File is too large. Maximum size is 50MB.');
      setUploadState('error');
      return;
    }

    setSelectedFile(file);
    setUploadState('uploading');
    setErrorMessage('');

    try {
      const result = await uploadPDF(file, sessionId);
      if (result.status === 'ok') {
        setUploadState('success');
        setTimeout(() => {
          onUploadSuccess(file.name);
        }, 800);
      } else {
        throw new Error('Unexpected response from server.');
      }
    } catch (err) {
      setUploadState('error');
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setErrorMessage('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`dropzone ${dragActive ? 'dropzone--active' : ''} ${uploadState !== 'idle' ? `dropzone--${uploadState}` : ''}`}
      id="upload-dropzone"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => uploadState === 'idle' && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload PDF file"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="dropzone-input"
        id="file-input"
      />

      {/* Animated border */}
      <div className="dropzone-border">
        <svg className="dropzone-border-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect
            x="1" y="1" width="98" height="98" rx="16" ry="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="8 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Idle State */}
      {uploadState === 'idle' && (
        <div className="dropzone-content">
          <div className="dropzone-icon-wrapper">
            <Upload size={32} />
          </div>
          <h3 className="dropzone-title">Upload your NCERT textbook</h3>
          <p className="dropzone-desc">
            Drag & drop your PDF here, or <span className="dropzone-link">browse files</span>
          </p>
          <p className="dropzone-hint">PDF files up to 50MB</p>
        </div>
      )}

      {/* Uploading State */}
      {uploadState === 'uploading' && (
        <div className="dropzone-content">
          <div className="dropzone-icon-wrapper dropzone-icon-wrapper--loading">
            <Loader size={32} className="dropzone-spinner" />
          </div>
          <h3 className="dropzone-title">Indexing your textbook…</h3>
          <p className="dropzone-desc">{selectedFile?.name}</p>
          <div className="dropzone-progress">
            <div className="dropzone-progress-bar" />
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadState === 'success' && (
        <div className="dropzone-content">
          <div className="dropzone-icon-wrapper dropzone-icon-wrapper--success">
            <CheckCircle size={32} />
          </div>
          <h3 className="dropzone-title">Ready to learn!</h3>
          <p className="dropzone-desc">{selectedFile?.name} indexed successfully.</p>
        </div>
      )}

      {/* Error State */}
      {uploadState === 'error' && (
        <div className="dropzone-content">
          <div className="dropzone-icon-wrapper dropzone-icon-wrapper--error">
            <AlertCircle size={32} />
          </div>
          <h3 className="dropzone-title dropzone-title--error">{errorMessage}</h3>
          <button className="dropzone-retry" onClick={(e) => { e.stopPropagation(); handleRetry(); }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default Dropzone;
