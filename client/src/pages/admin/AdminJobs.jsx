import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminJobsApi } from '../../services/adminService';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, status]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const res = await getAdminJobsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load jobs directory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Back to Admin Dashboard</Link>
          <h1 style={styles.title}>Corporate Job Postings Monitor</h1>
        </div>
      </header>

      {/* Filters */}
      <div style={styles.filterRow}>
        <input
          type="text"
          placeholder="Search by job title, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="">All Job Statuses</option>
          <option value="PUBLISHED">Published & Active</option>
          <option value="DRAFT">Draft</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading corporate job postings...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No job postings match criteria</h3>
        </div>
      ) : (
        <div style={styles.list}>
          {jobs.map((job) => {
            const company = job.companyId || {};
            return (
              <div key={job._id || job.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.companyName}>{company.companyName || 'Company'}</span>
                    <h3 style={styles.jobTitle}>{job.title}</h3>
                    <span style={styles.location}>{job.location} • {job.workMode} ({job.jobType})</span>
                  </div>

                  <span style={styles.statusBadge}>{job.status}</span>
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
  filterRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.65rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
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
    padding: '1.25rem 1.5rem',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  jobTitle: {
    color: '#f8fafc',
    margin: '0.2rem 0',
    fontSize: '1.2rem',
  },
  location: {
    color: '#cbd5e1',
    fontSize: '0.85rem',
  },
  statusBadge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '12px',
  },
};
