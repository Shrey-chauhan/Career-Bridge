import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function NotificationDropdown({ onClose }) {
  const { recentNotifications, loadingDropdown, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED': return '📄';
      case 'APPLICATION_SHORTLISTED': return '⭐';
      case 'APPLICATION_REJECTED': return 'ℹ️';
      case 'APPLICATION_WITHDRAWN': return '↩️';
      case 'JOB_PUBLISHED': return '💼';
      case 'INTERVIEW_SCHEDULED': return '📅';
      case 'INTERVIEW_RESCHEDULED': return '🔄';
      case 'INTERVIEW_CANCELLED': return '❌';
      case 'INTERVIEW_CONFIRMED': return '✅';
      case 'INTERVIEW_COMPLETED': return '🎓';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notif) => {
    const notifId = notif._id || notif.id;

    if (!notif.isRead) {
      try {
        await markAsRead(notifId);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (onClose) onClose();

    // Deep linking navigation based on role and entityType
    const entityTypeStr = (notif.entityType || '').toUpperCase();
    if (entityTypeStr === 'APPLICATION') {
      if (user?.role === 'STUDENT') {
        navigate(`/student/applications/${notif.entityId}`);
      } else if (user?.role === 'COMPANY') {
        navigate(`/company/applications/${notif.entityId}`);
      }
    } else if (entityTypeStr === 'JOB') {
      if (user?.role === 'STUDENT') {
        navigate(`/student/jobs/${notif.entityId}`);
      } else if (user?.role === 'COMPANY') {
        navigate(`/company/jobs`);
      }
    } else if (entityTypeStr === 'INTERVIEW') {
      if (user?.role === 'STUDENT') {
        navigate('/student/interviews');
      } else if (user?.role === 'COMPANY') {
        navigate('/company/interviews');
      }
    }
  };

  return (
    <div style={styles.dropdown}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Notifications</span>
        <button onClick={markAllAsRead} style={styles.markAllBtn}>
          Mark all read
        </button>
      </div>

      <div style={styles.listContainer}>
        {loadingDropdown ? (
          <p style={styles.statusText}>Loading notifications...</p>
        ) : recentNotifications.length === 0 ? (
          <p style={styles.statusText}>No notifications yet.</p>
        ) : (
          recentNotifications.map((notif) => {
            const notifId = notif._id || notif.id;
            return (
              <div
                key={notifId}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  ...styles.item,
                  backgroundColor: notif.isRead ? 'transparent' : '#0f172a',
                }}
              >
                <div style={styles.iconCol}>
                  <span style={styles.typeIcon}>{getNotificationIcon(notif.type)}</span>
                  {!notif.isRead && <span style={styles.unreadDot} />}
                </div>

                <div style={styles.contentCol}>
                  <p style={styles.title}>{notif.title}</p>
                  <p style={styles.message}>{notif.message}</p>
                  <span style={styles.timeAgo}>{formatTimeAgo(notif.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={styles.footer}>
        <Link to="/notifications" onClick={onClose} style={styles.viewAllLink}>
          View All Notifications →
        </Link>
      </div>
    </div>
  );
}

const styles = {
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    width: '340px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #334155',
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#f8fafc',
    fontSize: '0.95rem',
  },
  markAllBtn: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  listContainer: {
    maxHeight: '360px',
    overflowY: 'auto',
  },
  statusText: {
    padding: '1.5rem',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.85rem',
    margin: 0,
  },
  item: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderBottom: '1px solid #334155',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  iconCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
  },
  typeIcon: {
    fontSize: '1.25rem',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#38bdf8',
  },
  contentCol: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: '0.875rem',
    fontWeight: '600',
    margin: '0 0 0.2rem 0',
  },
  message: {
    color: '#cbd5e1',
    fontSize: '0.8rem',
    margin: '0 0 0.4rem 0',
    lineHeight: '1.3',
  },
  timeAgo: {
    color: '#94a3b8',
    fontSize: '0.725rem',
  },
  footer: {
    padding: '0.75rem',
    textAlign: 'center',
    borderTop: '1px solid #334155',
    backgroundColor: '#0f172a',
  },
  viewAllLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
};
