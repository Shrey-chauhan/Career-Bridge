import React from 'react';

export default function ResumeCard({ resume, onReplace, onDelete }) {
  if (!resume || !resume.secureUrl) {
    return null;
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadDate = resume.uploadedAt || resume.updatedAt;
  const formattedDate = uploadDate ? new Date(uploadDate).toLocaleDateString() : 'Recent';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <span style={styles.docIcon}>📄</span>
          <div>
            <h4 style={styles.fileName}>{resume.originalFileName || resume.fileName || 'Resume Document'}</h4>
            <p style={styles.metaSub}>
              Uploaded on {formattedDate} {resume.fileSize ? `• ${formatFileSize(resume.fileSize)}` : ''}
            </p>
          </div>
        </div>

        <div style={styles.badgeGroup}>
          <span style={styles.versionBadge}>Version {resume.version || 1}</span>
          <span style={styles.activeBadge}>Active</span>
        </div>
      </div>

      <div style={styles.actionRow}>
        <a
          href={resume.secureUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.viewBtn}
        >
          View Resume ↗
        </a>

        <div style={styles.rightActions}>
          <button onClick={onReplace} style={styles.replaceBtn}>
            Replace Resume
          </button>
          <button onClick={() => onDelete(resume._id || resume.id)} style={styles.deleteBtn}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #334155',
    marginBottom: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  docIcon: {
    fontSize: '2rem',
  },
  fileName: {
    color: '#f8fafc',
    margin: 0,
    fontSize: '1.05rem',
  },
  metaSub: {
    color: '#cbd5e1',
    margin: '0.2rem 0 0 0',
    fontSize: '0.85rem',
  },
  badgeGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  versionBadge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: '1px solid #10b981',
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #334155',
    paddingTop: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  viewBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  rightActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  replaceBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    border: '1px solid #475569',
    padding: '0.5rem 0.9rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    padding: '0.5rem 0.9rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
