import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplicationsApi } from '../../services/applicationService';

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications(pagination.page);
  }, []);

  const fetchApplications = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyApplicationsApi({ page, limit: 10 });
      if (res.success) {
        setApplications(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'SHORTLISTED':
        return { backgroundColor: '#064e3b', color: '#6ee7b7', borderColor: '#10b981' };
      case 'REJECTED':
        return { backgroundColor: '#7f1d1d', color: '#fca5a5', borderColor: '#f87171' };
      case 'WITHDRAWN':
        return { backgroundColor: '#334155', color: '#94a3b8', borderColor: '#475569' };
      case 'APPLIED':
      default:
        return { backgroundColor: '#0c4a6e', color: '#7dd3fc', borderColor: '#38bdf8' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Job Applications</h1>
          <p style={styles.subtitle}>Track your submitted applications and recruitment status</p>
        </div>
        <Link to="/student/jobs" style={styles.browseBtn}>
          + Explore More Jobs
        </Link>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.loadingBox}>
          <p>Loading your applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No Applications Submitted Yet</h3>
          <p style={styles.mutedText}>Browse available placement opportunities and apply to eligible jobs.</p>
          <Link to="/student/jobs" style={styles.emptyActionBtn}>
            View Available Jobs
          </Link>
        </div>
      ) : (
        <>
          <div style={styles.appGrid}>
            {applications.map((app) => {
              const job = app.jobId || {};
              const company = app.companyId || job.companyId || {};
              const badgeStyle = getStatusBadgeStyle(app.status);

              return (
                <div key={app._id || app.id} style={styles.appCard}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.jobTitle}>{job.title || 'Job Posting'}</h3>
                      <p style={styles.companyName}>{company.companyName || 'Company'}</p>
                    </div>
                    <span style={{ ...styles.statusBadge, ...badgeStyle }}>{app.status}</span>
                  </div>

                  <div style={styles.cardMeta}>
                    <p>
                      <strong>Location:</strong> {job.location || 'N/A'}
                    </p>
                    <p>
                      <strong>Work Mode:</strong> {job.workMode || 'N/A'}
                    </p>
                    <p>
                      <strong>Applied On:</strong> {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={styles.cardFooter}>
                    <Link to={`/student/applications/${app._id || app.id}`} style={styles.detailsBtn}>
                      View Details & Status →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchApplications(pagination.page - 1)}
                style={styles.pageBtn}
              >
                ← Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchApplications(pagination.page + 1)}
                style={styles.pageBtn}
              >
                Next →
              </button>
            </div>
          )}
        </>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    color: '#38bdf8',
    margin: 0,
  },
  subtitle: {
    color: '#cbd5e1',
    marginTop: '0.25rem',
  },
  browseBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '3rem',
    color: '#94a3b8',
  },
  emptyCard: {
    backgroundColor: '#1e293b',
    padding: '3rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px dashed #334155',
  },
  mutedText: {
    color: '#94a3b8',
    marginTop: '0.5rem',
    marginBottom: '1.5rem',
  },
  emptyActionBtn: {
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    padding: '0.6rem 1.5rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '700',
  },
  appGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  appCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  jobTitle: {
    fontSize: '1.2rem',
    color: '#f8fafc',
    margin: 0,
  },
  companyName: {
    color: '#38bdf8',
    fontSize: '0.95rem',
    marginTop: '0.2rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    lineHeight: '1.6',
    marginBottom: '1.25rem',
  },
  cardFooter: {
    borderTop: '1px solid #334155',
    paddingTop: '1rem',
  },
  detailsBtn: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2.5rem',
  },
  pageBtn: {
    backgroundColor: '#1e293b',
    color: '#38bdf8',
    border: '1px solid #334155',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  pageInfo: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
};
