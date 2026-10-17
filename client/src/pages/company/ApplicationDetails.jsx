import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getCompanyApplicationByIdApi,
  shortlistApplicationApi,
  rejectApplicationApi,
  updateCompanyNotesApi,
} from '../../services/applicationService';
import ActivityTimeline from '../../components/application/ActivityTimeline';
import InterviewHistoryList from '../../components/interviews/InterviewHistoryList';

export default function CompanyApplicationDetails() {
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Private company notes state
  const [companyNotes, setCompanyNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCompanyApplicationByIdApi(id);
      if (res.success) {
        setApplication(res.data);
        setCompanyNotes(res.data.companyNotes || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load candidate application');
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async () => {
    if (!window.confirm('Are you sure you want to shortlist this applicant?')) return;
    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await shortlistApplicationApi(id);
      if (res.success) {
        setActionMessage('Application shortlisted successfully!');
        setApplication(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to shortlist applicant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await rejectApplicationApi(id, {
        reason: rejectionReason,
        companyNotes: companyNotes,
      });
      if (res.success) {
        setActionMessage('Application rejected.');
        setShowRejectModal(false);
        setApplication(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to reject applicant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await updateCompanyNotesApi(id, { companyNotes });
      if (res.success) {
        alert('Company private notes saved.');
      }
    } catch (err) {
      alert(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p>Loading candidate profile & application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div style={styles.container}>
        <Link to="/company/applications" style={styles.backLink}>
          ← Back to Candidate Applications
        </Link>
        <div style={styles.errorBox}>{error || 'Application not found'}</div>
      </div>
    );
  }

  const candidate = application.candidate || application.studentId || {};
  const job = application.jobId || {};
  const resume = application.resumeSnapshot || {};

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'SHORTLISTED':
        return { backgroundColor: '#064e3b', color: '#6ee7b7', borderColor: '#10b981' };
      case 'REJECTED':
        return { backgroundColor: '#7f1d1d', color: '#fca5a5', borderColor: '#f87171' };
      case 'WITHDRAWN':
        return { backgroundColor: '#334155', color: '#94a3b8', borderColor: '#475569' };
      case 'APPLIED':
      default:
        return { backgroundColor: '#0c4a6e', color: '#7dd3fc', borderColor: '#38bdf8' };
    }
  };

  const badgeStyle = getStatusBadgeStyle(application.status);

  return (
    <div style={styles.container}>
      <Link to="/company/applications" style={styles.backLink}>
        ← Back to Candidate Applications
      </Link>

      {actionMessage && <div style={styles.successBox}>{actionMessage}</div>}

      {/* Top Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>{candidate.name || 'Candidate Profile'}</h1>
          <p style={styles.subtitle}>
            Applying for <strong>{job.title || 'Job Position'}</strong>
          </p>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.statusBadge, ...badgeStyle }}>{application.status}</span>
          {application.status === 'APPLIED' && (
            <div style={styles.actionHeaderBtns}>
              <button onClick={handleShortlist} disabled={actionLoading} style={styles.shortlistBtn}>
                Shortlist Candidate
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                style={styles.rejectBtn}
              >
                Reject Candidate
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        {/* Main Candidate Details */}
        <div style={styles.mainContent}>
          {/* Academic Profile Overview */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Academic Profile Overview</h2>
            <div style={styles.metaGrid}>
              <div>
                <strong>College / Institution:</strong>
                <p>{candidate.college || 'N/A'}</p>
              </div>
              <div>
                <strong>Degree & Branch:</strong>
                <p>
                  {candidate.degree} in {candidate.branch}
                </p>
              </div>
              <div>
                <strong>Graduation Year:</strong>
                <p>{candidate.graduationYear || 'N/A'}</p>
              </div>
              <div>
                <strong>CGPA Score:</strong>
                <p>
                  <strong>{candidate.cgpa !== undefined ? candidate.cgpa : 'N/A'}</strong> / 10.0
                </p>
              </div>
              <div>
                <strong>Active Backlogs:</strong>
                <p>{candidate.backlogs ?? 0}</p>
              </div>
              <div>
                <strong>Placement Status:</strong>
                <p>{candidate.placementStatus || 'NOT_PLACED'}</p>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Technical Skills</h2>
            <div style={styles.skillContainer}>
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((s, idx) => (
                  <span key={idx} style={styles.skillTag}>
                    {s}
                  </span>
                ))
              ) : (
                <p style={styles.mutedText}>No technical skills listed.</p>
              )}
            </div>
          </div>

          {/* Submitted Cover Letter */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Cover Letter</h2>
            {application.coverLetter ? (
              <p style={styles.coverText}>{application.coverLetter}</p>
            ) : (
              <p style={styles.mutedText}>No cover letter was submitted with this application.</p>
            )}
          </div>

          {/* Projects */}
          {candidate.projects && candidate.projects.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Projects</h2>
              <div style={styles.listSection}>
                {candidate.projects.map((proj, idx) => (
                  <div key={idx} style={styles.listItemCard}>
                    <h4 style={styles.itemTitle}>{proj.title}</h4>
                    <p style={styles.itemDesc}>{proj.description}</p>
                    {proj.technologies && (
                      <p style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
                        Stack: {proj.technologies.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {candidate.experience && candidate.experience.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Work Experience</h2>
              <div style={styles.listSection}>
                {candidate.experience.map((exp, idx) => (
                  <div key={idx} style={styles.listItemCard}>
                    <h4 style={styles.itemTitle}>
                      {exp.position} at {exp.company}
                    </h4>
                    <p style={styles.itemDesc}>{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview History & Scheduling */}
          <div style={styles.card}>
            <InterviewHistoryList
              applicationId={id}
              applicationData={application}
              onRefresh={fetchApplicationDetails}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Resume Snapshot */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={styles.sideTitle}>Candidate Resume Snapshot</h3>
              {resume.version && (
                <span style={styles.versionTag}>Version {resume.version}</span>
              )}
            </div>
            {resume.url || resume.fileName ? (
              <div style={styles.resumeBox}>
                <span style={{ fontSize: '1.5rem' }}>📄</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#f8fafc' }}>
                    {resume.fileName || 'Resume Document'}
                  </p>
                  {resume.url && (
                    <a
                      href={resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.resumeLink}
                    >
                      Open Secure Resume Link ↗
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p style={styles.mutedText}>No resume snapshot recorded.</p>
            )}
          </div>

          {/* Contact Details */}
          <div style={styles.card}>
            <h3 style={styles.sideTitle}>Contact Information</h3>
            <div style={styles.contactList}>
              <p>
                <strong>Email:</strong> {candidate.email || 'N/A'}
              </p>
              <p>
                <strong>Phone:</strong> {candidate.phone || 'N/A'}
              </p>
              {candidate.linkedin && (
                <p>
                  <strong>LinkedIn:</strong>{' '}
                  <a
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8' }}
                  >
                    Profile ↗
                  </a>
                </p>
              )}
              {candidate.github && (
                <p>
                  <strong>GitHub:</strong>{' '}
                  <a
                    href={candidate.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8' }}
                  >
                    Profile ↗
                  </a>
                </p>
              )}
            </div>

            <ActivityTimeline applicationId={id} />
          </div>

          {/* Private Company Notes (Internal ONLY) */}
          <div style={{ ...styles.card, borderColor: '#38bdf866' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={styles.sideTitle}>Private Recruiter Notes</h3>
              <span style={styles.privateBadge}>Internal ONLY</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Notes added here are strictly private to your company and never visible to candidates.
            </p>
            <textarea
              rows={4}
              value={companyNotes}
              onChange={(e) => setCompanyNotes(e.target.value)}
              placeholder="e.g. Strong technical skills. Consider for technical round 1..."
              style={styles.notesTextarea}
            />
            <button onClick={handleSaveNotes} disabled={savingNotes} style={styles.saveNotesBtn}>
              {savingNotes ? 'Saving Notes...' : 'Save Private Notes'}
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Reject Candidate</h2>
            <p style={styles.modalSubtitle}>Provide feedback reason (optional).</p>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={styles.label}>Rejection Reason (Candidate Feedback)</label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Required technical experience does not match current role requirements."
                  style={styles.notesTextarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={styles.cancelBtn}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.confirmRejectBtn} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
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
  backLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    marginBottom: '1rem',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
    margin: 0,
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#cbd5e1',
    marginTop: '0.25rem',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.75rem',
  },
  statusBadge: {
    padding: '0.5rem 1.25rem',
    borderRadius: '20px',
    border: '1px solid',
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  actionHeaderBtns: {
    display: 'flex',
    gap: '0.75rem',
  },
  shortlistBtn: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: '1px solid #10b981',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  rejectBtn: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #f87171',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  successBox: {
    backgroundColor: '#064e3b',
    color: '#a7f3d0',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr',
    gap: '1.5rem',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '1.75rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#38bdf8',
    marginBottom: '1rem',
  },
  sideTitle: {
    fontSize: '1.1rem',
    color: '#38bdf8',
    margin: 0,
    marginBottom: '0.5rem',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  skillContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  skillTag: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  coverText: {
    color: '#cbd5e1',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  listItemCard: {
    backgroundColor: '#0f172a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  itemTitle: {
    margin: 0,
    color: '#f8fafc',
    fontSize: '1.05rem',
  },
  itemDesc: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    marginTop: '0.4rem',
  },
  resumeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#0f172a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  resumeLink: {
    color: '#38bdf8',
    fontSize: '0.85rem',
    textDecoration: 'none',
    marginTop: '0.25rem',
    display: 'inline-block',
  },
  contactList: {
    lineHeight: '1.9',
    color: '#cbd5e1',
    fontSize: '0.9rem',
  },
  privateBadge: {
    backgroundColor: '#7c2d12',
    color: '#fdba74',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  notesTextarea: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
  },
  saveNotesBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '550px',
    border: '1px solid #7f1d1d',
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#f87171',
    marginBottom: '0.25rem',
  },
  modalSubtitle: {
    color: '#94a3b8',
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
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
  confirmRejectBtn: {
    backgroundColor: '#991b1b',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  versionTag: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  mutedText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
};
