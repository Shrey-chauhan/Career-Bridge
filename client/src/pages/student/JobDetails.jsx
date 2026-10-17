import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getJobDetailsApi } from '../../services/jobService';
import { applyForJobApi, getMyApplicationsApi } from '../../services/applicationService';
import { getMyResumeApi } from '../../services/resumeService';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [existingApp, setExistingApp] = useState(null);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getJobDetailsApi(id);
      if (res.success) {
        setJob(res.data);
        setEligibility(res.eligibility);
      }

      // Check active resume & existing applications
      try {
        const resumeRes = await getMyResumeApi();
        if (resumeRes.success && resumeRes.data) {
          setActiveResume(resumeRes.data);
        }
      } catch (rErr) {
        console.error('Failed to fetch active resume:', rErr);
      }

      try {
        const myAppsRes = await getMyApplicationsApi({ limit: 100 });
        if (myAppsRes.success && Array.isArray(myAppsRes.data)) {
          const appMatch = myAppsRes.data.find(
            (app) => (app.jobId?._id || app.jobId?.id || app.jobId) === id
          );
          if (appMatch) {
            setExistingApp(appMatch);
          }
        }
      } catch (appErr) {
        console.error('Failed to check existing application:', appErr);
      }
    } catch (err) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const res = await applyForJobApi({
        jobId: id,
        coverLetter: coverLetter.trim(),
      });

      if (res.success) {
        setApplySuccess('Application submitted successfully!');
        setExistingApp(res.data);
        setTimeout(() => {
          setShowApplyModal(false);
        }, 1500);
      }
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p style={styles.muted}>Evaluating Eligibility & Loading Job Details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={styles.container}>
        <Link to="/student/jobs" style={styles.backLink}>
          ← Back to Job Opportunities
        </Link>
        <div style={styles.errorBox}>{error || 'Job not found'}</div>
      </div>
    );
  }

  const company = job.companyId || {};
  const isEligible = eligibility?.eligible;
  const deadline = new Date(job.applicationDeadline).toLocaleDateString();
  const isDeadlinePassed = new Date() > new Date(job.applicationDeadline);
  const isClosed = job.status === 'CLOSED';

  // Determine button state
  const renderApplyAction = () => {
    if (existingApp) {
      return (
        <div style={styles.actionCard}>
          <div style={styles.appliedBanner}>
            <span style={{ fontSize: '1.2rem' }}>✓</span>
            <div>
              <p style={{ fontWeight: '700', margin: 0 }}>Application Submitted</p>
              <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.9 }}>
                Status: <strong>{existingApp.status}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/student/applications/${existingApp._id || existingApp.id}`)}
            style={styles.viewAppBtn}
          >
            View My Application
          </button>
        </div>
      );
    }

    if (isClosed) {
      return (
        <div style={styles.actionCard}>
          <button disabled style={{ ...styles.applyBtn, backgroundColor: '#475569', cursor: 'not-allowed' }}>
            Job Closed
          </button>
        </div>
      );
    }

    if (isDeadlinePassed) {
      return (
        <div style={styles.actionCard}>
          <button disabled style={{ ...styles.applyBtn, backgroundColor: '#475569', cursor: 'not-allowed' }}>
            Application Deadline Passed
          </button>
        </div>
      );
    }

    if (!isEligible) {
      return (
        <div style={styles.actionCard}>
          <button disabled style={{ ...styles.applyBtn, backgroundColor: '#991b1b', cursor: 'not-allowed' }}>
            Not Eligible to Apply
          </button>
          <p style={styles.ineligibleSubtext}>Check the eligibility breakdown to review requirements.</p>
        </div>
      );
    }

    if (!activeResume) {
      return (
        <div style={styles.actionCard}>
          <button
            onClick={() => navigate('/student/profile')}
            style={{ ...styles.applyBtn, backgroundColor: '#d97706' }}
          >
            📄 Upload Resume to Apply
          </button>
          <p style={{ ...styles.ineligibleSubtext, color: '#fcd34d' }}>
            An active resume document is required before applying for jobs.
          </p>
        </div>
      );
    }

    return (
      <div style={styles.actionCard}>
        <button onClick={() => setShowApplyModal(true)} style={styles.applyBtn}>
          Apply Now →
        </button>
        <p style={styles.eligibleSubtext}>You satisfy all eligibility criteria for this role.</p>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/student/jobs" style={styles.backLink}>
          ← Back to Job Opportunities
        </Link>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>{job.title}</h1>
            <p style={styles.companySubtitle}>{company.companyName || 'Recruiting Company'}</p>
          </div>

          {eligibility && (
            <div
              style={{
                ...styles.eligibilityBadgeBox,
                backgroundColor: isEligible ? '#064e3b' : '#7f1d1d',
                borderColor: isEligible ? '#10b981' : '#f87171',
              }}
            >
              <span style={styles.badgeIcon}>{isEligible ? '✔' : '✖'}</span>
              <span>{isEligible ? 'Eligible to Apply' : 'Not Eligible'}</span>
            </div>
          )}
        </div>
      </header>

      <div style={styles.grid}>
        {/* Main Job Information */}
        <div style={styles.mainContent}>
          {/* Eligibility Results Breakdown Card */}
          {eligibility && (
            <div
              style={{
                ...styles.eligibilityCard,
                backgroundColor: isEligible ? '#064e3b22' : '#7f1d1d22',
                borderColor: isEligible ? '#10b981' : '#f87171',
              }}
            >
              <h3 style={styles.eligibilityTitle}>
                {isEligible ? '✅ Eligibility Check Passed' : '❌ Eligibility Requirements Not Met'}
              </h3>
              {isEligible ? (
                <p style={styles.eligibleText}>
                  Great news! Your profile meets all academic, skill, and backlog requirements set by {company.companyName || 'the employer'}.
                </p>
              ) : (
                <div style={styles.reasonsBox}>
                  <p style={styles.reasonsHeader}>The following criteria were not satisfied:</p>
                  <ul style={styles.reasonsList}>
                    {eligibility.reasons.map((reason, idx) => (
                      <li key={idx} style={styles.reasonItem}>
                        <span style={styles.crossIcon}>❌</span> {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Job Overview */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Job Overview</h2>
            <div style={styles.metaGrid}>
              <div>
                <strong>Job Type:</strong> <p>{job.jobType.replace('_', ' ')}</p>
              </div>
              <div>
                <strong>Work Mode:</strong> <p>{job.workMode}</p>
              </div>
              <div>
                <strong>Location:</strong> <p>{job.location || 'Not Specified'}</p>
              </div>
              <div>
                <strong>Available Openings:</strong> <p>{job.openings} Positions</p>
              </div>
              <div>
                <strong>Application Deadline:</strong> <p>{deadline}</p>
              </div>
              {job.salary && (
                <div>
                  <strong>Compensation:</strong>{' '}
                  <p>
                    ₹{job.salary.min.toLocaleString()} - ₹{job.salary.max.toLocaleString()} / {job.salary.period.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Description */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Job Description & Responsibilities</h2>
            <p style={styles.descriptionText}>{job.description}</p>
          </div>

          {/* Skills Required */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Required Skills & Tech Stack</h2>
            <div style={styles.skillBadgeContainer}>
              {job.skills && job.skills.map((skill, idx) => (
                <span key={idx} style={styles.skillTag}>{skill}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Action Card: Apply or Status */}
          {renderApplyAction()}

          {/* Configured Eligibility Criteria */}
          <div style={styles.card}>
            <h3 style={styles.sideTitle}>Configured Eligibility Criteria</h3>
            <div style={styles.sideList}>
              <p><strong>Minimum CGPA:</strong> {job.eligibility?.minimumCgpa || 0.0} / 10.0</p>
              <p><strong>Max Allowed Backlogs:</strong> {job.eligibility?.maximumBacklogs ?? 0}</p>
              <p>
                <strong>Allowed Branches:</strong>{' '}
                {job.eligibility?.allowedBranches?.length
                  ? job.eligibility.allowedBranches.join(', ')
                  : 'All Branches'}
              </p>
              <p>
                <strong>Graduation Years:</strong>{' '}
                {job.eligibility?.graduationYears?.length
                  ? job.eligibility.graduationYears.join(', ')
                  : 'All Batches'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Apply for {job.title}</h2>
            <p style={styles.modalSubtitle}>{company.companyName || 'Company'}</p>

            {applyError && <div style={styles.modalError}>{applyError}</div>}
            {applySuccess && <div style={styles.modalSuccess}>{applySuccess}</div>}

            <form onSubmit={handleApplySubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={styles.label}>Cover Letter (Optional)</label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you are a great candidate for this role..."
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  style={styles.cancelBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitApplyBtn} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
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
  header: {
    marginBottom: '2rem',
  },
  backLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    marginBottom: '0.75rem',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
  },
  companySubtitle: {
    fontSize: '1.1rem',
    color: '#cbd5e1',
    marginTop: '0.25rem',
  },
  eligibilityBadgeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.25rem',
    borderRadius: '20px',
    border: '1px solid',
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  badgeIcon: {
    fontSize: '1.1rem',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1rem',
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
  actionCard: {
    backgroundColor: '#1e293b',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #38bdf844',
    textAlign: 'center',
  },
  applyBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.9rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  eligibleSubtext: {
    fontSize: '0.8rem',
    color: '#10b981',
    marginTop: '0.75rem',
  },
  ineligibleSubtext: {
    fontSize: '0.8rem',
    color: '#f87171',
    marginTop: '0.75rem',
  },
  appliedBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    backgroundColor: '#064e3b',
    color: '#a7f3d0',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  viewAppBtn: {
    width: '100%',
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: '1px solid #475569',
    padding: '0.75rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  eligibilityCard: {
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid',
  },
  eligibilityTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem',
  },
  eligibleText: {
    color: '#a7f3d0',
    lineHeight: '1.6',
  },
  reasonsBox: {
    marginTop: '0.5rem',
  },
  reasonsHeader: {
    color: '#fca5a5',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  reasonsList: {
    listStyle: 'none',
    paddingLeft: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  reasonItem: {
    color: '#fca5a5',
    fontSize: '0.95rem',
  },
  crossIcon: {
    marginRight: '0.4rem',
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
    marginBottom: '1rem',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.25rem',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  descriptionText: {
    color: '#cbd5e1',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
  },
  skillBadgeContainer: {
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
  sideList: {
    lineHeight: '2',
    color: '#cbd5e1',
    fontSize: '0.9rem',
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
    border: '1px solid #38bdf844',
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#38bdf8',
    marginBottom: '0.25rem',
  },
  modalSubtitle: {
    color: '#94a3b8',
    marginBottom: '1.5rem',
  },
  modalError: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  modalSuccess: {
    backgroundColor: '#064e3b',
    color: '#a7f3d0',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
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
  submitApplyBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  muted: {
    color: '#94a3b8',
  },
};
