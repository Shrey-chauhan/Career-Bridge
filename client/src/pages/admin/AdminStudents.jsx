import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStudentsApi, toggleStudentStatusApi } from '../../services/adminService';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1);
    }, 350); // Debounce search

    return () => clearTimeout(timer);
  }, [search, course, graduationYear]);

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (course) params.course = course;
      if (graduationYear) params.graduationYear = graduationYear;

      const res = await getAdminStudentsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setStudents(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students roster');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (studentId, currentIsActive) => {
    const action = currentIsActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this student account?`)) return;

    try {
      const res = await toggleStudentStatusApi(studentId, !currentIsActive);
      if (res.success) {
        fetchStudents(pagination.page);
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} student account`);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Back to Admin Dashboard</Link>
          <h1 style={styles.title}>Student Roster Directory</h1>
        </div>
      </header>

      {/* Filter Controls */}
      <div style={styles.filterRow}>
        <input
          type="text"
          placeholder="Search by student name, email, roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        <select value={course} onChange={(e) => setCourse(e.target.value)} style={styles.select}>
          <option value="">All Courses</option>
          <option value="B.Tech">B.Tech</option>
          <option value="M.Tech">M.Tech</option>
          <option value="BCA">BCA</option>
          <option value="MCA">MCA</option>
        </select>

        <select
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          style={styles.select}
        >
          <option value="">All Grad Years</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading student profiles...</p>
        </div>
      ) : students.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No student profiles found</h3>
          <p style={styles.mutedText}>Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Course & Branch</th>
                <th style={styles.th}>Grad Year</th>
                <th style={styles.th}>CGPA</th>
                <th style={styles.th}>Backlogs</th>
                <th style={styles.th}>Account Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((item) => {
                const stdId = item._id || item.id;
                const userObj = item.userId || {};
                const isActive = userObj.isActive !== false;

                return (
                  <tr key={stdId} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{userObj.name || item.name || 'Student'}</strong>
                      {item.rollNumber && <span style={styles.rollNum}> ({item.rollNumber})</span>}
                    </td>
                    <td style={styles.td}>{userObj.email || 'N/A'}</td>
                    <td style={styles.td}>
                      {item.course || 'N/A'} ({item.branch || 'N/A'})
                    </td>
                    <td style={styles.td}>{item.graduationYear || 'N/A'}</td>
                    <td style={styles.td}>{item.cgpa !== undefined ? item.cgpa : 'N/A'}</td>
                    <td style={styles.td}>{item.backlogs !== undefined ? item.backlogs : 0}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: isActive ? '#064e3b' : '#7f1d1d',
                          color: isActive ? '#6ee7b7' : '#fca5a5',
                        }}
                      >
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionGroup}>
                        <Link to={`/admin/students/${stdId}`} style={styles.viewLink}>
                          View Details
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(stdId, isActive)}
                          style={{
                            ...styles.toggleBtn,
                            backgroundColor: isActive ? '#7f1d1d' : '#064e3b',
                            color: isActive ? '#fca5a5' : '#6ee7b7',
                          }}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '260px',
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
  tableCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    padding: '0.85rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    borderBottom: '1px solid #334155',
  },
  tr: {
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '0.85rem 1rem',
    fontSize: '0.875rem',
    color: '#f8fafc',
  },
  rollNum: {
    color: '#94a3b8',
    fontSize: '0.8rem',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  actionGroup: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  viewLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.825rem',
    fontWeight: '600',
  },
  toggleBtn: {
    border: 'none',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
