import React, { useState } from 'react';
import { updateInterviewResultApi } from '../../services/interviewService';

export default function InterviewResultModal({ interview, onClose, onSuccess }) {
  const [result, setResult] = useState(interview?.result || 'PASSED');
  const [feedback, setFeedback] = useState(interview?.feedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!result) {
      setError('Please select an interview evaluation outcome.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateInterviewResultApi(interview._id || interview.id, {
        result,
        feedback,
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to record interview evaluation result');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Record Interview Evaluation</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <p style={styles.subText}>
          Round: <strong>{interview.roundName || 'Interview Round'}</strong>
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Evaluation Result *</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              style={styles.select}
            >
              <option value="PASSED">Passed (Recommend for Next Stage / Selection)</option>
              <option value="NEXT_ROUND">Next Round (Advance Candidate)</option>
              <option value="FAILED">Failed (Candidate Rejected)</option>
              <option value="PENDING">Pending (Decision Awaited)</option>
            </select>
          </div>

          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Internal Recruiter Feedback</label>
              <span style={styles.privateBadge}>Internal ONLY</span>
            </div>
            <p style={styles.helperText}>
              Notes recorded here are strictly internal to your hiring team and never shown to candidates.
            </p>
            <textarea
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Excellent problem solving skills in data structures. Strong communication..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Saving Evaluation...' : 'Save Evaluation Result'}
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
    maxWidth: '500px',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  title: {
    color: '#38bdf8',
    margin: 0,
    fontSize: '1.2rem',
  },
  subText: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    margin: '0 0 1rem 0',
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
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  privateBadge: {
    backgroundColor: '#0c4a6e',
    color: '#38bdf8',
    border: '1px solid #0284c7',
    padding: '0.15rem 0.5rem',
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  helperText: {
    color: '#94a3b8',
    fontSize: '0.775rem',
    margin: 0,
  },
  select: {
    padding: '0.7rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
  },
  textarea: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
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
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
