import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getOverviewAnalyticsApi,
  getRecruitmentFunnelApi,
  getApplicationTrendsApi,
  getCompanyPerformanceApi,
  getJobPerformanceApi,
  getBranchPerformanceApi,
  getInterviewAnalyticsApi,
  getDriveAnalyticsApi,
  getInsightsApi,
  downloadAnalyticsCsvApi,
} from '../../services/analyticsService';

export default function AdminAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Date Range Filters State
  const [rangePreset, setRangePreset] = useState(searchParams.get('preset') || 'ALL');
  const [fromDate, setFromDate] = useState(searchParams.get('from') || '');
  const [toDate, setToDate] = useState(searchParams.get('to') || '');

  // Dashboard Data State
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [trends, setTrends] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [interviews, setInterviews] = useState(null);
  const [drives, setDrives] = useState([]);
  const [insightsData, setInsightsData] = useState({ insights: [], bottlenecks: [] });

  // Section Loading & Error States
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAnalyticsData();
  }, [searchParams]);

  const handlePresetChange = (preset) => {
    setRangePreset(preset);
    const now = new Date();
    let from = '';
    let to = now.toISOString().split('T')[0];

    if (preset === '7D') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      from = d.toISOString().split('T')[0];
    } else if (preset === '30D') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      from = d.toISOString().split('T')[0];
    } else if (preset === '3M') {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      from = d.toISOString().split('T')[0];
    } else if (preset === '6M') {
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      from = d.toISOString().split('T')[0];
    } else if (preset === '1Y') {
      const d = new Date(now.getFullYear(), 0, 1);
      from = d.toISOString().split('T')[0];
    } else {
      to = '';
    }

    setFromDate(from);
    setToDate(to);
    updateQueryParams(from, to, preset);
  };

  const updateQueryParams = (from, to, preset) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (preset) params.preset = preset;
    setSearchParams(params);
  };

  const applyCustomFilter = (e) => {
    e.preventDefault();
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      alert('Start date ("From") cannot be after End date ("To").');
      return;
    }
    setRangePreset('CUSTOM');
    updateQueryParams(fromDate, toDate, 'CUSTOM');
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setErrors({});
    const query = {};
    if (fromDate) query.from = fromDate;
    if (toDate) query.to = toDate;

    try {
      const [
        overviewRes,
        funnelRes,
        trendsRes,
        compRes,
        jobRes,
        branchRes,
        intRes,
        driveRes,
        insightRes,
      ] = await Promise.allSettled([
        getOverviewAnalyticsApi(query),
        getRecruitmentFunnelApi(query),
        getApplicationTrendsApi(query),
        getCompanyPerformanceApi(query),
        getJobPerformanceApi(query),
        getBranchPerformanceApi(query),
        getInterviewAnalyticsApi(query),
        getDriveAnalyticsApi(query),
        getInsightsApi(query),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) setOverview(overviewRes.value.data);
      else setErrors((prev) => ({ ...prev, overview: 'Failed to load overview KPIs' }));

      if (funnelRes.status === 'fulfilled' && funnelRes.value.success) setFunnel(funnelRes.value.data);
      else setErrors((prev) => ({ ...prev, funnel: 'Failed to load recruitment funnel' }));

      if (trendsRes.status === 'fulfilled' && trendsRes.value.success) setTrends(trendsRes.value.data);
      if (compRes.status === 'fulfilled' && compRes.value.success) setCompanies(compRes.value.data);
      if (jobRes.status === 'fulfilled' && jobRes.value.success) setJobs(jobRes.value.data);
      if (branchRes.status === 'fulfilled' && branchRes.value.success) setBranches(branchRes.value.data);
      if (intRes.status === 'fulfilled' && intRes.value.success) setInterviews(intRes.value.data);
      if (driveRes.status === 'fulfilled' && driveRes.value.success) setDrives(driveRes.value.data);
      if (insightRes.status === 'fulfilled' && insightRes.value.success) setInsightsData(insightRes.value.data);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvDownload = async (type) => {
    try {
      const query = {};
      if (fromDate) query.from = fromDate;
      if (toDate) query.to = toDate;
      await downloadAnalyticsCsvApi(type, query);
    } catch (err) {
      alert(err.message || `Failed to download ${type} CSV report`);
    }
  };

  const kpis = overview?.kpis || {};
  const growth = overview?.growth || {};

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <span style={styles.roleTag}>College Administration Intelligence</span>
          <h1 style={styles.title}>Placement Analytics & Recruitment Dashboard</h1>
        </div>
        <Link to="/admin/dashboard" style={styles.backBtn}>← Admin Hub</Link>
      </header>

      {/* Date Range Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.presetGroup}>
          <span style={styles.filterLabel}>Time Window:</span>
          {['ALL', '7D', '30D', '3M', '6M', '1Y'].map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              style={{
                ...styles.presetBtn,
                backgroundColor: rangePreset === p ? '#0284c7' : '#1e293b',
                color: rangePreset === p ? '#ffffff' : '#cbd5e1',
              }}
            >
              {p === 'ALL' ? 'All Time' : p}
            </button>
          ))}
        </div>

        <form onSubmit={applyCustomFilter} style={styles.customForm}>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={styles.dateInput}
          />
          <span style={{ color: '#94a3b8' }}>to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={styles.dateInput}
          />
          <button type="submit" style={styles.applyBtn}>Apply Filter</button>
        </form>
      </div>

      {loading && (
        <div style={styles.loadingBanner}>
          <p>Computing MongoDB aggregation pipelines & metrics...</p>
        </div>
      )}

      {/* Dynamic Insights & Bottleneck Warnings */}
      {(insightsData.bottlenecks?.length > 0 || insightsData.insights?.length > 0) && (
        <div style={styles.insightsRow}>
          {insightsData.bottlenecks?.map((b, idx) => (
            <div key={idx} style={styles.warningCard}>
              <strong style={{ color: '#fca5a5' }}>⚠️ {b.title}</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#fecaca' }}>{b.message}</p>
            </div>
          ))}

          {insightsData.insights?.map((ins, idx) => (
            <div key={idx} style={styles.insightCard}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#e0f2fe' }}>{ins}</p>
            </div>
          ))}
        </div>
      )}

      {/* Executive KPI Grid */}
      <div style={styles.kpiGrid}>
        <div className="card-hover" style={{ ...styles.kpiCard, borderLeft: '4px solid #38bdf8' }}>
          <span style={styles.kpiLabel}>Placement Rate</span>
          <h2 style={{ ...styles.kpiValue, color: '#38bdf8' }}>{kpis.placementRate || 0}%</h2>
          <span style={styles.kpiSub}>
            Placed: {kpis.placedStudents || 0} / Participating: {kpis.participatingStudents || 0}
          </span>
        </div>

        <div className="card-hover" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Applications</span>
          <h2 style={styles.kpiValue}>{kpis.totalApplications || 0}</h2>
          <span style={{ ...styles.growthBadge, color: growth.applications >= 0 ? '#34d399' : '#f87171' }}>
            {growth.applications >= 0 ? `↑ ${growth.applications}%` : `↓ ${Math.abs(growth.applications)}%`} vs prev period
          </span>
        </div>

        <div className="card-hover" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Student Participation Rate</span>
          <h2 style={styles.kpiValue}>{kpis.participationRate || 0}%</h2>
          <span style={styles.kpiSub}>
            {kpis.participatingStudents || 0} of {kpis.totalStudents || 0} Total Registered
          </span>
        </div>

        <div className="card-hover" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Shortlisted Candidates</span>
          <h2 style={styles.kpiValue}>{kpis.shortlistedApps || 0}</h2>
          <span style={styles.kpiSub}>
            Shortlist Conversion: {funnel?.conversionRates?.applicationToShortlist || 0}%
          </span>
        </div>

        <div className="card-hover" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Interviews Conducted</span>
          <h2 style={styles.kpiValue}>{kpis.interviewsScheduled || 0}</h2>
          <span style={{ ...styles.growthBadge, color: growth.interviews >= 0 ? '#34d399' : '#f87171' }}>
            {growth.interviews >= 0 ? `↑ ${growth.interviews}%` : `↓ ${Math.abs(growth.interviews)}%`} vs prev period
          </span>
        </div>

        <div className="card-hover" style={{ ...styles.kpiCard, borderLeft: '4px solid #34d399' }}>
          <span style={styles.kpiLabel}>Placed Candidates</span>
          <h2 style={{ ...styles.kpiValue, color: '#34d399' }}>{kpis.placedStudents || 0}</h2>
          <span style={{ ...styles.growthBadge, color: growth.placed >= 0 ? '#34d399' : '#f87171' }}>
            {growth.placed >= 0 ? `↑ ${growth.placed}%` : `↓ ${Math.abs(growth.placed)}%`} vs prev period
          </span>
        </div>
      </div>

      {/* Recruitment Funnel & Application Trends Grid */}
      <div style={styles.twoColGrid}>
        {/* Recruitment Funnel Visualizer */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recruitment Conversion Funnel</h3>
          {funnel?.funnel ? (
            <div style={styles.funnelContainer}>
              {funnel.funnel.map((item, idx) => (
                <div key={idx} style={styles.funnelStage}>
                  <div style={styles.funnelHeader}>
                    <strong>{item.stage}</strong>
                    <span>{item.count} ({item.percentage}%)</span>
                  </div>
                  <div style={styles.funnelTrack}>
                    <div
                      style={{
                        ...styles.funnelBar,
                        width: `${Math.max(item.percentage, 4)}%`,
                        backgroundColor: idx === 4 ? '#10b981' : '#0284c7',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.mutedText}>No recruitment funnel data available.</p>
          )}
        </div>

        {/* Application Volume Trends SVG Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Application Volume Trends</h3>
          {trends.length > 0 ? (
            <div style={styles.chartBox}>
              <svg width="100%" height="200" viewBox="0 0 400 200" style={{ overflow: 'visible' }}>
                {/* Background grid lines */}
                <line x1="0" y1="40" x2="400" y2="40" stroke="#334155" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#334155" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="400" y2="160" stroke="#334155" strokeDasharray="3 3" />

                {/* Trend bars */}
                {trends.map((t, idx) => {
                  const maxVal = Math.max(...trends.map((item) => item.applications), 1);
                  const barHeight = (t.applications / maxVal) * 140;
                  const x = (idx / Math.max(trends.length, 1)) * 360 + 20;

                  return (
                    <g key={idx}>
                      <rect
                        x={x}
                        y={170 - barHeight}
                        width="24"
                        height={barHeight}
                        fill="#38bdf8"
                        rx="3"
                      />
                      <text x={x + 12} y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {t.period}
                      </text>
                      <text x={x + 12} y={160 - barHeight} fill="#f8fafc" fontSize="10" textAnchor="middle">
                        {t.applications}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <p style={styles.mutedText}>No time-series trends recorded yet.</p>
          )}
        </div>
      </div>

      {/* Tables Section */}

      {/* 1. Branch / Course Performance Table */}
      <div style={{ ...styles.card, marginTop: '1.5rem' }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Course & Branch Performance</h3>
          <button onClick={() => handleCsvDownload('branches')} style={styles.csvBtn}>
            📥 Export Branch CSV
          </button>
        </div>

        {branches.length === 0 ? (
          <p style={styles.mutedText}>No branch student records available.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Course & Branch</th>
                  <th style={styles.th}>Total Students</th>
                  <th style={styles.th}>Participating</th>
                  <th style={styles.th}>Applications</th>
                  <th style={styles.th}>Placed Candidates</th>
                  <th style={styles.th}>Placement Rate</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}><strong>{b.branch}</strong></td>
                    <td style={styles.td}>{b.totalStudents}</td>
                    <td style={styles.td}>{b.participating}</td>
                    <td style={styles.td}>{b.totalApplications}</td>
                    <td style={styles.td}><strong style={{ color: '#34d399' }}>{b.placed}</strong></td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{b.placementRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Top Recruiting Companies Table */}
      <div style={{ ...styles.card, marginTop: '1.5rem' }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Top Recruiting Corporate Partners</h3>
          <button onClick={() => handleCsvDownload('companies')} style={styles.csvBtn}>
            📥 Export Companies CSV
          </button>
        </div>

        {companies.length === 0 ? (
          <p style={styles.mutedText}>No company recruitment activity recorded.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Company Name</th>
                  <th style={styles.th}>Industry</th>
                  <th style={styles.th}>Jobs Posted</th>
                  <th style={styles.th}>Applications Received</th>
                  <th style={styles.th}>Shortlisted / Selections</th>
                  <th style={styles.th}>Selection Rate</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}><strong>{c.companyName}</strong></td>
                    <td style={styles.td}>{c.industry}</td>
                    <td style={styles.td}>{c.jobsCount}</td>
                    <td style={styles.td}>{c.applicationsCount}</td>
                    <td style={styles.td}><strong style={{ color: '#6ee7b7' }}>{c.shortlistedCount}</strong></td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{c.selectionRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Top Jobs Performance Table */}
      <div style={{ ...styles.card, marginTop: '1.5rem' }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Top Job Postings Performance</h3>
          <button onClick={() => handleCsvDownload('jobs')} style={styles.csvBtn}>
            📥 Export Jobs CSV
          </button>
        </div>

        {jobs.length === 0 ? (
          <p style={styles.mutedText}>No active job openings recorded.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Job Title</th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Applications</th>
                  <th style={styles.th}>Shortlisted</th>
                  <th style={styles.th}>Shortlist Rate</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} style={styles.tr}>
                    <td style={styles.td}><strong>{j.title}</strong></td>
                    <td style={styles.td}>{j.companyName}</td>
                    <td style={styles.td}><span style={styles.statusTag}>{j.status}</span></td>
                    <td style={styles.td}>{j.applicationsCount}</td>
                    <td style={styles.td}>{j.shortlistedCount}</td>
                    <td style={styles.td}><span style={styles.badge}>{j.shortlistRate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Placement Drives Comparison Table */}
      <div style={{ ...styles.card, marginTop: '1.5rem' }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Campus Placement Drives Analytics</h3>
          <button onClick={() => handleCsvDownload('drives')} style={styles.csvBtn}>
            📥 Export Drives CSV
          </button>
        </div>

        {drives.length === 0 ? (
          <p style={styles.mutedText}>No campus placement drives conducted yet.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Drive Name</th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Drive Status</th>
                  <th style={styles.th}>Associated Jobs</th>
                  <th style={styles.th}>Applications</th>
                  <th style={styles.th}>Shortlisted</th>
                  <th style={styles.th}>Drive Conversion</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((d) => (
                  <tr key={d.id} style={styles.tr}>
                    <td style={styles.td}><strong>{d.driveName}</strong></td>
                    <td style={styles.td}>{d.companyName}</td>
                    <td style={styles.td}><span style={styles.statusTag}>{d.status}</span></td>
                    <td style={styles.td}>{d.jobsCount}</td>
                    <td style={styles.td}>{d.totalApps}</td>
                    <td style={styles.td}>{d.shortlisted}</td>
                    <td style={styles.td}><span style={styles.badge}>{d.conversionRate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    flexWrap: 'wrap',
    gap: '1rem',
  },
  roleTag: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '2.25rem',
    color: '#38bdf8',
    margin: '0.3rem 0 0 0',
  },
  backBtn: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  filterBar: {
    backgroundColor: '#1e293b',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    border: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  presetGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  filterLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#94a3b8',
    marginRight: '0.5rem',
  },
  presetBtn: {
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  customForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  dateInput: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  applyBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 0.9rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  loadingBanner: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontSize: '0.9rem',
  },
  insightsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  warningCard: {
    backgroundColor: '#7f1d1d',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    border: '1px solid #ef4444',
  },
  insightCard: {
    backgroundColor: '#0369a1',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    border: '1px solid #38bdf8',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  kpiCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
  },
  kpiLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#f8fafc',
    margin: '0.3rem 0',
  },
  kpiSub: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
  },
  growthBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '1.5rem',
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
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: '1.15rem',
    margin: 0,
  },
  csvBtn: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    border: '1px solid #0284c7',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  mutedText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  funnelContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    marginTop: '0.5rem',
  },
  funnelStage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  funnelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#cbd5e1',
  },
  funnelTrack: {
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    height: '14px',
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.5s ease-in-out',
  },
  chartBox: {
    paddingTop: '1rem',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    borderBottom: '1px solid #334155',
  },
  tr: {
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#f8fafc',
  },
  badge: {
    backgroundColor: '#0369a1',
    color: '#e0f2fe',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  statusTag: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '6px',
  },
};
