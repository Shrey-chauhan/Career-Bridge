import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCompanyApplicationsApi,
  shortlistApplicationApi,
  rejectApplicationApi,
} from '../../services/applicationService';
import { getCompanyJobsApi } from '../../services/jobService';

export default function CompanyApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Reason Modal
  const [rejectModalAppId, setRejectModalAppId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');

  useEffect(() => {
    fetchCompanyJobs();
  }, []);

  useEffect(() => {
    fetchApplications(1);
  }, [statusFilter, jobFilter]);

  const fetchCompanyJobs = async () => {
    try {
      const res = await getCompanyJobsApi();
      if (res.success) {
        setCompanyJobs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load company jobs for filter:', err);
    }
  };

  const fetchApplications = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (jobFilter) params.jobId = jobFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getCompanyApplicationsApi(params);
      if (res.success) {
        setApplications(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications(1);
  };

  const handleShortlist = async (appId) => {
    if (!window.confirm('Are you sure you want to shortlist this applicant?')) return;
    setActionLoading(true);
    try {
      const res = await shortlistApplicationApi(appId);
      if (res.success) {
        fetchApplications(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to shortlist applicant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (appId) => {
    setRejectModalAppId(appId);
    setRejectionReason('');
    setCompanyNotes('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalAppId) return;

    setActionLoading(true);
    try {
      const res = await rejectApplicationApi(rejectModalAppId, {
        reason: rejectionReason,
        companyNotes: companyNotes,
      });
      if (res.success) {
        setRejectModalAppId(null);
        fetchApplications(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to reject applicant');
    } finally {
      setActionLoading(false);
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
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Candidate Applications</h1>
          <p style={styles.subtitle}>Review, shortlist, and manage applicants for your job postings</p>
        </div>
        <Link to="/company/jobs" style={styles.backBtn}>
          ← Manage Job Postings
        </Link>
      </header>

      {/* Filter Controls Bar */}
      <div style={styles.filterBar}>
        {/* Status Filter Tabs */}
        <div style={styles.statusTabs}>
          {['', 'APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                ...styles.tabBtn,
                ...(statusFilter === st ? styles.activeTabBtn : {}),
              }}
            >
              {st === '' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Job Dropdown & Search Form */}
        <div style={styles.secondaryFilters}>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            style={styles.selectInput}
          >
            <option value="">All Job Postings</option>
            {companyJobs.map((j) => (
              <option key={j._id || j.id} value={j._id || j.id}>
                {j.title}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <input
              type="text"
              placeholder="Search candidate name or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>
              Search
            </button>
          </form>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.loadingBox}>
          <p>Loading candidate applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No Applications Found</h3>
          <p style={styles.mutedText}>There are no applications matching your current filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Applications Table / Cards */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Job Position</th>
                  <th style={styles.th}>College & Branch</th>
                  <th style={styles.th}>CGPA</th>
                  <th style={styles.th}>Applied Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const student = app.studentId || {};
                  const user = student.userId || {};
                  const job = app.jobId || {};
                  const badgeStyle = getStatusBadgeStyle(app.status);
                  const candidateName = user.name || student.name || 'Candidate';

                  return (
                    <tr key={app._id || app.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong style={{ color: '#f8fafc' }}>{candidateName}</strong>
                        <br />
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{user.email}</span>
                      </td>
                      <td style={styles.td}>
                        <strong style={{ color: '#38bdf8' }}>{job.title || 'Job'}</strong>
                      </td>
                      <td style={styles.td}>
                        {student.college || 'N/A'}
                        <br />
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{student.branch}</span>
                      </td>
                      <td style={styles.td}>
                        <strong>{student.cgpa !== undefined ? student.cgpa : 'N/A'}</strong> / 10.0
                      </td>
                      <td style={styles.td}>{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, ...badgeStyle }}>{app.status}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button
                            onClick={() => navigate(`/company/applications/${app._id || app.id}`)}
                            style={styles.viewBtn}
                          >
                            View Details
                          </button>
                          {app.status === 'APPLIED' && (
                            <>
                              <button
                                onClick={() => handleShortlist(app._id || app.id)}
                                disabled={actionLoading}
                                style={styles.shortlistBtn}
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(app._id || app.id)}
                                disabled={actionLoading}
                                style={styles.rejectBtn}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total applications)
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

      {/* Reject Modal */}
      {rejectModalAppId && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Reject Application</h2>
            <p style={styles.modalSubtitle}>Provide feedback and optional internal notes.</p>

            <form onSubmit={handleConfirmReject}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label}>Rejection Reason (Visible to candidate)</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Required technical experience does not match current role requirements."
                  style={styles.textarea}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={styles.label}>Company Private Notes (Internal ONLY)</label>
                <textarea
                  rows={3}
                  value={companyNotes}
                  onChange={(e) => setCompanyNotes(e.target.value)}
                  placeholder="Internal notes for recruiting team (never shown to student)..."
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setRejectModalAppId(null)}
                  style={styles.cancelBtn}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.confirmRejectBtn} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
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
  backBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
  },
  filterBar: {
    backgroundColor: '#1e293b',
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid #334155',
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  statusTabs: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tabBtn: {
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    border: '1px solid #334155',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  activeTabBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderColor: '#38bdf8',
  },
  secondaryFilters: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  selectInput: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    outline: 'none',
    fontSize: '0.9rem',
  },
  searchForm: {
    display: 'flex',
    gap: '0.5rem',
    flexGrow: 1,
  },
  searchInput: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    outline: 'none',
    fontSize: '0.9rem',
  },
  searchBtn: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: '1px solid #475569',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
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
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    padding: '1rem',
    fontSize: '0.9rem',
    borderBottom: '1px solid #334155',
  },
  tr: {
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: '#cbd5e1',
    verticalAlign: 'middle',
  },
  statusBadge: {
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'inline-block',
  },
  actionGroup: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  viewBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    border: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  shortlistBtn: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  rejectBtn: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '550px',
    border: '1px solid #7f1d1d',
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#f87171',
    marginBottom: '0.25rem',
  },
  modalSubtitle: {
    color: '#94a3b8',
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  cancelBtn: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  confirmRejectBtn: {
    backgroundColor: '#991b1b',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
