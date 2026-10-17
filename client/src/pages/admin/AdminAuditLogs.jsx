import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminAuditLogsApi } from '../../services/adminService';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [entityType]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 50 };
      if (entityType) params.entityType = entityType;

      const res = await getAdminAuditLogsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Back to Admin Dashboard</Link>
          <h1 style={styles.title}>Enterprise Security & Administrative Audit Logs</h1>
        </div>

        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={styles.select}>
          <option value="">All Entity Types</option>
          <option value="COMPANY">Company Verification</option>
          <option value="STUDENT">Student Status</option>
          <option value="DRIVE">Placement Drive</option>
          <option value="JOB">Job Monitoring</option>
        </select>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading administrative audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No audit log records found</h3>
          <p style={styles.mutedText}>Administrative actions like company verification or account status toggles will be audited here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {logs.map((log) => {
            const actor = log.actorId || {};
            const createdDate = new Date(log.createdAt);

            return (
              <div key={log._id || log.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.actionTag}>{log.action}</span>
                    <h4 style={styles.descText}>{log.description}</h4>
                  </div>
                  <span style={styles.timeText}>{createdDate.toLocaleString()}</span>
                </div>

                <div style={styles.metaRow}>
                  <span>
                    <strong>Performed By:</strong> {actor.name || 'Placement Admin'} ({log.actorRole || 'ADMIN'})
                  </span>
                  <span>
                    <strong>Entity Type:</strong> {log.entityType}
                  </span>
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
    fontSize: '2rem',
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
    gap: '0.85rem',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },
  actionTag: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  },
  descText: {
    color: '#f8fafc',
    margin: '0.3rem 0 0 0',
    fontSize: '1rem',
  },
  timeText: {
    color: '#94a3b8',
    fontSize: '0.8rem',
  },
  metaRow: {
    display: 'flex',
    gap: '1.5rem',
    color: '#cbd5e1',
    fontSize: '0.825rem',
    borderTop: '1px solid #334155',
    paddingTop: '0.5rem',
    marginTop: '0.5rem',
  },
};
