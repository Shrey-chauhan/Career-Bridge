import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCompanyProfileApi,
  createCompanyProfileApi,
  updateCompanyProfileApi,
} from '../services/companyService';
import { Link } from 'react-router-dom';

export default function CompanyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'Software',
    website: '',
    location: '',
    companySize: '51-200',
    foundedYear: 2015,
    description: '',
    contactEmail: '',
    contactPhone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCompanyProfileApi();
      if (res.success && res.data) {
        setProfile(res.data);
        populateForm(res.data);
      }
    } catch (err) {
      if (
        err.status === 404 ||
        err.statusCode === 404 ||
        err.message === 'Company profile not found' ||
        (err.message && err.message.toLowerCase().includes('not found'))
      ) {
        setProfile(null);
        setEditing(true); // Open creation mode if no profile exists
      } else {
        setError(err.message || 'Failed to load company profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data) => {
    setFormData({
      companyName: data.companyName || '',
      industry: data.industry || 'Software',
      website: data.website || '',
      location: data.location || '',
      companySize: data.companySize || '51-200',
      foundedYear: data.foundedYear || 2015,
      description: data.description || '',
      contactEmail: data.contactEmail || user?.email || '',
      contactPhone: data.contactPhone || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'foundedYear' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      let res;
      if (profile) {
        res = await updateCompanyProfileApi(formData);
        setSuccessMsg('Company profile updated successfully!');
      } else {
        res = await createCompanyProfileApi(formData);
        setSuccessMsg('Company profile created successfully!');
      }

      if (res.success && res.data) {
        setProfile(res.data);
        populateForm(res.data);
        setEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to save company profile details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p style={styles.infoText}>Loading Company Profile...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/dashboard" style={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 style={styles.title}>Company Profile</h1>
        </div>
        {profile && (
          <button
            onClick={() => setEditing(!editing)}
            style={editing ? styles.cancelBtn : styles.editBtn}
          >
            {editing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        )}
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}
      {successMsg && <div style={styles.successBox}>{successMsg}</div>}

      {/* Main Form or View Card */}
      {editing ? (
        <form onSubmit={handleSubmit} style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {profile ? 'Edit Company Profile' : 'Create Company Profile'}
          </h2>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Company Name *</label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="e.g. Acme Technologies"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Industry *</label>
              <input
                type="text"
                name="industry"
                required
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="e.g. Software / FinTech"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Company Size</label>
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Founded Year</label>
              <input
                type="number"
                name="foundedYear"
                min={1800}
                max={new Date().getFullYear()}
                value={formData.foundedYear}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Website URL</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Location / Headquarters</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Bangalore, India"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="hr@example.com"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contact Phone</label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldMargin}>
            <label style={styles.label}>Company Overview / Description</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell applicants about your organization's mission, technology stack, and culture..."
              style={styles.textarea}
            />
          </div>

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'Saving Profile...' : 'Save Company Profile'}
          </button>
        </form>
      ) : (
        /* Read Only View Mode */
        <div style={styles.card}>
          <div style={styles.profileHeaderRow}>
            <div>
              <h2 style={styles.nameTitle}>{profile.companyName}</h2>
              <p style={styles.subMuted}>{profile.industry} Industry</p>
            </div>
            <div style={styles.statusBadgeBox}>
              <span style={styles.statusLabel}>Verification Status:</span>
              <span style={styles.statusBadge}>{profile.verificationStatus}</span>
            </div>
          </div>

          <div style={styles.viewGrid}>
            <div style={styles.infoBox}>
              <h3 style={styles.boxTitle}>Company Details</h3>
              <p><strong>Company Size:</strong> {profile.companySize || 'Not specified'}</p>
              <p><strong>Founded Year:</strong> {profile.foundedYear || 'Not specified'}</p>
              <p><strong>Location:</strong> {profile.location || 'Not specified'}</p>
              <p>
                <strong>Website:</strong>{' '}
                {profile.website ? (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    {profile.website} ↗
                  </a>
                ) : (
                  'Not provided'
                )}
              </p>
            </div>

            <div style={styles.infoBox}>
              <h3 style={styles.boxTitle}>Recruitment Contact</h3>
              <p><strong>Account User:</strong> {user?.name}</p>
              <p><strong>Contact Email:</strong> {profile.contactEmail || user?.email}</p>
              <p><strong>Contact Phone:</strong> {profile.contactPhone || 'Not provided'}</p>
            </div>
          </div>

          {profile.description && (
            <div style={styles.sectionMargin}>
              <h3 style={styles.boxTitle}>About {profile.companyName}</h3>
              <p style={styles.bodyText}>{profile.description}</p>
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
    fontFamily: "'Segoe UI', sans-serif",
    padding: '2rem',
  },
  centerContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    color: '#94a3b8',
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
  },
  editBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelBtn: {
    backgroundColor: '#475569',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  successBox: {
    backgroundColor: '#064e3b',
    color: '#a7f3d0',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '2.5rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#f1f5f9',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  fieldMargin: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginTop: '1.25rem',
  },
  label: {
    fontSize: '0.875rem',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.95rem',
    outline: 'none',
  },
  select: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.95rem',
    outline: 'none',
  },
  textarea: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem 2rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem',
    width: '100%',
  },
  profileHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
    paddingBottom: '1.25rem',
    marginBottom: '1.5rem',
  },
  nameTitle: {
    fontSize: '1.75rem',
    color: '#f8fafc',
  },
  subMuted: {
    color: '#94a3b8',
    marginTop: '0.25rem',
  },
  statusBadgeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statusLabel: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  statusBadge: {
    backgroundColor: '#d97706',
    color: '#fef3c7',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  viewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  infoBox: {
    backgroundColor: '#0f172a',
    padding: '1.25rem',
    borderRadius: '8px',
    lineHeight: '1.8',
  },
  boxTitle: {
    fontSize: '1.1rem',
    color: '#38bdf8',
    marginBottom: '0.75rem',
  },
  sectionMargin: {
    marginTop: '1.5rem',
  },
  bodyText: {
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  link: {
    color: '#38bdf8',
    textDecoration: 'none',
  },
  infoText: {
    color: '#94a3b8',
  },
};
