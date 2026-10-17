import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
  deleteNotificationApi,
} from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationContext';

export default function Notifications() {
  const { user } = useAuth();
  const { fetchUnreadCount } = useNotifications();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications(1, filterUnread);
  }, [filterUnread]);

  const fetchNotifications = async (page = 1, isUnreadOnly = false) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (isUnreadOnly) {
        params.isRead = 'false';
      }
      const res = await getNotificationsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchNotifications(newPage, filterUnread);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await markAsReadApi(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true, readAt: new Date() } : n))
        );
        fetchUnreadCount();
      }
    } catch (err) {
      alert(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllAsReadApi();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        fetchUnreadCount();
      }
    } catch (err) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteNotificationApi(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
        fetchUnreadCount();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete notification');
    }
  };

  const handleNavigate = (notif) => {
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
        navigate('/company/jobs');
      }
    } else if (entityTypeStr === 'INTERVIEW') {
      if (user?.role === 'STUDENT') {
        navigate('/student/interviews');
      } else if (user?.role === 'COMPANY') {
        navigate('/company/interviews');
      }
    }
  };

  const getIcon = (type) => {
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/dashboard" style={styles.backLink}>← Back to Dashboard</Link>
          <h1 style={styles.title}>Notifications Hub</h1>
        </div>

        <button onClick={handleMarkAllAsRead} style={styles.markAllBtn}>
          ✓ Mark All as Read
        </button>
      </header>

      {/* Filter Tabs */}
      <div style={styles.tabsRow}>
        <button
          onClick={() => setFilterUnread(false)}
          style={{
            ...styles.tabBtn,
            borderBottom: !filterUnread ? '3px solid #38bdf8' : 'none',
            color: !filterUnread ? '#38bdf8' : '#94a3b8',
          }}
        >
          All Notifications
        </button>

        <button
          onClick={() => setFilterUnread(true)}
          style={{
            ...styles.tabBtn,
            borderBottom: filterUnread ? '3px solid #38bdf8' : 'none',
            color: filterUnread ? '#38bdf8' : '#94a3b8',
          }}
        >
          Unread Only
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Notifications List */}
      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={styles.emptyCard}>
          <span style={{ fontSize: '3rem' }}>🔔</span>
          <h3>No notifications found</h3>
          <p style={styles.mutedText}>
            You'll see updates about job applications, recruitment status changes, and new openings here.
          </p>
        </div>
      ) : (
        <div style={styles.listContainer}>
          {notifications.map((notif) => {
            const notifId = notif._id || notif.id;
            return (
              <div
                key={notifId}
                style={{
                  ...styles.notifCard,
                  borderColor: notif.isRead ? '#334155' : '#0284c7',
                  backgroundColor: notif.isRead ? '#1e293b' : '#0f172a',
                }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.typeBadgeGroup}>
                    <span style={styles.icon}>{getIcon(notif.type)}</span>
                    <span style={styles.typeText}>{notif.type.replace('_', ' ')}</span>
                    {!notif.isRead && <span style={styles.unreadBadge}>New</span>}
                  </div>
                  <span style={styles.dateText}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 style={styles.cardTitle}>{notif.title}</h3>
                <p style={styles.cardMessage}>{notif.message}</p>

                <div style={styles.cardFooter}>
                  <button onClick={() => handleNavigate(notif)} style={styles.openBtn}>
                    View Related Details ↗
                  </button>

                  <div style={styles.rightActions}>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notifId)}
                        style={styles.markBtn}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notifId)}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={styles.paginationRow}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                style={styles.pageBtn}
              >
                ← Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                style={styles.pageBtn}
              >
                Next →
              </button>
            </div>
          )}
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
  markAllBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
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
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  notifCard: {
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  typeBadgeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1.2rem',
  },
  typeText: {
    color: '#38bdf8',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  dateText: {
    color: '#94a3b8',
    fontSize: '0.8rem',
  },
  cardTitle: {
    color: '#f8fafc',
    margin: '0 0 0.4rem 0',
    fontSize: '1.1rem',
  },
  cardMessage: {
    color: '#cbd5e1',
    margin: '0 0 1rem 0',
    fontSize: '0.95rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #334155',
    paddingTop: '0.75rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  openBtn: {
    backgroundColor: '#0369a1',
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 0.9rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  rightActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  markBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    border: '1px solid #475569',
    padding: '0.45rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    padding: '0.45rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  pageBtn: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  pageInfo: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
  },
};
