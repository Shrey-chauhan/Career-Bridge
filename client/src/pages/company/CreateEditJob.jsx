import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  createJobApi,
  getCompanyJobByIdApi,
  updateJobApi,
} from '../../services/jobService';

export default function CreateEditJob() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'FULL_TIME',
    workMode: 'HYBRID',
    location: '',
    salaryMin: 600000,
    salaryMax: 1200000,
    salaryCurrency: 'INR',
    salaryPeriod: 'YEARLY',
    minYears: 0,
    maxYears: 2,
    skills: 'JavaScript, React, Node.js',
    minimumCgpa: 7.0,
    maximumBacklogs: 0,
    allowedBranches: 'CSE, IT, ECE',
    graduationYears: '2026, 2027',
    requiredSkills: 'JavaScript, React',
    applicationDeadline: '',
    openings: 5,
  });

  useEffect(() => {
    if (isEdit) {
      fetchJobDetails();
    } else {
      // Set default deadline post-September 2026 (e.g. Oct 31, 2026)
      const defaultDate = new Date(2026, 9, 31, 23, 59);
      setFormData((prev) => ({
        ...prev,
        applicationDeadline: defaultDate.toISOString().slice(0, 16),
      }));
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const res = await getCompanyJobByIdApi(id);
      if (res.success && res.data) {
        const j = res.data;
        const deadlineFormatted = j.applicationDeadline
          ? new Date(j.applicationDeadline).toISOString().slice(0, 16)
          : '';

        setFormData({
          title: j.title || '',
          description: j.description || '',
          jobType: j.jobType || 'FULL_TIME',
          workMode: j.workMode || 'HYBRID',
          location: j.location || '',
          salaryMin: j.salary?.min || 0,
          salaryMax: j.salary?.max || 0,
          salaryCurrency: j.salary?.currency || 'INR',
          salaryPeriod: j.salary?.period || 'YEARLY',
          minYears: j.experienceRequired?.minYears || 0,
          maxYears: j.experienceRequired?.maxYears || 0,
          skills: j.skills ? j.skills.join(', ') : '',
          minimumCgpa: j.eligibility?.minimumCgpa || 0,
          maximumBacklogs: j.eligibility?.maximumBacklogs || 0,
          allowedBranches: j.eligibility?.allowedBranches ? j.eligibility.allowedBranches.join(', ') : '',
          graduationYears: j.eligibility?.graduationYears ? j.eligibility.graduationYears.join(', ') : '',
          requiredSkills: j.eligibility?.requiredSkills ? j.eligibility.requiredSkills.join(', ') : '',
          applicationDeadline: deadlineFormatted,
          openings: j.openings || 1,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const preparePayload = (status) => {
    const parseCommaList = (str) =>
      str ? str.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const parseNumberList = (str) =>
      str ? str.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)) : [];

    return {
      title: formData.title.trim(),
      description: formData.description.trim(),
      jobType: formData.jobType,
      workMode: formData.workMode,
      location: formData.location.trim(),
      salary: {
        min: Number(formData.salaryMin),
        max: Number(formData.salaryMax),
        currency: formData.salaryCurrency,
        period: formData.salaryPeriod,
      },
      experienceRequired: {
        minYears: Number(formData.minYears),
        maxYears: Number(formData.maxYears),
      },
      skills: parseCommaList(formData.skills),
      eligibility: {
        minimumCgpa: Number(formData.minimumCgpa),
        maximumBacklogs: Number(formData.maximumBacklogs),
        allowedBranches: parseCommaList(formData.allowedBranches),
        graduationYears: parseNumberList(formData.graduationYears),
        requiredSkills: parseCommaList(formData.requiredSkills),
      },
      applicationDeadline: formData.applicationDeadline,
      openings: Number(formData.openings),
      status,
    };
  };

  const handleSubmit = async (e, targetStatus) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = preparePayload(targetStatus);
      if (isEdit) {
        await updateJobApi(id, payload);
      } else {
        await createJobApi(payload);
      }
      navigate('/company/jobs');
    } catch (err) {
      setError(err.message || 'Failed to save job posting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p style={styles.muted}>Loading Job Form...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/company/jobs" style={styles.backLink}>
          ← Back to Company Jobs
        </Link>
        <h1 style={styles.title}>{isEdit ? 'Edit Job Posting' : 'Create Job Posting'}</h1>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form style={styles.card}>
        {/* Basic Info */}
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Basic Job Information</h2>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Job Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Software Engineer / React Developer"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Job Type *</label>
              <select name="jobType" value={formData.jobType} onChange={handleChange} style={styles.select}>
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Work Mode *</label>
              <select name="workMode" value={formData.workMode} onChange={handleChange} style={styles.select}>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
                <option value="ONSITE">Onsite</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Pune, India or Remote"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldMargin}>
            <label style={styles.label}>Job Description *</label>
            <textarea
              name="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe roles, responsibilities, and team overview..."
              style={styles.textarea}
            />
          </div>
        </div>

        {/* Compensation & Experience */}
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Compensation & Experience</h2>
          <div style={styles.grid4}>
            <div style={styles.field}>
              <label style={styles.label}>Min Salary (₹)</label>
              <input
                type="number"
                name="salaryMin"
                min={0}
                value={formData.salaryMin}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Max Salary (₹)</label>
              <input
                type="number"
                name="salaryMax"
                min={0}
                value={formData.salaryMax}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Salary Period</label>
              <select name="salaryPeriod" value={formData.salaryPeriod} onChange={handleChange} style={styles.select}>
                <option value="YEARLY">Yearly (LPA)</option>
                <option value="MONTHLY">Monthly Stipend</option>
                <option value="HOURLY">Hourly Rate</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Openings *</label>
              <input
                type="number"
                name="openings"
                min={1}
                required
                value={formData.openings}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Min Experience (Years)</label>
              <input
                type="number"
                name="minYears"
                min={0}
                value={formData.minYears}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Max Experience (Years)</label>
              <input
                type="number"
                name="maxYears"
                min={0}
                value={formData.maxYears}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldSpan2}>
              <label style={styles.label}>Application Deadline *</label>
              <input
                type="datetime-local"
                name="applicationDeadline"
                required
                value={formData.applicationDeadline}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Skills & Eligibility Rules */}
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Eligibility Rules & Required Skills</h2>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Minimum CGPA (0.0 - 10.0)</label>
              <input
                type="number"
                step="0.1"
                name="minimumCgpa"
                min={0}
                max={10}
                value={formData.minimumCgpa}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Maximum Allowed Backlogs</label>
              <input
                type="number"
                name="maximumBacklogs"
                min={0}
                value={formData.maximumBacklogs}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Allowed Branches (comma separated)</label>
              <input
                type="text"
                name="allowedBranches"
                value={formData.allowedBranches}
                onChange={handleChange}
                placeholder="e.g. CSE, IT, ECE"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Eligible Graduation Years (comma separated)</label>
              <input
                type="text"
                name="graduationYears"
                value={formData.graduationYears}
                onChange={handleChange}
                placeholder="e.g. 2026, 2027"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldMargin}>
            <label style={styles.label}>All Job Skills (comma separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. JavaScript, React, Node.js, MongoDB"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldMargin}>
            <label style={styles.label}>Strict Mandatory Skills for Eligibility Check (comma separated)</label>
            <input
              type="text"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              placeholder="e.g. JavaScript, React"
              style={styles.input}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            style={styles.draftBtn}
          >
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, 'PUBLISHED')}
            style={styles.publishBtn}
          >
            {submitting ? 'Publishing...' : 'Publish Job'}
          </button>
        </div>
      </form>
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
  },
  header: {
    marginBottom: '1.5rem',
  },
  backLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
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
  formSection: {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #334155',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#38bdf8',
    marginBottom: '1.25rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  fieldSpan2: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    gridColumn: 'span 2',
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
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  draftBtn: {
    flex: 1,
    backgroundColor: '#475569',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  publishBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  muted: {
    color: '#94a3b8',
  },
};
