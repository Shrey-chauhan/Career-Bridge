import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { testProtectedApi, testRoleApi } from '../services/api';
import { Link } from 'react-router-dom';
import NotificationBell from '../components/notifications/NotificationBell';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const runTest = async (testFn, label) => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await testFn();
      setTestResult({
        label,
        status: 200,
        success: true,
        data: res,
      });
    } catch (err) {
      setTestResult({
        label,
        status: err.status || 403,
        success: false,
        data: err,
      });
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>CareerBridge Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NotificationBell />
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* User Details & Quick Navigation Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>User Identity & Navigation</h2>
          <div style={styles.infoRow}>
            <strong>Full Name:</strong> <span>{user?.name}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>Email:</strong> <span>{user?.email}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>Role:</strong>{' '}
            <span style={styles.roleBadge}>{user?.role}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>User ID:</strong> <span style={styles.mono}>{user?.id || user?._id}</span>
          </div>

          {/* Profile & Job Actions */}
          <div style={styles.profileActionBox}>
            {user?.role === 'STUDENT' && (
              <>
                <Link to="/student/profile" style={styles.profileLinkBtn}>
                  Manage Student Profile →
                </Link>
                <Link to="/student/jobs" style={styles.jobsLinkBtn}>
                  Browse Job Opportunities →
                </Link>
                <Link to="/student/applications" style={styles.appsLinkBtn}>
                  My Job Applications →
                </Link>
                <Link to="/student/interviews" style={styles.interviewsLinkBtn}>
                  My Interview Schedule 📅 →
                </Link>
              </>
            )}

            {user?.role === 'COMPANY' && (
              <>
                <Link to="/company/profile" style={styles.profileLinkBtn}>
                  Manage Company Profile →
                </Link>
                <Link to="/company/jobs" style={styles.jobsLinkBtn}>
                  Manage Company Job Postings →
                </Link>
                <Link to="/company/applications" style={styles.appsLinkBtn}>
                  Review Candidate Applications →
                </Link>
                <Link to="/company/interviews" style={styles.interviewsLinkBtn}>
                  Interview Pipeline Dashboard 📅 →
                </Link>
              </>
            )}

            {(user?.role === 'ADMIN' || user?.role === 'TPO') && (
              <>
                <Link to="/admin/dashboard" style={styles.adminLinkBtn}>
                  Open TPO Placement Dashboard 📊 →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* RBAC Verification Suite */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Role-Based Access Verification</h2>
          <p style={styles.cardSub}>
            Click endpoints below to test JWT authentication and RBAC permissions.
          </p>

          <div style={styles.buttonGroup}>
            <button
              onClick={() => runTest(testProtectedApi, 'Protected Test')}
              style={styles.testBtn}
            >
              Test General Protected
            </button>
            <button
              onClick={() => runTest(() => testRoleApi('STUDENT'), 'Student Test')}
              style={styles.testBtn}
            >
              Test Student Route
            </button>
            <button
              onClick={() => runTest(() => testRoleApi('COMPANY'), 'Company Test')}
              style={styles.testBtn}
            >
              Test Company Route
            </button>
            <button
              onClick={() => runTest(() => testRoleApi('ADMIN'), 'Admin Test')}
              style={styles.testBtn}
            >
              Test Admin Route
            </button>
          </div>

          {loadingTest && <p style={styles.loading}>Executing request...</p>}

          {testResult && (
            <div
              style={{
                ...styles.resultBox,
                backgroundColor: testResult.success ? '#064e3b' : '#7f1d1d',
                borderColor: testResult.success ? '#10b981' : '#f87171',
              }}
            >
              <h4>Results for: {testResult.label}</h4>
              <p>
                <strong>Status:</strong>{' '}
                {testResult.success ? '200 OK — Allowed' : '403 Forbidden / Denied'}
              </p>
              <pre style={styles.codeBlock}>
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid #334155',
    paddingBottom: '1rem',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#f1f5f9',
    marginBottom: '1rem',
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    marginBottom: '1.25rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid #334155',
    fontSize: '0.95rem',
  },
  roleBadge: {
    backgroundColor: '#0284c7',
    color: '#e0f2fe',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  mono: {
    fontFamily: 'monospace',
    color: '#cbd5e1',
  },
  profileActionBox: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  profileLinkBtn: {
    display: 'block',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    textDecoration: 'none',
    textAlign: 'center',
    padding: '0.75rem',
    borderRadius: '6px',
    fontWeight: '600',
  },
  jobsLinkBtn: {
    display: 'block',
    backgroundColor: '#10b981',
    color: '#ffffff',
    textDecoration: 'none',
    textAlign: 'center',
    padding: '0.75rem',
    borderRadius: '6px',
    fontWeight: '600',
  },
  appsLinkBtn: {
    display: 'block',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    textDecoration: 'none',
    textAlign: 'center',
    padding: '0.75rem',
    borderRadius: '6px',
    fontWeight: '600',
  },
  interviewsLinkBtn: {
    display: 'block',
    backgroundColor: '#d97706',
    color: '#ffffff',
    textDecoration: 'none',
    textAlign: 'center',
    padding: '0.75rem',
    borderRadius: '6px',
    fontWeight: '600',
  },
  adminLinkBtn: {
    display: 'block',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    textDecoration: 'none',
    textAlign: 'center',
    padding: '0.75rem',
    borderRadius: '6px',
    fontWeight: '700',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  testBtn: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: '1px solid #475569',
    padding: '0.65rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  loading: {
    color: '#38bdf8',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  resultBox: {
    marginTop: '1rem',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid',
  },
  codeBlock: {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#f8fafc',
  },
};
