import React, { useState } from 'react';
import { uploadResumeApi } from '../../services/resumeService';

export default function ResumeUploader({ onUploadSuccess, currentVersion = 0 }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

  const validateFile = (selectedFile) => {
    setError('');
    setSuccessMsg('');

    if (!selectedFile) return false;

    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Only PDF (.pdf) and Word (.docx, .doc) files are supported.');
      setFile(null);
      return false;
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError(`File size exceeds maximum limit of ${MAX_SIZE_MB} MB. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB.`);
      setFile(null);
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a valid resume document first.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await uploadResumeApi(formData, (percent) => setProgress(percent));

      if (res.success) {
        setSuccessMsg(`Resume successfully uploaded! (Version ${res.data.version || currentVersion + 1})`);
        setFile(null);
        if (onUploadSuccess) {
          onUploadSuccess(res.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to upload resume document');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit}>
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            ...styles.dropZone,
            borderColor: isDragging ? '#38bdf8' : file ? '#10b981' : '#334155',
            backgroundColor: isDragging ? '#0369a122' : '#0f172a',
          }}
        >
          <input
            type="file"
            id="resume-file-input"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <label htmlFor="resume-file-input" style={styles.dropZoneLabel}>
            <div style={styles.iconCircle}>📄</div>
            <p style={styles.mainText}>
              {file ? file.name : 'Drag & Drop your resume here, or click to browse'}
            </p>
            <p style={styles.subText}>
              {file ? `File Size: ${formatFileSize(file.size)}` : 'Supports PDF and DOCX documents up to 5 MB'}
            </p>
          </label>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {successMsg && <div style={styles.successBox}>{successMsg}</div>}

        {/* Upload Progress Bar */}
        {uploading && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBarWrapper}>
              <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
            </div>
            <span style={styles.progressText}>Uploading... {progress}%</span>
          </div>
        )}

        {/* Submit Button */}
        <div style={styles.btnRow}>
          <button
            type="submit"
            disabled={!file || uploading}
            style={{
              ...styles.uploadBtn,
              backgroundColor: !file || uploading ? '#334155' : '#0284c7',
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading
              ? 'Uploading Document...'
              : currentVersion > 0
              ? 'Upload New Resume Version'
              : 'Upload Resume'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  dropZone: {
    border: '2px dashed #334155',
    borderRadius: '12px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    marginBottom: '1rem',
  },
  dropZoneLabel: {
    cursor: 'pointer',
    display: 'block',
  },
  iconCircle: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  mainText: {
    color: '#f8fafc',
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 0.4rem 0',
  },
  subText: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    margin: 0,
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  successBox: {
    backgroundColor: '#064e3b',
    color: '#a7f3d0',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  progressContainer: {
    marginBottom: '1rem',
  },
  progressBarWrapper: {
    height: '8px',
    backgroundColor: '#0f172a',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid #334155',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    transition: 'width 0.2s ease',
  },
  progressText: {
    color: '#38bdf8',
    fontSize: '0.85rem',
    display: 'block',
    marginTop: '0.4rem',
    textAlign: 'right',
  },
  btnRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  uploadBtn: {
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.95rem',
    transition: 'background 0.2s',
  },
};
