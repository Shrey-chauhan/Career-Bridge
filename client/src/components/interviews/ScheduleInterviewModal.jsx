import React, { useState, useEffect } from 'react';
import { createInterviewApi, rescheduleInterviewApi } from '../../services/interviewService';

export default function ScheduleInterviewModal({
  application = null,
  existingInterview = null,
  onClose,
  onSuccess,
}) {
  const isReschedule = Boolean(existingInterview);

  const [formData, setFormData] = useState({
    scheduledAt: '',
    duration: 45,
    interviewType: 'ONLINE',
    meetingLink: '',
    location: '',
    interviewerName: '',
    interviewerEmail: '',
    roundName: 'Technical Interview',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingInterview) {
      const dt = new Date(existingInterview.scheduledAt);
      const isoLocalStr = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData({
        scheduledAt: isoLocalStr,
        duration: existingInterview.duration || 45,
        interviewType: existingInterview.interviewType || 'ONLINE',
        meetingLink: existingInterview.meetingLink || '',
        location: existingInterview.location || '',
        interviewerName: existingInterview.interviewerName || '',
        interviewerEmail: existingInterview.interviewerEmail || '',
        roundName: existingInterview.roundName || 'Technical Interview',
      });
    }
  }, [existingInterview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.scheduledAt) {
      setError('Please select a valid interview date and time.');
      return;
    }

    if (new Date(formData.scheduledAt) <= new Date()) {
      setError('Interview date and time must be in the future.');
      return;
    }

    if (formData.interviewType === 'ONLINE' && !formData.meetingLink.trim()) {
      setError('Meeting link (e.g. Google Meet / Zoom link) is required for online interviews.');
      return;
    }

    if (formData.interviewType === 'OFFLINE' && !formData.location.trim()) {
      setError('Office address / location is required for offline interviews.');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (isReschedule) {
        res = await rescheduleInterviewApi(existingInterview._id || existingInterview.id, formData);
      } else {
        const payload = {
          ...formData,
          applicationId: application._id || application.id,
          jobId: application.jobId?._id || application.jobId,
          studentId: application.studentId?._id || application.studentId,
        };
        res = await createInterviewApi(payload);
      }

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save interview details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            {isReschedule ? 'Reschedule Interview Round' : 'Schedule Candidate Interview'}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Round Title *</label>
            <input
              type="text"
              name="roundName"
              required
              value={formData.roundName}
              onChange={handleChange}
              placeholder="e.g. Round 1 - Technical Interview"
              style={styles.input}
            />
          </div>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Date & Time (Local) *</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                required
                value={formData.scheduledAt}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Duration (Minutes) *</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                style={styles.input}
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Interview Type *</label>
              <select
                name="interviewType"
                value={formData.interviewType}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="ONLINE">Online (Video Call)</option>
                <option value="OFFLINE">Offline (In-Person)</option>
                <option value="PHONE">Telephonic / Phone</option>
              </select>
            </div>

            {formData.interviewType === 'ONLINE' ? (
              <div style={styles.field}>
                <label style={styles.label}>Meeting URL *</label>
                <input
                  type="url"
                  name="meetingLink"
                  required
                  placeholder="https://meet.google.com/xyz-abc"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            ) : (
              <div style={styles.field}>
                <label style={styles.label}>Location / Address *</label>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g. Conference Room 3, Building A"
                  value={formData.location}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            )}
          </div>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Interviewer Name *</label>
              <input
                type="text"
                name="interviewerName"
                required
                placeholder="e.g. Sarah Jenkins (Tech Lead)"
                value={formData.interviewerName}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Interviewer Contact Email *</label>
              <input
                type="email"
                name="interviewerEmail"
                required
                placeholder="interviewer@company.com"
                value={formData.interviewerEmail}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Saving Interview...' : isReschedule ? 'Reschedule Interview' : 'Confirm & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
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
    maxWidth: '560px',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  title: {
    color: '#38bdf8',
    margin: 0,
    fontSize: '1.25rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
    marginTop: '1rem',
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
