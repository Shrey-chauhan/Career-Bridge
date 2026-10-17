import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminInterviewsApi } from '../../services/adminService';

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, [status]);

  const fetchInterviews = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status) params.status = status;

      const res = await getAdminInterviewsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setInterviews(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Back to Admin Dashboard</Link>
          <h1 style={styles.title}>Global Interview Rounds Monitor</h1>
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="">All Interview Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading interview schedule...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No interview records found</h3>
        </div>
      ) : (
        <div style={styles.list}>
          {interviews.map((item) => {
            const std = item.studentId || {};
            const userObj = std.userId || {};
            const job = item.jobId || {};
            const company = item.companyId || {};

            return (
              <div key={item._id || item.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.companyName}>{company.companyName} • {job.title}</span>
                    <h3 style={styles.roundName}>{item.roundName}</h3>
                    <p style={styles.candidateText}>Candidate: {userObj.name || std.name || 'Candidate'}</p>
                  </div>

                  <div style={styles.badgeGroup}>
                    <span style={styles.badge}>{item.status}</span>
                    <span style={styles.resultBadge}>Result: {item.result}</span>
                  </div>
                </div>

                <div style={styles.detailsGrid}>
                  <div>
                    <span style={styles.metaLabel}>Date & Time</span>
                    <p style={styles.metaVal}>{new Date(item.scheduledAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Type & Duration</span>
                    <p style={styles.metaVal}>{item.interviewType} ({item.duration} Mins)</p>
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Interviewer</span>
                    <p style={styles.metaVal}>{item.interviewerName}</p>
                  </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  select: {
    padding: '0.65rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
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
    gap: '1rem',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.85rem',
  },
  companyName: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  roundName: {
    color: '#f8fafc',
    margin: '0.2rem 0',
    fontSize: '1.15rem',
  },
  candidateText: {
    color: '#38bdf8',
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  badgeGroup: {
    display: 'flex',
    gap: '0.4rem',
  },
  badge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  resultBadge: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.8rem',
    backgroundColor: '#0f172a',
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  metaLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  metaVal: {
    color: '#f8fafc',
    margin: 0,
    fontSize: '0.875rem',
  },
};
