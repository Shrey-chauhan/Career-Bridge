import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentProfileApi,
  createStudentProfileApi,
  updateStudentProfileApi,
} from '../services/studentService';
import { getMyResumeApi, deleteResumeApi } from '../services/resumeService';
import ResumeUploader from '../components/resume/ResumeUploader';
import ResumeCard from '../components/resume/ResumeCard';
import { Link } from 'react-router-dom';

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeResume, setActiveResume] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    phone: '',
    college: '',
    degree: 'B.Tech',
    branch: 'CSE',
    graduationYear: 2026,
    cgpa: 8.0,
    backlogs: 0,
    skills: [],
    location: '',
    bio: '',
    linkedin: '',
    github: '',
    portfolio: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [projectInput, setProjectInput] = useState({ title: '', description: '', tech: '', url: '' });
  const [projectsList, setProjectsList] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const res = await getMyResumeApi();
      if (res.success && res.data) {
        setActiveResume(res.data);
      } else {
        setActiveResume(null);
      }
    } catch (err) {
      console.error('Failed to fetch active resume:', err);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete your active resume? Historical applications will maintain their submitted resume version snapshot.'
      )
    ) {
      return;
    }

    try {
      const res = await deleteResumeApi(resumeId);
      if (res.success) {
        setActiveResume(null);
        setShowUploader(true);
        fetchProfile();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete resume');
    }
  };

  const handleResumeSuccess = (newResume) => {
    setActiveResume(newResume);
    setShowUploader(false);
    fetchProfile();
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getStudentProfileApi();
      if (res.success && res.data) {
        setProfile(res.data);
        populateForm(res.data);
      }
    } catch (err) {
      if (
        err.status === 404 ||
        err.statusCode === 404 ||
        err.message === 'Student profile not found' ||
        (err.message && err.message.toLowerCase().includes('not found'))
      ) {
        setProfile(null);
        setEditing(true); // Open creation mode if no profile exists
      } else {
        setError(err.message || 'Failed to load student profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data) => {
    setFormData({
      phone: data.phone || '',
      college: data.college || '',
      degree: data.degree || 'B.Tech',
      branch: data.branch || 'CSE',
      graduationYear: data.graduationYear || 2026,
      cgpa: data.cgpa !== undefined ? data.cgpa : 8.0,
      backlogs: data.backlogs !== undefined ? data.backlogs : 0,
      skills: data.skills || [],
      location: data.location || '',
      bio: data.bio || '',
      linkedin: data.linkedin || '',
      github: data.github || '',
      portfolio: data.portfolio || '',
    });
    setProjectsList(data.projects || []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'graduationYear' || name === 'backlogs' || name === 'cgpa' ? Number(value) : value,
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const addProject = () => {
    if (projectInput.title.trim()) {
      const newProj = {
        title: projectInput.title.trim(),
        description: projectInput.description.trim(),
        technologies: projectInput.tech ? projectInput.tech.split(',').map((t) => t.trim()) : [],
        projectUrl: projectInput.url.trim(),
      };
      setProjectsList((prev) => [...prev, newProj]);
      setProjectInput({ title: '', description: '', tech: '', url: '' });
    }
  };

  const removeProject = (index) => {
    setProjectsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    const payload = {
      ...formData,
      projects: projectsList,
    };

    try {
      let res;
      if (profile) {
        res = await updateStudentProfileApi(payload);
        setSuccessMsg('Profile updated successfully!');
      } else {
        res = await createStudentProfileApi(payload);
        setSuccessMsg('Profile created successfully!');
      }

      if (res.success && res.data) {
        setProfile(res.data);
        populateForm(res.data);
        setEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p style={styles.infoText}>Loading Student Profile...</p>
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
          <h1 style={styles.title}>Student Profile</h1>
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

      {/* Completion Bar */}
      {profile && (
        <div style={styles.completionCard}>
          <div style={styles.completionHeader}>
            <span>Profile Completion</span>
            <strong style={styles.completionScore}>{profile.profileCompletion}%</strong>
          </div>
          <div style={styles.progressBarTrack}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${profile.profileCompletion}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Main Form or View Card */}
      {editing ? (
        <form onSubmit={handleSubmit} style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {profile ? 'Edit Profile Details' : 'Create Student Profile'}
          </h2>

          {/* Academic Info */}
          <div style={styles.formSection}>
            <h3 style={styles.subTitle}>Academic Details</h3>
            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>College Name *</label>
                <input
                  type="text"
                  name="college"
                  required
                  value={formData.college}
                  onChange={handleInputChange}
                  placeholder="e.g. ABC Institute of Technology"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Degree *</label>
                <input
                  type="text"
                  name="degree"
                  required
                  value={formData.degree}
                  onChange={handleInputChange}
                  placeholder="e.g. B.Tech"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Branch / Department *</label>
                <input
                  type="text"
                  name="branch"
                  required
                  value={formData.branch}
                  onChange={handleInputChange}
                  placeholder="e.g. CSE"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Graduation Year *</label>
                <input
                  type="number"
                  name="graduationYear"
                  required
                  min={2000}
                  max={2100}
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>CGPA (0 - 10.0) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="cgpa"
                  required
                  min={0}
                  max={10}
                  value={formData.cgpa}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Active Backlogs</label>
                <input
                  type="number"
                  name="backlogs"
                  min={0}
                  value={formData.backlogs}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Contact & Bio */}
          <div style={styles.formSection}>
            <h3 style={styles.subTitle}>Personal Information</h3>
            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Location / City</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Bangalore, India"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldMargin}>
              <label style={styles.label}>Bio / Short Summary</label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Brief introduction about your interests and career goals..."
                style={styles.textarea}
              />
            </div>
          </div>

          {/* Skills Management */}
          <div style={styles.formSection}>
            <h3 style={styles.subTitle}>Technical Skills</h3>
            <div style={styles.inlineAddGroup}>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter skill (e.g. React, Python)"
                style={styles.inputFlex}
              />
              <button type="button" onClick={addSkill} style={styles.addBtn}>
                Add Skill
              </button>
            </div>
            <div style={styles.skillTagsList}>
              {formData.skills.map((skill, idx) => (
                <span key={idx} style={styles.skillTag}>
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    style={styles.removeTagBtn}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div style={styles.formSection}>
            <h3 style={styles.subTitle}>Projects</h3>
            <div style={styles.projectFormGrid}>
              <input
                type="text"
                placeholder="Project Title"
                value={projectInput.title}
                onChange={(e) => setProjectInput({ ...projectInput, title: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Technologies (comma separated)"
                value={projectInput.tech}
                onChange={(e) => setProjectInput({ ...projectInput, tech: e.target.value })}
                style={styles.input}
              />
              <input
                type="url"
                placeholder="Project / Demo URL"
                value={projectInput.url}
                onChange={(e) => setProjectInput({ ...projectInput, url: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Project Description"
                value={projectInput.description}
                onChange={(e) => setProjectInput({ ...projectInput, description: e.target.value })}
                style={styles.input}
              />
            </div>
            <button type="button" onClick={addProject} style={styles.addBtnMargin}>
              Add Project Entry
            </button>

            {projectsList.length > 0 && (
              <div style={styles.projectsContainer}>
                {projectsList.map((p, idx) => (
                  <div key={idx} style={styles.projectCard}>
                    <div style={styles.flexBetween}>
                      <strong>{p.title}</strong>
                      <button type="button" onClick={() => removeProject(idx)} style={styles.deleteLinkBtn}>
                        Remove
                      </button>
                    </div>
                    <p style={styles.mutedText}>{p.description}</p>
                    {p.technologies && p.technologies.length > 0 && (
                      <div style={styles.techBadgeContainer}>
                        {p.technologies.map((t, i) => (
                          <span key={i} style={styles.smallBadge}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Links */}
          <div style={styles.formSection}>
            <h3 style={styles.subTitle}>Social Links</h3>
            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>LinkedIn URL</label>
                <input
                  type="text"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/username"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>GitHub URL</label>
                <input
                  type="text"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </form>
      ) : (
        /* Read Only View Mode */
        <div style={styles.card}>
          <div style={styles.profileHeaderRow}>
            <div>
              <h2 style={styles.nameTitle}>{user?.name}</h2>
              <p style={styles.subMuted}>{profile.college}</p>
            </div>
            <span style={styles.statusBadge}>{profile.placementStatus}</span>
          </div>

          <div style={styles.viewGrid}>
            <div style={styles.infoBox}>
              <h3 style={styles.boxTitle}>Academic Overview</h3>
              <p><strong>Degree:</strong> {profile.degree} ({profile.branch})</p>
              <p><strong>Graduation Year:</strong> {profile.graduationYear}</p>
              <p><strong>CGPA:</strong> {profile.cgpa} / 10.0</p>
              <p><strong>Active Backlogs:</strong> {profile.backlogs}</p>
            </div>

            <div style={styles.infoBox}>
              <h3 style={styles.boxTitle}>Contact & Location</h3>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
              <p><strong>Location:</strong> {profile.location || 'Not provided'}</p>
            </div>
          </div>

          {profile.bio && (
            <div style={styles.sectionMargin}>
              <h3 style={styles.boxTitle}>Bio</h3>
              <p style={styles.bodyText}>{profile.bio}</p>
            </div>
          )}

          {/* Skills View */}
          <div style={styles.sectionMargin}>
            <h3 style={styles.boxTitle}>Skills</h3>
            {profile.skills && profile.skills.length > 0 ? (
              <div style={styles.skillTagsList}>
                {profile.skills.map((s, idx) => (
                  <span key={idx} style={styles.viewSkillTag}>{s}</span>
                ))}
              </div>
            ) : (
              <p style={styles.mutedText}>No skills listed yet.</p>
            )}
          </div>

          {/* Projects View */}
          <div style={styles.sectionMargin}>
            <h3 style={styles.boxTitle}>Projects</h3>
            {profile.projects && profile.projects.length > 0 ? (
              <div style={styles.projectsContainer}>
                {profile.projects.map((p, idx) => (
                  <div key={idx} style={styles.projectCard}>
                    <h4>{p.title}</h4>
                    <p style={styles.bodyText}>{p.description}</p>
                    {p.projectUrl && (
                      <a href={p.projectUrl} target="_blank" rel="noreferrer" style={styles.link}>
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.mutedText}>No projects listed yet.</p>
            )}
          </div>

          {/* Resume Management Section */}
          <div style={styles.sectionMargin}>
            <h3 style={styles.boxTitle}>Resume Document</h3>
            {activeResume && !showUploader ? (
              <ResumeCard
                resume={activeResume}
                onReplace={() => setShowUploader(true)}
                onDelete={handleDeleteResume}
              />
            ) : (
              <div style={styles.uploaderBox}>
                {activeResume && showUploader && (
                  <button
                    type="button"
                    onClick={() => setShowUploader(false)}
                    style={styles.cancelUploaderBtn}
                  >
                    ← Cancel & Keep Active Resume (Version {activeResume.version})
                  </button>
                )}
                <ResumeUploader
                  onUploadSuccess={handleResumeSuccess}
                  currentVersion={activeResume?.version || 0}
                />
              </div>
            )}
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
  completionCard: {
    backgroundColor: '#1e293b',
    padding: '1.25rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid #334155',
  },
  completionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '1rem',
  },
  completionScore: {
    color: '#38bdf8',
  },
  progressBarTrack: {
    width: '100%',
    height: '10px',
    backgroundColor: '#0f172a',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284c7',
    transition: 'width 0.3s ease',
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
  subTitle: {
    fontSize: '1.15rem',
    color: '#38bdf8',
    marginBottom: '1rem',
  },
  formSection: {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #334155',
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
    marginTop: '1rem',
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
  inlineAddGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  inputFlex: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
  },
  addBtn: {
    backgroundColor: '#0369a1',
    color: '#ffffff',
    border: 'none',
    padding: '0 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  addBtnMargin: {
    backgroundColor: '#0369a1',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    marginTop: '0.75rem',
  },
  uploaderBox: {
    backgroundColor: '#0f172a',
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  cancelUploaderBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    border: '1px solid #475569',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  skillTagsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  skillTag: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  viewSkillTag: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  removeTagBtn: {
    background: 'none',
    border: 'none',
    color: '#f87171',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  projectFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem',
  },
  projectsContainer: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  projectCard: {
    backgroundColor: '#0f172a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#f87171',
    cursor: 'pointer',
    fontSize: '0.85rem',
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
    marginTop: '1rem',
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
  statusBadge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
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
  mutedText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  techBadgeContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  smallBadge: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
  link: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    display: 'inline-block',
  },
  resumePlaceholderBox: {
    backgroundColor: '#0f172a',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px dashed #334155',
    marginTop: '2rem',
    textAlign: 'center',
  },
  infoText: {
    color: '#94a3b8',
  },
};
