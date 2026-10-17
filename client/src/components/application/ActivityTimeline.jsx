import React, { useEffect, useState } from 'react';
import { getApplicationActivityApi } from '../../services/notificationService';

export default function ActivityTimeline({ applicationId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (applicationId) {
      fetchTimeline();
    }
  }, [applicationId]);

  const fetchTimeline = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getApplicationActivityApi(applicationId);
      if (res.success && Array.isArray(res.data)) {
        setActivities(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load application activity history');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'APPLICATION_SUBMITTED':
        return { text: 'Submitted', bg: '#0369a1', color: '#e0f2fe' };
      case 'APPLICATION_SHORTLISTED':
        return { text: 'Shortlisted', bg: '#064e3b', color: '#a7f3d0' };
      case 'APPLICATION_REJECTED':
        return { text: 'Rejected', bg: '#7f1d1d', color: '#fca5a5' };
      case 'APPLICATION_WITHDRAWN':
        return { text: 'Withdrawn', bg: '#475569', color: '#cbd5e1' };
      default:
        return { text: action, bg: '#334155', color: '#f8fafc' };
    }
  };

  if (loading) {
    return <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading activity history...</p>;
  }

  if (error) {
    return <p style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{error}</p>;
  }

  if (activities.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No activity records found.</p>;
  }

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Application Activity History</h4>

      <div style={styles.timeline}>
        {activities.map((act, index) => {
          const badge = getActionBadge(act.action);
          const formattedTime = new Date(act.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={act._id || act.id || index} style={styles.timelineItem}>
              <div style={styles.lineMarker}>
                <span style={styles.dot} />
                {index !== activities.length - 1 && <span style={styles.verticalLine} />}
              </div>

              <div style={styles.content}>
                <div style={styles.headerRow}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.text}
                  </span>
                  <span style={styles.timestamp}>{formattedTime}</span>
                </div>
                <p style={styles.description}>{act.description}</p>
                {act.metadata?.rejectionReason && (
                  <p style={styles.reasonText}>
                    <strong>Feedback:</strong> {act.metadata.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '1.5rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #334155',
  },
  title: {
    color: '#f8fafc',
    fontSize: '1.05rem',
    margin: '0 0 1.25rem 0',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  timelineItem: {
    display: 'flex',
    gap: '0.75rem',
  },
  lineMarker: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '16px',
    paddingTop: '4px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#38bdf8',
  },
  verticalLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#334155',
    marginTop: '4px',
  },
  content: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  badge: {
    fontSize: '0.725rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  timestamp: {
    color: '#94a3b8',
    fontSize: '0.75rem',
  },
  description: {
    color: '#cbd5e1',
    margin: 0,
    fontSize: '0.875rem',
  },
  reasonText: {
    color: '#fca5a5',
    margin: '0.4rem 0 0 0',
    fontSize: '0.825rem',
  },
};
