import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPublishedJobsApi } from '../../services/jobService';
import { getStudentProfileApi } from '../../services/studentService';

export default function StudentJobs() {
  const [jobs, setJobs] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [page, jobType, workMode]);

  const fetchStudentProfile = async () => {
    try {
      const res = await getStudentProfileApi();
      if (res.success && res.data) {
        setStudentProfile(res.data);
      }
    } catch (err) {
      // Profile not created yet or error; handled gracefully
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(jobType && { jobType }),
        ...(workMode && { workMode }),
      };

      const res = await getPublishedJobsApi(params);
      if (res.success) {
        setJobs(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load job opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  // Evaluate candidate eligibility against job rules
  const evaluateJobEligibility = (student, job) => {
    if (!student) return { isEligible: true, reasons: [] };
    const reasons = [];

    if (job.eligibility) {
      if (job.eligibility.minimumCgpa !== undefined && student.cgpa !== undefined) {
        if (student.cgpa < job.eligibility.minimumCgpa) {
          reasons.push(`Requires Min CGPA ${job.eligibility.minimumCgpa} (Your CGPA: ${student.cgpa})`);
        }
      }

      if (job.eligibility.maximumBacklogs !== undefined && student.backlogs !== undefined) {
        if (student.backlogs > job.eligibility.maximumBacklogs) {
          reasons.push(`Max Backlogs ${job.eligibility.maximumBacklogs} (You have ${student.backlogs})`);
        }
      }

      if (Array.isArray(job.eligibility.allowedBranches) && job.eligibility.allowedBranches.length > 0 && student.branch) {
        const branchSynonyms = {
          CSE: ['CSE', 'COMPUTER SCIENCE', 'COMPUTER SCIENCE & ENGINEERING', 'COMPUTER SCIENCE AND ENGINEERING', 'CS'],
          IT: ['IT', 'INFORMATION TECHNOLOGY'],
          ECE: ['ECE', 'ELECTRONICS & COMMUNICATION', 'ELECTRONICS AND COMMUNICATION ENGINEERING', 'ELECTRONICS'],
          EEE: ['EEE', 'ELECTRICAL & ELECTRONICS', 'ELECTRICAL AND ELECTRONICS ENGINEERING', 'EE', 'ELECTRICAL ENGINEERING'],
          ME: ['ME', 'MECHANICAL', 'MECHANICAL ENGINEERING'],
          CE: ['CE', 'CIVIL', 'CIVIL ENGINEERING'],
        };
        const sUpper = student.branch.trim().toUpperCase();
        let variants = [sUpper];
        for (const list of Object.values(branchSynonyms)) {
          if (list.includes(sUpper)) {
            variants = list;
            break;
          }
        }
        const normalizedAllowed = job.eligibility.allowedBranches.map((b) => b.trim().toUpperCase());
        const matchBranch = variants.some((v) => normalizedAllowed.includes(v)) ||
          normalizedAllowed.some((b) => variants.some((v) => b.includes(v) || v.includes(b)));

        if (!matchBranch) {
          reasons.push(`Allowed Branches: ${job.eligibility.allowedBranches.join(', ')}`);
        }
      }

      if (Array.isArray(job.eligibility.graduationYears) && job.eligibility.graduationYears.length > 0 && student.graduationYear) {
        if (!job.eligibility.graduationYears.includes(student.graduationYear)) {
          reasons.push(`Allowed Grad Years: ${job.eligibility.graduationYears.join(', ')}`);
        }
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  };

  const displayedJobs = jobs.filter((job) => {
    if (eligibilityFilter === 'ALL') return true;
    const evalResult = evaluateJobEligibility(studentProfile, job);
    if (eligibilityFilter === 'ELIGIBLE') return evalResult.isEligible;
    if (eligibilityFilter === 'INELIGIBLE') return !evalResult.isEligible;
    return true;
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/dashboard" style={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 style={styles.title}>Job Opportunities</h1>
          <p style={styles.subtitle}>Browse active recruitment drives & verify your real-time eligibility</p>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearchSubmit} style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <input
            type="text"
            placeholder="Search by job title, skills, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />

          {/* Eligibility Filter Dropdown */}
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            style={{
              ...styles.selectFilter,
              borderColor: eligibilityFilter === 'ELIGIBLE' ? '#10b981' : eligibilityFilter === 'INELIGIBLE' ? '#f87171' : '#334155',
              color: eligibilityFilter === 'ELIGIBLE' ? '#6ee7b7' : eligibilityFilter === 'INELIGIBLE' ? '#fca5a5' : '#f8fafc',
            }}
          >
            <option value="ALL">All Eligibility Statuses</option>
            <option value="ELIGIBLE">✓ Eligible Jobs Only</option>
            <option value="INELIGIBLE">✕ Ineligible Jobs Only</option>
          </select>

          <select
            value={jobType}
            onChange={(e) => {
              setJobType(e.target.value);
              setPage(1);
            }}
            style={styles.selectFilter}
          >
            <option value="">All Job Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
          </select>

          <select
            value={workMode}
            onChange={(e) => {
              setWorkMode(e.target.value);
              setPage(1);
            }}
            style={styles.selectFilter}
          >
            <option value="">All Work Modes</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
            <option value="ONSITE">Onsite</option>
          </select>

          <button type="submit" style={styles.searchBtn}>
            Search
          </button>
        </div>
      </form>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.muted}>Loading Job Opportunities...</p>
        </div>
      ) : displayedJobs.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No Matching Job Opportunities Found</h3>
          <p style={styles.muted}>Try adjusting your search query, work mode, or eligibility filter dropdown.</p>
        </div>
      ) : (
        <>
          <div style={styles.jobsGrid}>
            {displayedJobs.map((job) => {
              const companyName = job.companyId?.companyName || 'Company';
              const deadline = new Date(job.applicationDeadline).toLocaleDateString();
              const evalResult = evaluateJobEligibility(studentProfile, job);

              return (
                <div
                  key={job.id || job._id}
                  onClick={() => navigate(`/student/jobs/${job.id || job._id}`)}
                  style={{
                    ...styles.jobCard,
                    borderColor: evalResult.isEligible ? '#059669' : '#334155',
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.jobTitle}>{job.title}</h3>
                      <p style={styles.companyName}>{companyName}</p>
                    </div>
                    <span style={styles.typeTag}>{job.jobType.replace('_', ' ')}</span>
                  </div>

                  {/* Real-time Eligibility Status Badge */}
                  {studentProfile && (
                    <div style={styles.eligibilityBadgeRow}>
                      {evalResult.isEligible ? (
                        <span style={styles.eligibleBadge}>✓ Eligible to Apply</span>
                      ) : (
                        <span style={styles.ineligibleBadge} title={evalResult.reasons.join(' | ')}>
                          ✕ Ineligible: {evalResult.reasons[0]}
                        </span>
                      )}
                    </div>
                  )}

                  <p style={styles.descriptionSnippet}>
                    {job.description.length > 120
                      ? `${job.description.substring(0, 120)}...`
                      : job.description}
                  </p>

                  <div style={styles.metaRow}>
                    <span>📍 {job.location || job.workMode}</span>
                    {job.salary && (
                      <span>
                        💰 ₹{job.salary.min.toLocaleString()} - ₹{job.salary.max.toLocaleString()} / {job.salary.period.toLowerCase()}
                      </span>
                    )}
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div style={styles.skillList}>
                      {job.skills.slice(0, 4).map((s, idx) => (
                        <span key={idx} style={styles.skillBadge}>{s}</span>
                      ))}
                      {job.skills.length > 4 && (
                        <span style={styles.moreSkill}>+{job.skills.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div style={styles.cardFooter}>
                    <span style={styles.deadlineText}>Deadline: {deadline}</span>
                    <span style={styles.viewLink}>View Details & Apply →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={styles.paginationRow}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={styles.pageBtn}
              >
                ← Previous
              </button>

              <span style={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total jobs)
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={styles.pageBtn}
              >
                Next →
              </button>
            </div>
          )}
        </>
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
    padding: '3rem',
    textAlign: 'center',
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
  subtitle: {
    color: '#94a3b8',
    marginTop: '0.25rem',
  },
  filterCard: {
    backgroundColor: '#1e293b',
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid #334155',
    marginBottom: '2rem',
  },
  filterGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  searchInput: {
    flex: 2,
    minWidth: '240px',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.95rem',
  },
  selectFilter: {
    flex: 1,
    minWidth: '160px',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.95rem',
  },
  searchBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
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
  emptyCard: {
    backgroundColor: '#1e293b',
    padding: '3rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #334155',
  },
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  jobCard: {
    backgroundColor: '#1e293b',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #334155',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },
  jobTitle: {
    fontSize: '1.25rem',
    color: '#f8fafc',
  },
  companyName: {
    color: '#38bdf8',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginTop: '0.2rem',
  },
  typeTag: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  eligibilityBadgeRow: {
    marginBottom: '0.75rem',
  },
  eligibleBadge: {
    display: 'inline-block',
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: '1px solid #10b981',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: '600',
  },
  ineligibleBadge: {
    display: 'inline-block',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #f87171',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: '600',
  },
  descriptionSnippet: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    marginBottom: '1rem',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  skillList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginBottom: '1.25rem',
  },
  skillBadge: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
  moreSkill: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    paddingTop: '2px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #334155',
    paddingTop: '0.75rem',
    fontSize: '0.85rem',
  },
  deadlineText: {
    color: '#94a3b8',
  },
  viewLink: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    marginTop: '2.5rem',
  },
  pageBtn: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  pageInfo: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
  },
  muted: {
    color: '#94a3b8',
  },
};
