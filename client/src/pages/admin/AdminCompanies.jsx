import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminCompaniesApi, verifyCompanyApi } from '../../services/adminService';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies(1);
    }, 350); // Debounce search

    return () => clearTimeout(timer);
  }, [search, verificationStatus]);

  const fetchCompanies = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (verificationStatus) params.verificationStatus = verificationStatus;

      const res = await getAdminCompaniesApi(params);
      if (res.success && Array.isArray(res.data)) {
        setCompanies(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load company directory');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (companyId, newStatus) => {
    const actionStr = newStatus === 'VERIFIED' ? 'approve and verify' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionStr} this company's credentials?`)) return;

    try {
      const res = await verifyCompanyApi(companyId, newStatus);
      if (res.success) {
        fetchCompanies(pagination.page);
      }
    } catch (err) {
      alert(err.message || `Failed to ${actionStr} company`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED': return { bg: '#064e3b', color: '#6ee7b7', label: 'Verified' };
      case 'REJECTED': return { bg: '#7f1d1d', color: '#fca5a5', label: 'Rejected' };
      case 'PENDING': default: return { bg: '#78350f', color: '#fde047', label: 'Pending Verification' };
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Back to Admin Dashboard</Link>
          <h1 style={styles.title}>Corporate Recruiter Verification Directory</h1>
        </div>
      </header>

      {/* Filter Row */}
      <div style={styles.filterRow}>
        <input
          type="text"
          placeholder="Search by company name, email, industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        <select
          value={verificationStatus}
          onChange={(e) => setVerificationStatus(e.target.value)}
          style={styles.select}
        >
          <option value="">All Verification Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.centerContainer}>
          <p style={styles.mutedText}>Loading company directory...</p>
        </div>
      ) : companies.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No company records found</h3>
          <p style={styles.mutedText}>Adjust your search keywords or verification filter.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {companies.map((comp) => {
            const compId = comp._id || comp.id;
            const badge = getStatusBadge(comp.verificationStatus);
            const userObj = comp.userId || {};

            return (
              <div key={compId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.compName}>{comp.companyName}</h3>
                    <span style={styles.industryText}>{comp.industry} • {comp.location || 'Location Unspecified'}</span>
                  </div>

                  <span style={{ ...styles.badge, backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <div style={styles.detailsGrid}>
                  <div>
                    <span style={styles.metaLabel}>Contact Recruiter</span>
                    <p style={styles.metaVal}>{userObj.name || 'Recruiter'} ({comp.contactEmail || userObj.email})</p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Company Size</span>
                    <p style={styles.metaVal}>{comp.companySize || 'N/A'}</p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Website</span>
                    <p style={styles.metaVal}>
                      {comp.website ? (
                        <a
                          href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.link}
                        >
                          {comp.website} ↗
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>Registered Date</span>
                    <p style={styles.metaVal}>{new Date(comp.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Recruiter Verification Actions */}
                <div style={styles.actionFooter}>
                  {comp.verificationStatus !== 'VERIFIED' && (
                    <button onClick={() => handleVerify(compId, 'VERIFIED')} style={styles.verifyBtn}>
                      ✓ Approve & Verify Company
                    </button>
                  )}

                  {comp.verificationStatus !== 'REJECTED' && (
                    <button onClick={() => handleVerify(compId, 'REJECTED')} style={styles.rejectBtn}>
                      ✗ Reject Credentials
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  compName: {
    color: '#f8fafc',
    fontSize: '1.25rem',
    margin: '0 0 0.2rem 0',
  },
  industryText: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#0f172a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  metaLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '0.2rem',
  },
  metaVal: {
    color: '#f8fafc',
    margin: 0,
    fontSize: '0.9rem',
  },
  link: {
    color: '#38bdf8',
    textDecoration: 'none',
  },
  actionFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    borderTop: '1px solid #334155',
    paddingTop: '1rem',
  },
  verifyBtn: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: '1px solid #10b981',
    padding: '0.5rem 1.2rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  rejectBtn: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    padding: '0.5rem 1.2rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
