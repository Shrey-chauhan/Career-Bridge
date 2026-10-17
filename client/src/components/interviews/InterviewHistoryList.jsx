import React, { useEffect, useState } from 'react';
import { getInterviewsApi, confirmInterviewApi } from '../../services/interviewService';
import { useAuth } from '../../context/AuthContext';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import InterviewResultModal from './InterviewResultModal';

export default function InterviewHistoryList({ applicationId, applicationData = null, onRefresh }) {
  const { user } = useAuth();
  const isCompany = user?.role === 'COMPANY';

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(null);

  useEffect(() => {
    if (applicationId) {
      fetchInterviews();
    }
  }, [applicationId]);

  const fetchInterviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getInterviewsApi({ applicationId });
      if (res.success && Array.isArray(res.data)) {
        setInterviews(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (interviewId) => {
    try {
      const res = await confirmInterviewApi(interviewId);
      if (res.success) {
        fetchInterviews();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.message || 'Failed to confirm interview');
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

  if (loading) {
    return <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading interview records...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h4 style={styles.title}>Recruitment Interview Rounds</h4>
        {isCompany && applicationData?.status === 'SHORTLISTED' && (
          <button
            onClick={() => {
              setEditingInterview(null);
              setShowScheduleModal(true);
            }}
            style={styles.scheduleBtn}
          >
            + Schedule Interview Round
          </button>
        )}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {interviews.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.mutedText}>
            No interviews scheduled for this candidate yet.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {interviews.map((item) => {
            const intId = item._id || item.id;
            const statusBadge = getStatusBadge(item.status);
            const resultBadge = getResultBadge(item.result);
            const scheduledDate = new Date(item.scheduledAt);

            return (
              <div key={intId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.roundBadge}>Round {item.roundNumber || 1}</span>
                    <h5 style={styles.roundTitle}>{item.roundName}</h5>
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
                  <p>
                    <strong>Date & Time:</strong> {scheduledDate.toLocaleDateString()} at{' '}
                    {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p>
                    <strong>Duration:</strong> {item.duration} Minutes
                  </p>
                  <p>
                    <strong>Type:</strong> {item.interviewType}
                  </p>
                  <p>
                    <strong>Interviewer:</strong> {item.interviewerName} ({item.interviewerEmail})
                  </p>
                </div>

                {/* Location / Meeting Link */}
                {item.interviewType === 'ONLINE' && item.meetingLink && (
                  <div style={styles.linkBox}>
                    <strong>Meeting Link:</strong>{' '}
                    <a href={item.meetingLink} target="_blank" rel="noreferrer" style={styles.link}>
                      {item.meetingLink} ↗
                    </a>
                  </div>
                )}

                {item.interviewType === 'OFFLINE' && item.location && (
                  <div style={styles.linkBox}>
                    <strong>Location Address:</strong> <span>{item.location}</span>
                  </div>
                )}

                {/* Recruiter Internal Feedback (Company View Only) */}
                {isCompany && item.feedback && (
                  <div style={styles.feedbackBox}>
                    <strong>Internal Recruiter Notes:</strong> <p style={styles.feedbackText}>{item.feedback}</p>
                  </div>
                )}

                {/* Action Controls */}
                <div style={styles.actionRow}>
                  {!isCompany && item.status === 'SCHEDULED' && (
                    <button onClick={() => handleConfirm(intId)} style={styles.confirmBtn}>
                      ✓ Confirm My Attendance
                    </button>
                  )}

                  {isCompany && (
                    <div style={styles.companyActions}>
                      <button
                        onClick={() => {
                          setEditingInterview(item);
                          setShowScheduleModal(true);
                        }}
                        style={styles.actionBtn}
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setEvaluatingInterview(item)}
                        style={styles.actionBtnPrimary}
                      >
                        Record Result
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showScheduleModal && (
        <ScheduleInterviewModal
          application={applicationData}
          existingInterview={editingInterview}
          onClose={() => {
            setShowScheduleModal(false);
            setEditingInterview(null);
          }}
          onSuccess={() => {
            fetchInterviews();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {evaluatingInterview && (
        <InterviewResultModal
          interview={evaluatingInterview}
          onClose={() => setEvaluatingInterview(null)}
          onSuccess={() => {
            fetchInterviews();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: '1.5rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #334155',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  title: {
    color: '#f8fafc',
    fontSize: '1.1rem',
    margin: 0,
  },
  scheduleBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 0.9rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.85rem',
  },
  emptyBox: {
    backgroundColor: '#0f172a',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    textAlign: 'center',
  },
  mutedText: {
    color: '#94a3b8',
    margin: 0,
    fontSize: '0.875rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: '10px',
    padding: '1.25rem',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.85rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  roundBadge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  roundTitle: {
    color: '#f8fafc',
    margin: '0.3rem 0 0 0',
    fontSize: '1.05rem',
  },
  badgeGroup: {
    display: 'flex',
    gap: '0.4rem',
  },
  badge: {
    fontSize: '0.725rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '12px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.6rem',
    color: '#cbd5e1',
    fontSize: '0.85rem',
    marginBottom: '0.85rem',
  },
  linkBox: {
    backgroundColor: '#1e293b',
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '0.85rem',
    marginBottom: '0.85rem',
  },
  link: {
    color: '#38bdf8',
    wordBreak: 'break-all',
  },
  feedbackBox: {
    backgroundColor: '#0c4a6e22',
    border: '1px solid #0284c7',
    padding: '0.75rem',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '0.85rem',
    marginBottom: '0.85rem',
  },
  feedbackText: {
    margin: '0.3rem 0 0 0',
    whiteSpace: 'pre-wrap',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid #334155',
    paddingTop: '0.75rem',
  },
  confirmBtn: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: '1px solid #10b981',
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  companyActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    border: '1px solid #475569',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnPrimary: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
