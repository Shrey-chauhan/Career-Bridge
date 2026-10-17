import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInterviewsApi, confirmInterviewApi } from '../../services/interviewService';

export default function StudentInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [timeframe, setTimeframe] = useState('UPCOMING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    fetchInterviews(1, timeframe);
  }, [timeframe]);

  const fetchInterviews = async (page = 1, tf = 'UPCOMING') => {
    setLoading(true);
    setError('');
    try {
      const res = await getInterviewsApi({ page, limit: 10, timeframe: tf });
      if (res.success && Array.isArray(res.data)) {
        setInterviews(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (interviewId) => {
    try {
      const res = await confirmInterviewApi(interviewId);
      if (res.success) {
        fetchInterviews(pagination.page, timeframe);
      }
    } catch (err) {
      alert(err.message || 'Failed to confirm interview attendance');
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/dashboard" style={styles.backLink}>← Back to Dashboard</Link>
          <h1 style={styles.title}>My Interview Schedule</h1>
        </div>
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
          Upcoming Interviews
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
            When a recruiter schedules an interview for your shortlisted application, it will appear here.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {interviews.map((item) => {
            const intId = item._id || item.id;
            const job = item.jobId || {};
            const company = item.companyId || {};
            const scheduledDate = new Date(item.scheduledAt);
            const statusBadge = getStatusBadge(item.status);

            return (
              <div key={intId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.companyName}>{company.companyName || 'Company'}</span>
                    <h3 style={styles.jobTitle}>{job.title || 'Job Opening'}</h3>
                    <span style={styles.roundName}>{item.roundName || 'Interview Round'}</span>
                  </div>

                  <div style={styles.statusGroup}>
                    <span style={{ ...styles.badge, backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                      {item.status}
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
                    <p style={styles.metaValue}>{item.duration} Minutes</p>
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
                  <div style={styles.meetingBox}>
                    <span style={styles.metaLabel}>Meeting Link</span>
                    <div style={styles.flexBetween}>
                      <a href={item.meetingLink} target="_blank" rel="noreferrer" style={styles.meetingLink}>
                        {item.meetingLink}
                      </a>
                      <a href={item.meetingLink} target="_blank" rel="noreferrer" style={styles.joinBtn}>
                        Join Interview ↗
                      </a>
                    </div>
                  </div>
                )}

                {item.interviewType === 'OFFLINE' && item.location && (
                  <div style={styles.meetingBox}>
                    <span style={styles.metaLabel}>Interview Location</span>
                    <p style={styles.metaValue}>{item.location}</p>
                  </div>
                )}

                <div style={styles.cardFooter}>
                  <Link to={`/student/applications/${item.applicationId}`} style={styles.appLink}>
                    View Application Details →
                  </Link>

                  {item.status === 'SCHEDULED' && (
                    <button onClick={() => handleConfirm(intId)} style={styles.confirmBtn}>
                      ✓ Confirm My Attendance
                    </button>
                  )}
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
    padding: '2rem',
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
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
  companyName: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  jobTitle: {
    color: '#f8fafc',
    margin: '0.2rem 0 0.3rem 0',
    fontSize: '1.25rem',
  },
  roundName: {
    color: '#38bdf8',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  statusGroup: {
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
  meetingBox: {
    backgroundColor: '#0f172a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #0284c7',
    marginBottom: '1rem',
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.3rem',
  },
  meetingLink: {
    color: '#38bdf8',
    wordBreak: 'break-all',
    fontSize: '0.9rem',
  },
  joinBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '0.85rem',
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
  confirmBtn: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: '1px solid #10b981',
    padding: '0.5rem 1.2rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
};
