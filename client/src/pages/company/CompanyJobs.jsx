import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCompanyJobsApi,
  publishJobApi,
  closeJobApi,
  deleteJobApi,
} from '../../services/jobService';

export default function CompanyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCompanyJobsApi();
      if (res.success) {
        setJobs(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load company jobs');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await publishJobApi(id);
      if (res.success) {
        setSuccessMsg('Job published successfully!');
        fetchJobs();
      }
    } catch (err) {
      setError(err.message || 'Failed to publish job');
    }
  };

  const handleClose = async (id) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await closeJobApi(id);
      if (res.success) {
        setSuccessMsg('Job closed successfully.');
        fetchJobs();
      }
    } catch (err) {
      setError(err.message || 'Failed to close job');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await deleteJobApi(id);
      if (res.success) {
        setSuccessMsg('Job deleted successfully.');
        fetchJobs();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete job');
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p style={styles.muted}>Loading Job Postings...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/dashboard" style={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 style={styles.title}>Company Job Postings</h1>
        </div>
        <Link to="/company/jobs/create" style={styles.createBtn}>
          + Create New Job
        </Link>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}
      {successMsg && <div style={styles.successBox}>{successMsg}</div>}

      {jobs.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No Job Postings Found</h3>
          <p style={styles.muted}>
            You haven't created any job postings yet. Click "+ Create New Job" above to get started.
          </p>
        </div>
      ) : (
        <div style={styles.jobsList}>
          {jobs.map((job) => {
            const isDraft = job.status === 'DRAFT';
            const isPublished = job.status === 'PUBLISHED';
            const isClosed = job.status === 'CLOSED';
            const deadline = new Date(job.applicationDeadline).toLocaleDateString();

            return (
              <div key={job.id || job._id} style={styles.jobCard}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.jobTitle}>{job.title}</h3>
                    <p style={styles.mutedSub}>
                      {job.jobType.replace('_', ' ')} • {job.workMode} • {job.location || 'Location Not Specified'}
                    </p>
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: isPublished ? '#064e3b' : isDraft ? '#1e3a8a' : '#7f1d1d',
                      color: isPublished ? '#a7f3d0' : isDraft ? '#bfdbfe' : '#fca5a5',
                    }}
                  >
                    {job.status}
                  </span>
                </div>

                <div style={styles.cardDetails}>
                  <span><strong>Openings:</strong> {job.openings}</span>
                  <span><strong>Deadline:</strong> {deadline}</span>
                  {job.salary && (
                    <span>
                      <strong>Salary:</strong> ₹{job.salary.min.toLocaleString()} - ₹{job.salary.max.toLocaleString()} / {job.salary.period.toLowerCase()}
                    </span>
                  )}
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => navigate(`/company/jobs/edit/${job.id || job._id}`)}
                    style={styles.actionBtn}
                  >
                    Edit
                  </button>

                  {isDraft && (
                    <button
                      onClick={() => handlePublish(job.id || job._id)}
                      style={styles.publishBtn}
                    >
                      Publish Job
                    </button>
                  )}

                  {isPublished && (
                    <button
                      onClick={() => handleClose(job.id || job._id)}
                      style={styles.closeBtn}
                    >
                      Close Job
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(job.id || job._id)}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
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
    fontFamily: "'Segoe UI', sans-serif",
    padding: '2rem',
  },
  centerContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  backLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
  },
  createBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  successBox: {
    backgroundColor: '#064e3b',
    color: '#a7f3d0',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  emptyCard: {
    backgroundColor: '#1e293b',
    padding: '3rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #334155',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  jobCard: {
    backgroundColor: '#1e293b',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  jobTitle: {
    fontSize: '1.35rem',
    color: '#f8fafc',
  },
  mutedSub: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  cardDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    color: '#cbd5e1',
    fontSize: '0.9rem',
    marginBottom: '1.25rem',
    padding: '0.75rem',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
  },
  cardActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  actionBtn: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  publishBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  muted: {
    color: '#94a3b8',
  },
};
