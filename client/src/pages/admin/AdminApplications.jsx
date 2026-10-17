import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminApplicationsApi } from '../../services/adminService';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [status]);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status) params.status = status;

      const res = await getAdminApplicationsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setApplications(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Back to Admin Dashboard</Link>
          <h1 style={styles.title}>Global Placement Applications Monitor</h1>
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="">All Application Statuses</option>
          <option value="APPLIED">Applied</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading applications pipeline...</p>
        </div>
      ) : applications.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No applications found</h3>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Job Title</th>
                <th style={styles.th}>Company</th>
                <th style={styles.th}>Submission Date</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const std = app.studentId || {};
                const userObj = std.userId || {};
                const job = app.jobId || {};
                const company = app.companyId || {};

                return (
                  <tr key={app._id || app.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{userObj.name || std.name || 'Candidate'}</strong>
                    </td>
                    <td style={styles.td}>{job.title || 'Job'}</td>
                    <td style={styles.td}>{company.companyName || 'Company'}</td>
                    <td style={styles.td}>{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge}>{app.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    padding: '2rem',
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  backLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    display: 'inline-block',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
    margin: 0,
  },
  select: {
    padding: '0.65rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  centerContainer: {
    padding: '4rem',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#1e293b',
    padding: '3rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #334155',
  },
  mutedText: {
    color: '#94a3b8',
  },
  tableCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    padding: '0.85rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    borderBottom: '1px solid #334155',
  },
  tr: {
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '0.85rem 1rem',
    fontSize: '0.875rem',
    color: '#f8fafc',
  },
  statusBadge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '10px',
  },
};
