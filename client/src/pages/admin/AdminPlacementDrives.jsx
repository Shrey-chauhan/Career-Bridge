import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPlacementDrivesApi,
  createPlacementDriveApi,
  getAdminCompaniesApi,
} from '../../services/adminService';

export default function AdminPlacementDrives() {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Drive Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    startDate: '',
    endDate: '',
    location: 'College Campus',
    eligibleCourses: 'B.Tech, M.Tech, MCA',
    eligibleGraduationYears: '2026',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDrives();
    fetchCompanies();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPlacementDrivesApi();
      if (res.success && Array.isArray(res.data)) {
        setDrives(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load placement drives');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await getAdminCompaniesApi({ limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        setCompanies(res.data);
      }
    } catch (err) {
      console.error('Failed to load companies for drive modal:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.companyId || !formData.startDate || !formData.endDate) {
      setError('Please provide drive name, company, start date, and end date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        eligibleCourses: formData.eligibleCourses.split(',').map((s) => s.trim()).filter(Boolean),
        eligibleGraduationYears: formData.eligibleGraduationYears.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
      };

      const res = await createPlacementDriveApi(payload);
      if (res.success) {
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          companyId: '',
          startDate: '',
          endDate: '',
          location: 'College Campus',
          eligibleCourses: 'B.Tech, M.Tech, MCA',
          eligibleGraduationYears: '2026',
        });
        fetchDrives();
      }
    } catch (err) {
      setError(err.message || 'Failed to create placement drive');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Back to Admin Dashboard</Link>
          <h1 style={styles.title}>Campus Placement Drives Management</h1>
        </div>

        <button onClick={() => setShowModal(true)} style={styles.createBtn}>
          + Create Placement Drive
        </button>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading placement drives...</p>
        </div>
      ) : drives.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No Campus Placement Drives Created Yet</h3>
          <p style={styles.mutedText}>Click '+ Create Placement Drive' to organize a hiring drive event.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {drives.map((drive) => {
            const driveId = drive._id || drive.id;
            const company = drive.companyId || {};

            return (
              <div key={driveId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.companyName}>{company.companyName || 'Corporate Partner'}</span>
                    <h3 style={styles.driveTitle}>{drive.name}</h3>
                    <p style={styles.locationText}>Location: {drive.location}</p>
                  </div>

                  <span style={styles.statusBadge}>{drive.status}</span>
                </div>

                <div style={styles.detailsGrid}>
                  <div>
                    <span style={styles.metaLabel}>Schedule Window</span>
                    <p style={styles.metaVal}>
                      {new Date(drive.startDate).toLocaleDateString()} – {new Date(drive.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Eligible Courses</span>
                    <p style={styles.metaVal}>
                      {Array.isArray(drive.eligibleCourses) ? drive.eligibleCourses.join(', ') : 'All'}
                    </p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Associated Jobs</span>
                    <p style={styles.metaVal}>{(drive.jobIds || []).length} Jobs Associated</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Drive Modal */}
      {showModal && (
        <div style={styles.backdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create Campus Placement Drive</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>×</button>
            </div>

            <form onSubmit={handleCreateDrive} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Drive Title *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. TCS Campus Drive 2026"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Corporate Company Partner *</label>
                <select
                  name="companyId"
                  required
                  value={formData.companyId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">-- Select Corporate Partner --</option>
                  {companies.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.companyName} ({c.verificationStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Venue / Location *</label>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g. Auditorium Hall A, Main Campus"
                  value={formData.location}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Eligible Courses (Comma Separated)</label>
                <input
                  type="text"
                  name="eligibleCourses"
                  placeholder="B.Tech, M.Tech, MCA"
                  value={formData.eligibleCourses}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={styles.submitBtn}>
                  {submitting ? 'Creating Drive...' : 'Create Placement Drive'}
                </button>
              </div>
            </form>
          </div>
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
  createBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.9rem',
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  companyName: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  driveTitle: {
    color: '#f8fafc',
    margin: '0.2rem 0',
    fontSize: '1.25rem',
  },
  locationText: {
    color: '#cbd5e1',
    fontSize: '0.875rem',
    margin: 0,
  },
  statusBadge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    backgroundColor: '#0f172a',
    padding: '1rem',
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
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    width: '100%',
    maxWidth: '520px',
    padding: '1.5rem',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  modalTitle: {
    color: '#38bdf8',
    margin: 0,
    fontSize: '1.2rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  input: {
    padding: '0.65rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #334155',
  },
  cancelBtn: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
