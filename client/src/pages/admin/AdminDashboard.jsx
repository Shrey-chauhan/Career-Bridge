import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminMetricsApi, getPlacementDrivesApi } from '../../services/adminService';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsRes, drivesRes] = await Promise.all([
        getAdminMetricsApi(),
        getPlacementDrivesApi({ limit: 5 }),
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (drivesRes.success) setDrives(drivesRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load placement dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: '4rem' }}>
          Loading TPO Placement Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <span style={styles.roleTag}>TPO / Placement Administration</span>
          <h1 style={styles.title}>College Placement Dashboard</h1>
        </div>
        <Link to="/dashboard" style={styles.backBtn}>← Main Dashboard</Link>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Metric Cards Grid */}
      <div style={styles.metricsGrid}>
        <div className="card-hover" style={styles.metricCard}>
          <span className="icon-bounce" style={styles.metricIcon}>🎓</span>
          <div style={styles.metricContent}>
            <span style={styles.metricLabel}>Total Students</span>
            <h2 style={styles.metricValue}>{metrics?.students?.total || 0}</h2>
            <span style={styles.metricSub}>{metrics?.students?.active || 0} Active Profiles</span>
          </div>
        </div>

        <div className="card-hover" style={styles.metricCard}>
          <span className="icon-bounce" style={styles.metricIcon}>🏢</span>
          <div style={styles.metricContent}>
            <span style={styles.metricLabel}>Registered Companies</span>
            <h2 style={styles.metricValue}>{metrics?.companies?.total || 0}</h2>
            <span style={styles.metricSub}>
              {metrics?.companies?.verified || 0} Verified • {metrics?.companies?.pending || 0} Pending
            </span>
          </div>
        </div>

        <div className="card-hover" style={styles.metricCard}>
          <span className="icon-bounce" style={styles.metricIcon}>💼</span>
          <div style={styles.metricContent}>
            <span style={styles.metricLabel}>Job Postings</span>
            <h2 style={styles.metricValue}>{metrics?.jobs?.total || 0}</h2>
            <span style={styles.metricSub}>{metrics?.jobs?.active || 0} Published & Open</span>
          </div>
        </div>

        <div className="card-hover" style={styles.metricCard}>
          <span className="icon-bounce" style={styles.metricIcon}>📄</span>
          <div style={styles.metricContent}>
            <span style={styles.metricLabel}>Applications Submitted</span>
            <h2 style={styles.metricValue}>{metrics?.applications?.total || 0}</h2>
            <span style={styles.metricSub}>{metrics?.applications?.shortlisted || 0} Shortlisted</span>
          </div>
        </div>

        <div className="card-hover" style={styles.metricCard}>
          <span className="icon-bounce" style={styles.metricIcon}>📅</span>
          <div style={styles.metricContent}>
            <span style={styles.metricLabel}>Interviews Conducted</span>
            <h2 style={styles.metricValue}>{metrics?.interviews?.completed || 0}</h2>
            <span style={styles.metricSub}>{metrics?.interviews?.upcoming || 0} Upcoming Rounds</span>
          </div>
        </div>

        <div className="card-hover" style={{ ...styles.metricCard, borderLeft: '4px solid #10b981' }}>
          <span className="icon-bounce" style={styles.metricIcon}>🌟</span>
          <div style={styles.metricContent}>
            <span style={styles.metricLabel}>Placed Candidates</span>
            <h2 style={{ ...styles.metricValue, color: '#34d399' }}>{metrics?.placedStudents || 0}</h2>
            <span style={styles.metricSub}>Recruitment Selections</span>
          </div>
        </div>
      </div>

      {/* Quick Access Navigation Bar */}
      <div style={styles.quickNav}>
        <h3 style={styles.sectionTitle}>Placement Operations</h3>
        <div style={styles.navGrid}>
          <Link to="/admin/students" className="nav-card-interactive" style={styles.navCard}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>🎓</span>
            <div>
              <strong>Student Roster</strong>
              <p style={styles.navDesc}>Search, filter, academic profile overview</p>
            </div>
          </Link>

          <Link to="/admin/companies" className="nav-card-interactive" style={styles.navCard}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>🏢</span>
            <div>
              <strong>Company Verification</strong>
              <p style={styles.navDesc}>Review & verify corporate recruiter credentials</p>
            </div>
          </Link>

          <Link to="/admin/jobs" className="nav-card-interactive" style={styles.navCard}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>💼</span>
            <div>
              <strong>Job Openings</strong>
              <p style={styles.navDesc}>Monitor active job postings & eligibility</p>
            </div>
          </Link>

          <Link to="/admin/applications" className="nav-card-interactive" style={styles.navCard}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>📄</span>
            <div>
              <strong>Application Pipeline</strong>
              <p style={styles.navDesc}>Track student submission & shortlists</p>
            </div>
          </Link>

          <Link to="/admin/interviews" className="nav-card-interactive" style={styles.navCard}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>📅</span>
            <div>
              <strong>Interview Rounds</strong>
              <p style={styles.navDesc}>Monitor scheduled technical & HR interviews</p>
            </div>
          </Link>

          <Link to="/admin/drives" className="nav-card-interactive" style={styles.navCard}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>🚀</span>
            <div>
              <strong>Placement Drives</strong>
              <p style={styles.navDesc}>Manage campus hiring drives & events</p>
            </div>
          </Link>

          <Link to="/admin/analytics" className="nav-card-interactive" style={{ ...styles.navCard, border: '1px solid #0284c7' }}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>📈</span>
            <div>
              <strong>Placement Analytics</strong>
              <p style={styles.navDesc}>Recruitment funnel, trends & intelligence</p>
            </div>
          </Link>

          <Link to="/admin/audit-logs" className="nav-card-interactive" style={styles.navCard}>
            <span className="icon-bounce" style={{ fontSize: '1.5rem' }}>📜</span>
            <div>
              <strong>Audit Trail Logs</strong>
              <p style={styles.navDesc}>Security and administrative audit history</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Active Campus Drives Preview */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Campus Placement Drives</h3>
          <Link to="/admin/drives" style={styles.linkText}>View All Drives →</Link>
        </div>

        {drives.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.mutedText}>No active campus placement drives created yet.</p>
          </div>
        ) : (
          <div style={styles.drivesList}>
            {drives.map((d) => (
              <div key={d._id || d.id} style={styles.driveCard}>
                <div>
                  <span style={styles.driveStatus}>{d.status}</span>
                  <h4 style={styles.driveName}>{d.name}</h4>
                  <span style={styles.companyName}>
                    {d.companyId?.companyName || 'Corporate Recruiter'} • {d.location}
                  </span>
                </div>
                <div style={styles.driveDates}>
                  <p style={styles.metaLabel}>Schedule Window</p>
                  <p style={styles.metaValue}>
                    {new Date(d.startDate).toLocaleDateString()} – {new Date(d.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  roleTag: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
    margin: '0.3rem 0 0 0',
  },
  backBtn: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  metricCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  metricIcon: {
    fontSize: '2.25rem',
  },
  metricContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#f8fafc',
    margin: '0.2rem 0',
  },
  metricSub: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
  },
  quickNav: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#f8fafc',
    margin: '0 0 1rem 0',
  },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1rem',
  },
  navCard: {
    backgroundColor: '#1e293b',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    border: '1px solid #334155',
    textDecoration: 'none',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'border-color 0.2s',
  },
  navDesc: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    margin: '0.2rem 0 0 0',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #334155',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  linkText: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  emptyBox: {
    padding: '1.5rem',
    textAlign: 'center',
  },
  mutedText: {
    color: '#94a3b8',
    margin: 0,
  },
  drivesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  driveCard: {
    backgroundColor: '#0f172a',
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  driveStatus: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  driveName: {
    color: '#f8fafc',
    margin: '0.3rem 0 0.1rem 0',
    fontSize: '1.05rem',
  },
  companyName: {
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  driveDates: {
    textAlign: 'right',
  },
  metaLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
  },
  metaValue: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    margin: 0,
    fontWeight: '600',
  },
};
