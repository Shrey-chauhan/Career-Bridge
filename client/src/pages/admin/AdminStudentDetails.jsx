import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminStudentByIdApi, toggleStudentStatusApi } from '../../services/adminService';

export default function AdminStudentDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminStudentByIdApi(id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data?.student) return;
    const userObj = data.student.userId || {};
    const isActive = userObj.isActive !== false;
    const action = isActive ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} this student account?`)) return;

    try {
      const res = await toggleStudentStatusApi(id, !isActive);
      if (res.success) {
        fetchDetails();
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} student account`);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: '4rem' }}>
          Loading student details...
        </p>
      </div>
    );
  }

  if (error || !data?.student) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>{error || 'Student not found'}</div>
        <Link to="/admin/students" style={styles.backLink}>← Back to Students List</Link>
      </div>
    );
  }

  const { student, applications = [], interviews = [] } = data;
  const userObj = student.userId || {};
  const isActive = userObj.isActive !== false;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/students" style={styles.backLink}>← Back to Students List</Link>
          <h1 style={styles.title}>{userObj.name || student.name || 'Student Profile'}</h1>
          <span style={styles.emailText}>{userObj.email}</span>
        </div>

        <button
          onClick={handleToggleStatus}
          style={{
            ...styles.toggleBtn,
            backgroundColor: isActive ? '#7f1d1d' : '#064e3b',
            color: isActive ? '#fca5a5' : '#6ee7b7',
          }}
        >
          {isActive ? 'Deactivate Student Account' : 'Activate Student Account'}
        </button>
      </header>

      {/* Grid Layout */}
      <div style={styles.grid}>
        {/* Profile Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Academic Profile Overview</h3>

          <div style={styles.infoGrid}>
            <div>
              <span style={styles.label}>Course & Branch</span>
              <p style={styles.val}>{student.course || 'N/A'} - {student.branch || 'N/A'}</p>
            </div>

            <div>
              <span style={styles.label}>Roll Number / ID</span>
              <p style={styles.val}>{student.rollNumber || 'N/A'}</p>
            </div>

            <div>
              <span style={styles.label}>CGPA</span>
              <p style={styles.val}>{student.cgpa !== undefined ? student.cgpa : 'N/A'}</p>
            </div>

            <div>
              <span style={styles.label}>Active Backlogs</span>
              <p style={styles.val}>{student.backlogs !== undefined ? student.backlogs : 0}</p>
            </div>

            <div>
              <span style={styles.label}>Graduation Year</span>
              <p style={styles.val}>{student.graduationYear || 'N/A'}</p>
            </div>

            <div>
              <span style={styles.label}>Phone Number</span>
              <p style={styles.val}>{student.phone || 'N/A'}</p>
            </div>
          </div>

          {Array.isArray(student.skills) && student.skills.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <span style={styles.label}>Skills Profile</span>
              <div style={styles.tagsGroup}>
                {student.skills.map((skill, idx) => (
                  <span key={idx} style={styles.skillTag}>{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Applications & Interviews Activity */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Job Applications History ({applications.length})</h3>

          {applications.length === 0 ? (
            <p style={styles.mutedText}>No job applications submitted yet.</p>
          ) : (
            <div style={styles.list}>
              {applications.map((app) => (
                <div key={app._id || app.id} style={styles.itemRow}>
                  <div>
                    <strong>{app.jobId?.title || 'Job Opening'}</strong>
                    <p style={styles.mutedText}>Applied on: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span style={styles.statusTag}>{app.status}</span>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ ...styles.cardTitle, marginTop: '2rem' }}>Interviews Schedule ({interviews.length})</h3>

          {interviews.length === 0 ? (
            <p style={styles.mutedText}>No interviews scheduled yet.</p>
          ) : (
            <div style={styles.list}>
              {interviews.map((int) => (
                <div key={int._id || int.id} style={styles.itemRow}>
                  <div>
                    <strong>{int.roundName}</strong>
                    <p style={styles.mutedText}>
                      Scheduled: {new Date(int.scheduledAt).toLocaleDateString()} ({int.interviewType})
                    </p>
                  </div>
                  <span style={styles.statusTag}>{int.status}</span>
                </div>
              ))}
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
    padding: '2rem',
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
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
  emailText: {
    color: '#94a3b8',
    fontSize: '0.95rem',
  },
  toggleBtn: {
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #334155',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: '1.15rem',
    margin: '0 0 1.25rem 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.775rem',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '0.2rem',
  },
  val: {
    color: '#f8fafc',
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  tagsGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginTop: '0.4rem',
  },
  skillTag: {
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    border: '1px solid #334155',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.75rem',
  },
  mutedText: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  itemRow: {
    backgroundColor: '#0f172a',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTag: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
  },
};
