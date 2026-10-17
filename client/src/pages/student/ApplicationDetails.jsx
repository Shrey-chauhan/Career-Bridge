import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMyApplicationByIdApi, withdrawApplicationApi } from '../../services/applicationService';
import ActivityTimeline from '../../components/application/ActivityTimeline';
import InterviewHistoryList from '../../components/interviews/InterviewHistoryList';

export default function StudentApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyApplicationByIdApi(id);
      if (res.success) {
        setApplication(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await withdrawApplicationApi(id);
      if (res.success) {
        setActionSuccess('Application successfully withdrawn');
        setApplication(res.data);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p>Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div style={styles.container}>
        <Link to="/student/applications" style={styles.backLink}>
          ← Back to My Applications
        </Link>
        <div style={styles.errorBox}>{error || 'Application not found'}</div>
      </div>
    );
  }

  const job = application.jobId || {};
  const company = application.companyId || job.companyId || {};
  const resume = application.resumeSnapshot || {};

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

  const badgeStyle = getStatusBadgeStyle(application.status);

  return (
    <div style={styles.container}>
      <Link to="/student/applications" style={styles.backLink}>
        ← Back to My Applications
      </Link>

      {actionError && <div style={styles.errorBox}>{actionError}</div>}
      {actionSuccess && <div style={styles.successBox}>{actionSuccess}</div>}

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>{job.title || 'Job Application'}</h1>
          <p style={styles.companySubtitle}>{company.companyName || 'Company'}</p>
        </div>
        <div style={{ ...styles.statusBadge, ...badgeStyle }}>{application.status}</div>
      </div>

      <div style={styles.grid}>
        {/* Main Details */}
        <div style={styles.mainContent}>
          {/* Rejection Notice if REJECTED */}
          {application.status === 'REJECTED' && (
            <div style={styles.rejectionNotice}>
              <h3 style={styles.rejectionHeader}>Application Status Notice</h3>
              <p style={styles.rejectionBody}>
                {application.rejectionReason
                  ? `Feedback: "${application.rejectionReason}"`
                  : 'Your application was not shortlisted for further rounds for this role.'}
              </p>
            </div>
          )}

          {/* Shortlisted Notice */}
          {application.status === 'SHORTLISTED' && (
            <div style={styles.shortlistedNotice}>
              <h3>🎉 Congratulations! You have been shortlisted!</h3>
              <p>The recruitment team will reach out to you with interview details.</p>
            </div>
          )}

          {/* Cover Letter */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Submitted Cover Letter</h3>
            {application.coverLetter ? (
              <p style={styles.coverText}>{application.coverLetter}</p>
            ) : (
              <p style={styles.mutedText}>No cover letter was attached to this application.</p>
            )}
          </div>

          {/* Resume Snapshot */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Resume Snapshot Attached</h3>
            {resume.url || resume.fileName ? (
              <div style={styles.resumeBox}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#f8fafc' }}>
                    {resume.fileName || 'Resume Document'}
                  </p>
                  {resume.url && (
                    <a
                      href={resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.resumeLink}
                    >
                      View Submitted Resume Link
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p style={styles.mutedText}>No resume link snapshot was recorded at submission time.</p>
            )}
          </div>

          {/* Interview History */}
          <div style={styles.card}>
            <InterviewHistoryList
              applicationId={id}
              applicationData={application}
              onRefresh={fetchApplicationDetails}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Metadata Card & Timeline */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Application Details</h3>
            <div style={styles.timelineList}>
              <p>
                <strong>Applied On:</strong> <br />
                {new Date(application.appliedAt).toLocaleString()}
              </p>
              {application.reviewedAt && (
                <p>
                  <strong>Reviewed On:</strong> <br />
                  {new Date(application.reviewedAt).toLocaleString()}
                </p>
              )}
              <p>
                <strong>Job Location:</strong> <br />
                {job.location || 'Not Specified'}
              </p>
              <p>
                <strong>Work Mode:</strong> <br />
                {job.workMode || 'N/A'}
              </p>
            </div>

            <ActivityTimeline applicationId={id} />
          </div>

          {/* Withdraw Action (Only available if status is APPLIED) */}
          {application.status === 'APPLIED' && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Withdraw Application</h3>
              <p style={styles.mutedText}>
                Need to cancel your application? You can withdraw as long as the status is APPLIED.
              </p>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                style={styles.withdrawBtn}
              >
                {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
              </button>
            </div>
          )}
        </div>
      </div>
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
    color: '#94a3b8',
  },
  backLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    marginBottom: '1rem',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
    margin: 0,
  },
  companySubtitle: {
    fontSize: '1.1rem',
    color: '#cbd5e1',
    marginTop: '0.25rem',
  },
  statusBadge: {
    padding: '0.6rem 1.25rem',
    borderRadius: '20px',
    border: '1px solid',
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  successBox: {
    backgroundColor: '#064e3b',
    color: '#a7f3d0',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr',
    gap: '1.5rem',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  rejectionNotice: {
    backgroundColor: '#7f1d1d22',
    border: '1px solid #f87171',
    padding: '1.5rem',
    borderRadius: '12px',
  },
  rejectionHeader: {
    color: '#fca5a5',
    margin: 0,
    marginBottom: '0.5rem',
  },
  rejectionBody: {
    color: '#cbd5e1',
    margin: 0,
  },
  shortlistedNotice: {
    backgroundColor: '#064e3b22',
    border: '1px solid #10b981',
    padding: '1.5rem',
    borderRadius: '12px',
    color: '#a7f3d0',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '1.75rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  cardTitle: {
    fontSize: '1.15rem',
    color: '#38bdf8',
    marginBottom: '1rem',
  },
  coverText: {
    color: '#cbd5e1',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
  },
  mutedText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  resumeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#0f172a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  resumeLink: {
    color: '#38bdf8',
    fontSize: '0.85rem',
    textDecoration: 'none',
    marginTop: '0.25rem',
    display: 'inline-block',
  },
  timelineList: {
    lineHeight: '1.8',
    color: '#cbd5e1',
    fontSize: '0.9rem',
  },
  withdrawBtn: {
    width: '100%',
    backgroundColor: '#991b1b',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};
