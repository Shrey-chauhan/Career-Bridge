import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getInterviewsApi,
  cancelInterviewApi,
  completeInterviewApi,
  markNoShowApi,
} from '../../services/interviewService';
import ScheduleInterviewModal from '../../components/interviews/ScheduleInterviewModal';
import InterviewResultModal from '../../components/interviews/InterviewResultModal';

export default function CompanyInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [timeframe, setTimeframe] = useState('UPCOMING');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal State
  const [editingInterview, setEditingInterview] = useState(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(null);

  useEffect(() => {
    fetchInterviews(1, timeframe, statusFilter);
  }, [timeframe, statusFilter]);

  const fetchInterviews = async (page = 1, tf = 'UPCOMING', st = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10, timeframe: tf };
      if (st) params.status = st;

      const res = await getInterviewsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setInterviews(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load company interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (interviewId) => {
    try {
      const res = await completeInterviewApi(interviewId);
      if (res.success) {
        fetchInterviews(pagination.page, timeframe, statusFilter);
      }
    } catch (err) {
      alert(err.message || 'Failed to complete interview');
    }
  };

  const handleNoShow = async (interviewId) => {
    if (!window.confirm('Are you sure you want to mark candidate as No-Show?')) return;
    try {
      const res = await markNoShowApi(interviewId);
      if (res.success) {
        fetchInterviews(pagination.page, timeframe, statusFilter);
      }
    } catch (err) {
      alert(err.message || 'Failed to update status to No-Show');
    }
  };

  const handleCancel = async (interviewId) => {
    const reason = window.prompt('Enter cancellation reason (optional):');
    if (reason === null) return;
    try {
      const res = await cancelInterviewApi(interviewId, reason);
      if (res.success) {
        fetchInterviews(pagination.page, timeframe, statusFilter);
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel interview');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED': return { bg: '#064e3b', color: '#6ee7b7' };
      case 'COMPLETED': return { bg: '#0284c7', color: '#e0f2fe' };
      case 'CANCELLED': return { bg: '#7f1d1d', color: '#fca5a5' };
      case 'NO_SHOW': return { bg: '#991b1b', color: '#fca5a5' };
      case 'SCHEDULED': default: return { bg: '#0369a1', color: '#e0f2fe' };
    }
  };

  const getResultBadge = (result) => {
    switch (result) {
      case 'PASSED': return { bg: '#064e3b', color: '#a7f3d0' };
      case 'NEXT_ROUND': return { bg: '#0369a1', color: '#e0f2fe' };
      case 'FAILED': return { bg: '#7f1d1d', color: '#fca5a5' };
      case 'PENDING': default: return { bg: '#334155', color: '#cbd5e1' };
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/dashboard" style={styles.backLink}>← Back to Dashboard</Link>
          <h1 style={styles.title}>Company Interview Management</h1>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </header>

      {/* Tabs */}
      <div style={styles.tabsRow}>
        <button
          onClick={() => setTimeframe('UPCOMING')}
          style={{
            ...styles.tabBtn,
            borderBottom: timeframe === 'UPCOMING' ? '3px solid #38bdf8' : 'none',
            color: timeframe === 'UPCOMING' ? '#38bdf8' : '#94a3b8',
          }}
        >
          Upcoming Pipeline
        </button>
        <button
          onClick={() => setTimeframe('PAST')}
          style={{
            ...styles.tabBtn,
            borderBottom: timeframe === 'PAST' ? '3px solid #38bdf8' : 'none',
            color: timeframe === 'PAST' ? '#38bdf8' : '#94a3b8',
          }}
        >
          Interview History
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading interview schedule...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div style={styles.emptyCard}>
          <span style={{ fontSize: '3rem' }}>📅</span>
          <h3>No {timeframe.toLowerCase()} interviews found</h3>
          <p style={styles.mutedText}>
            Interviews scheduled for shortlisted candidates will appear here.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {interviews.map((item) => {
            const intId = item._id || item.id;
            const job = item.jobId || {};
            const student = item.studentId || {};
            const candidateUser = student.userId || {};
            const scheduledDate = new Date(item.scheduledAt);
            const statusBadge = getStatusBadge(item.status);
            const resultBadge = getResultBadge(item.result);

            return (
              <div key={intId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.candidateName}>{candidateUser.name || student.name || 'Candidate'}</span>
                    <h3 style={styles.jobTitle}>{job.title || 'Job Opening'}</h3>
                    <span style={styles.roundName}>{item.roundName || 'Interview Round'}</span>
                  </div>

                  <div style={styles.badgeGroup}>
                    <span style={{ ...styles.badge, backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                      {item.status}
                    </span>
                    <span style={{ ...styles.badge, backgroundColor: resultBadge.bg, color: resultBadge.color }}>
                      Result: {item.result}
                    </span>
                  </div>
                </div>

                <div style={styles.detailsGrid}>
                  <div>
                    <span style={styles.metaLabel}>Date & Time</span>
                    <p style={styles.metaValue}>
                      {scheduledDate.toLocaleDateString()} at{' '}
                      {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Duration</span>
                    <p style={styles.metaValue}>{item.duration} Mins</p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Type</span>
                    <p style={styles.metaValue}>{item.interviewType}</p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Interviewer</span>
                    <p style={styles.metaValue}>{item.interviewerName}</p>
                  </div>
                </div>

                {item.interviewType === 'ONLINE' && item.meetingLink && (
                  <div style={styles.linkBox}>
                    <span style={styles.metaLabel}>Meeting Link</span>
                    <a href={item.meetingLink} target="_blank" rel="noreferrer" style={styles.meetingLink}>
                      {item.meetingLink} ↗
                    </a>
                  </div>
                )}

                {item.interviewType === 'OFFLINE' && item.location && (
                  <div style={styles.linkBox}>
                    <span style={styles.metaLabel}>Location</span>
                    <p style={styles.metaValue}>{item.location}</p>
                  </div>
                )}

                {item.feedback && (
                  <div style={styles.feedbackBox}>
                    <span style={styles.metaLabel}>Internal Recruiter Feedback</span>
                    <p style={styles.feedbackText}>{item.feedback}</p>
                  </div>
                )}

                <div style={styles.cardFooter}>
                  <Link to={`/company/applications/${item.applicationId}`} style={styles.appLink}>
                    View Candidate Profile →
                  </Link>

                  <div style={styles.rightActions}>
                    {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                      <button
                        onClick={() => setEditingInterview(item)}
                        style={styles.actionBtn}
                      >
                        Reschedule
                      </button>
                    )}

                    {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleComplete(intId)}
                        style={styles.actionBtnSuccess}
                      >
                        Mark Complete
                      </button>
                    )}

                    <button
                      onClick={() => setEvaluatingInterview(item)}
                      style={styles.actionBtnPrimary}
                    >
                      Record Result
                    </button>

                    {item.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleNoShow(intId)}
                        style={styles.actionBtnMuted}
                      >
                        No Show
                      </button>
                    )}

                    {item.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancel(intId)}
                        style={styles.actionBtnDanger}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {editingInterview && (
        <ScheduleInterviewModal
          existingInterview={editingInterview}
          onClose={() => setEditingInterview(null)}
          onSuccess={() => fetchInterviews(pagination.page, timeframe, statusFilter)}
        />
      )}

      {evaluatingInterview && (
        <InterviewResultModal
          interview={evaluatingInterview}
          onClose={() => setEvaluatingInterview(null)}
          onSuccess={() => fetchInterviews(pagination.page, timeframe, statusFilter)}
        />
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
    flexWrap: 'wrap',
    gap: '1rem',
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
  filterSelect: {
    padding: '0.65rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
  },
  tabsRow: {
    display: 'flex',
    gap: '1.5rem',
    borderBottom: '1px solid #334155',
    marginBottom: '1.5rem',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '0.75rem 0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  candidateName: {
    color: '#38bdf8',
    fontSize: '1.15rem',
    fontWeight: '700',
  },
  jobTitle: {
    color: '#cbd5e1',
    margin: '0.2rem 0 0.3rem 0',
    fontSize: '0.95rem',
  },
  roundName: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  badgeGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#0f172a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  metaLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '0.2rem',
  },
  metaValue: {
    color: '#f8fafc',
    margin: 0,
    fontSize: '0.9rem',
  },
  linkBox: {
    backgroundColor: '#0f172a',
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    marginBottom: '1rem',
  },
  meetingLink: {
    color: '#38bdf8',
    wordBreak: 'break-all',
    fontSize: '0.875rem',
  },
  feedbackBox: {
    backgroundColor: '#0c4a6e22',
    border: '1px solid #0284c7',
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  feedbackText: {
    color: '#cbd5e1',
    margin: '0.2rem 0 0 0',
    fontSize: '0.875rem',
    whiteSpace: 'pre-wrap',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #334155',
    paddingTop: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  appLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  rightActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  actionBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    border: '1px solid #475569',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSuccess: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  actionBtnPrimary: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  actionBtnMuted: {
    backgroundColor: '#475569',
    color: '#f8fafc',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnDanger: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
