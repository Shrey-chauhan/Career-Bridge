const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const PlacementDrive = require('../models/PlacementDrive');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');

/**
 * Helper to compute growth percentage safely without NaN or Infinity
 */
const calculateGrowth = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const growth = ((current - previous) / previous) * 100;
  return Number(growth.toFixed(1));
};

/**
 * Helper to build Date filter object
 */
const buildDateFilter = (from, to, field = 'createdAt') => {
  const filter = {};
  if (from || to) {
    filter[field] = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) filter[field].$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) filter[field].$lte = toDate;
    }
  }
  return filter;
};

/**
 * 1. Overview KPIs & Period Growth Rates
 */
const getOverviewAnalytics = async (queryParams = {}) => {
  const { from, to } = queryParams;
  const dateFilter = buildDateFilter(from, to, 'createdAt');

  if (isConnected()) {
    const [
      totalStudents,
      participatingStudentsRaw,
      totalApplications,
      shortlistedApps,
      interviewsScheduled,
      completedInterviews,
      placedStudentsRaw,
      totalCompanies,
      activeJobs,
    ] = await Promise.all([
      Student.countDocuments(),
      Application.distinct('studentId', dateFilter),
      Application.countDocuments(dateFilter),
      Application.countDocuments({ ...dateFilter, status: 'SHORTLISTED' }),
      Interview.countDocuments(buildDateFilter(from, to, 'scheduledAt')),
      Interview.countDocuments({ ...buildDateFilter(from, to, 'scheduledAt'), status: 'COMPLETED' }),
      Application.distinct('studentId', { ...dateFilter, status: 'SHORTLISTED' }),
      Company.countDocuments(),
      Job.countDocuments({ status: 'PUBLISHED' }),
    ]);

    const participatingStudents = participatingStudentsRaw.length;
    const placedStudents = placedStudentsRaw.length;

    // Formulas
    const placementRate = participatingStudents > 0
      ? Number(((placedStudents / participatingStudents) * 100).toFixed(1))
      : 0;

    const participationRate = totalStudents > 0
      ? Number(((participatingStudents / totalStudents) * 100).toFixed(1))
      : 0;

    // Period-over-period comparison (Previous period of equal length)
    let growth = { applications: 0, placed: 0, interviews: 0 };
    if (from && to) {
      const currentStart = new Date(from);
      const currentEnd = new Date(to);
      const diffMs = currentEnd.getTime() - currentStart.getTime();

      const prevStart = new Date(currentStart.getTime() - diffMs);
      const prevEnd = currentStart;

      const prevDateFilter = buildDateFilter(prevStart, prevEnd, 'createdAt');

      const [prevApps, prevPlacedRaw, prevInts] = await Promise.all([
        Application.countDocuments(prevDateFilter),
        Application.distinct('studentId', { ...prevDateFilter, status: 'SHORTLISTED' }),
        Interview.countDocuments(buildDateFilter(prevStart, prevEnd, 'scheduledAt')),
      ]);

      growth = {
        applications: calculateGrowth(totalApplications, prevApps),
        placed: calculateGrowth(placedStudents, prevPlacedRaw.length),
        interviews: calculateGrowth(interviewsScheduled, prevInts),
      };
    }

    return {
      kpis: {
        totalStudents,
        participatingStudents,
        participationRate,
        totalApplications,
        shortlistedApps,
        interviewsScheduled,
        completedInterviews,
        placedStudents,
        placementRate,
        totalCompanies,
        activeJobs,
      },
      growth,
    };
  } else {
    // Memory Mode Fallback
    return {
      kpis: {
        totalStudents: 0,
        participatingStudents: 0,
        participationRate: 0,
        totalApplications: 0,
        shortlistedApps: 0,
        interviewsScheduled: 0,
        completedInterviews: 0,
        placedStudents: 0,
        placementRate: 0,
        totalCompanies: 0,
        activeJobs: 0,
      },
      growth: { applications: 0, placed: 0, interviews: 0 },
    };
  }
};

/**
 * 2. 5-Stage Recruitment Conversion Funnel
 */
const getRecruitmentFunnel = async (queryParams = {}) => {
  const { from, to } = queryParams;
  const dateFilter = buildDateFilter(from, to, 'createdAt');

  if (isConnected()) {
    const [totalApps, shortlistedApps, totalInterviews, passedInterviews] = await Promise.all([
      Application.countDocuments(dateFilter),
      Application.countDocuments({ ...dateFilter, status: 'SHORTLISTED' }),
      Interview.countDocuments(buildDateFilter(from, to, 'scheduledAt')),
      Interview.countDocuments({ ...buildDateFilter(from, to, 'scheduledAt'), result: 'PASSED' }),
    ]);

    const placedStudentsRaw = await Application.distinct('studentId', { ...dateFilter, status: 'SHORTLISTED' });
    const placedStudents = placedStudentsRaw.length;

    const computeRate = (val, base) => (base > 0 ? Number(((val / base) * 100).toFixed(1)) : 0);

    return {
      funnel: [
        { stage: 'Applications', count: totalApps, percentage: 100, dropoffRate: 0 },
        {
          stage: 'Shortlisted',
          count: shortlistedApps,
          percentage: computeRate(shortlistedApps, totalApps),
          dropoffRate: computeRate(totalApps - shortlistedApps, totalApps),
        },
        {
          stage: 'Interviewed',
          count: totalInterviews,
          percentage: computeRate(totalInterviews, shortlistedApps),
          dropoffRate: computeRate(shortlistedApps - totalInterviews, shortlistedApps),
        },
        {
          stage: 'Selected',
          count: passedInterviews,
          percentage: computeRate(passedInterviews, totalInterviews),
          dropoffRate: computeRate(totalInterviews - passedInterviews, totalInterviews),
        },
        {
          stage: 'Placed',
          count: placedStudents,
          percentage: computeRate(placedStudents, totalApps),
          dropoffRate: computeRate(totalApps - placedStudents, totalApps),
        },
      ],
      conversionRates: {
        applicationToShortlist: computeRate(shortlistedApps, totalApps),
        shortlistToInterview: computeRate(totalInterviews, shortlistedApps),
        interviewToSelection: computeRate(passedInterviews, totalInterviews),
        overallSelection: computeRate(placedStudents, totalApps),
      },
    };
  } else {
    return {
      funnel: [
        { stage: 'Applications', count: 0, percentage: 100, dropoffRate: 0 },
        { stage: 'Shortlisted', count: 0, percentage: 0, dropoffRate: 0 },
        { stage: 'Interviewed', count: 0, percentage: 0, dropoffRate: 0 },
        { stage: 'Selected', count: 0, percentage: 0, dropoffRate: 0 },
        { stage: 'Placed', count: 0, percentage: 0, dropoffRate: 0 },
      ],
      conversionRates: { applicationToShortlist: 0, shortlistToInterview: 0, interviewToSelection: 0, overallSelection: 0 },
    };
  }
};

/**
 * 3. Monthly / Weekly Time-Series Application Volume Trend
 */
const getApplicationTrends = async (queryParams = {}) => {
  const { from, to } = queryParams;
  const dateFilter = buildDateFilter(from, to, 'createdAt');

  if (isConnected()) {
    const trendData = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          shortlisted: {
            $sum: { $cond: [{ $eq: ['$status', 'SHORTLISTED'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrends = trendData.map((item) => ({
      period: `${months[item._id.month - 1]} ${item._id.year}`,
      applications: item.count,
      shortlisted: item.shortlisted,
    }));

    return formattedTrends;
  } else {
    return [
      { period: 'Jan 2026', applications: 12, shortlisted: 3 },
      { period: 'Feb 2026', applications: 25, shortlisted: 7 },
      { period: 'Mar 2026', applications: 40, shortlisted: 14 },
    ];
  }
};

/**
 * 4. Company Performance Table & Recruitment Conversion Rates
 */
const getCompanyPerformance = async (queryParams = {}) => {
  if (isConnected()) {
    const companyStats = await Company.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'companyId',
          as: 'jobs',
        },
      },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'companyId',
          as: 'applications',
        },
      },
      {
        $project: {
          companyName: 1,
          industry: 1,
          location: 1,
          verificationStatus: 1,
          jobsCount: { $size: '$jobs' },
          applicationsCount: { $size: '$applications' },
          shortlistedCount: {
            $size: {
              $filter: {
                input: '$applications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'SHORTLISTED'] },
              },
            },
          },
        },
      },
      { $sort: { applicationsCount: -1 } },
      { $limit: 50 },
    ]);

    const formatted = companyStats.map((c) => ({
      ...c,
      id: c._id,
      selectionRate: c.applicationsCount > 0
        ? Number(((c.shortlistedCount / c.applicationsCount) * 100).toFixed(1))
        : 0,
    }));

    return formatted;
  } else {
    return [];
  }
};

/**
 * 5. Top Jobs Performance Table
 */
const getJobPerformance = async (queryParams = {}) => {
  if (isConnected()) {
    const jobStats = await Job.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'jobId',
          as: 'applications',
        },
      },
      {
        $project: {
          title: 1,
          status: 1,
          location: 1,
          workMode: 1,
          companyName: '$company.companyName',
          applicationsCount: { $size: '$applications' },
          shortlistedCount: {
            $size: {
              $filter: {
                input: '$applications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'SHORTLISTED'] },
              },
            },
          },
        },
      },
      { $sort: { applicationsCount: -1 } },
      { $limit: 25 },
    ]);

    return jobStats.map((j) => ({
      ...j,
      id: j._id,
      shortlistRate: j.applicationsCount > 0
        ? Number(((j.shortlistedCount / j.applicationsCount) * 100).toFixed(1))
        : 0,
    }));
  } else {
    return [];
  }
};

/**
 * 6. Branch / Course Placement Breakdown
 */
const getBranchPerformance = async (queryParams = {}) => {
  if (isConnected()) {
    const branchStats = await Student.aggregate([
      {
        $group: {
          _id: { course: '$course', branch: '$branch' },
          totalStudents: { $sum: 1 },
          studentIds: { $push: '$_id' },
        },
      },
      { $sort: { totalStudents: -1 } },
    ]);

    const result = [];
    for (const b of branchStats) {
      const courseName = b._id.course || 'Unknown';
      const branchName = b._id.branch || 'General';

      const [participatingRaw, placedRaw, appsCount] = await Promise.all([
        Application.distinct('studentId', { studentId: { $in: b.studentIds } }),
        Application.distinct('studentId', { studentId: { $in: b.studentIds }, status: 'SHORTLISTED' }),
        Application.countDocuments({ studentId: { $in: b.studentIds } }),
      ]);

      const participating = participatingRaw.length;
      const placed = placedRaw.length;

      result.push({
        branch: `${courseName} - ${branchName}`,
        course: courseName,
        branchName,
        totalStudents: b.totalStudents,
        participating,
        totalApplications: appsCount,
        placed,
        placementRate: participating > 0 ? Number(((placed / participating) * 100).toFixed(1)) : 0,
      });
    }

    return result;
  } else {
    return [
      { branch: 'B.Tech - Computer Science', totalStudents: 120, participating: 95, totalApplications: 380, placed: 42, placementRate: 44.2 },
      { branch: 'B.Tech - Information Technology', totalStudents: 80, participating: 60, totalApplications: 210, placed: 24, placementRate: 40.0 },
    ];
  }
};

/**
 * 7. Interview Status & Result Breakdown
 */
const getInterviewAnalytics = async (queryParams = {}) => {
  const { from, to } = queryParams;
  const dateFilter = buildDateFilter(from, to, 'scheduledAt');

  if (isConnected()) {
    const [statusCounts, resultCounts] = await Promise.all([
      Interview.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Interview.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$result', count: { $sum: 1 } } },
      ]),
    ]);

    const statuses = { SCHEDULED: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0 };
    statusCounts.forEach((item) => {
      if (item._id) statuses[item._id] = item.count;
    });

    const results = { PENDING: 0, PASSED: 0, FAILED: 0, NEXT_ROUND: 0 };
    resultCounts.forEach((item) => {
      if (item._id) results[item._id] = item.count;
    });

    const completed = statuses.COMPLETED || 0;
    const passed = results.PASSED || 0;
    const interviewSuccessRate = completed > 0 ? Number(((passed / completed) * 100).toFixed(1)) : 0;

    return {
      statuses,
      results,
      interviewSuccessRate,
    };
  } else {
    return {
      statuses: { SCHEDULED: 5, CONFIRMED: 12, COMPLETED: 18, CANCELLED: 2, NO_SHOW: 1 },
      results: { PENDING: 4, PASSED: 10, FAILED: 3, NEXT_ROUND: 1 },
      interviewSuccessRate: 55.6,
    };
  }
};

/**
 * 8. Placement Drive Performance
 */
const getDriveAnalytics = async (queryParams = {}) => {
  if (isConnected()) {
    const drives = await PlacementDrive.find()
      .populate('companyId', 'companyName')
      .populate('jobIds', 'title');

    const formatted = [];
    for (const d of drives) {
      const jobObjectIds = d.jobIds.map((j) => j._id);
      let totalApps = 0;
      let shortlisted = 0;

      if (jobObjectIds.length > 0) {
        [totalApps, shortlisted] = await Promise.all([
          Application.countDocuments({ jobId: { $in: jobObjectIds } }),
          Application.countDocuments({ jobId: { $in: jobObjectIds }, status: 'SHORTLISTED' }),
        ]);
      }

      formatted.push({
        id: d._id,
        driveName: d.name,
        companyName: d.companyId?.companyName || 'Corporate Recruiter',
        status: d.status,
        startDate: d.startDate,
        endDate: d.endDate,
        jobsCount: d.jobIds.length,
        totalApps,
        shortlisted,
        conversionRate: totalApps > 0 ? Number(((shortlisted / totalApps) * 100).toFixed(1)) : 0,
      });
    }

    return formatted;
  } else {
    return [];
  }
};

/**
 * 9. Dynamic Rule-Based Insights & Bottleneck Alerts
 */
const generateInsights = async (queryParams = {}) => {
  const [funnelData, branchData, companyData] = await Promise.all([
    getRecruitmentFunnel(queryParams),
    getBranchPerformance(queryParams),
    getCompanyPerformance(queryParams),
  ]);

  const insights = [];
  const bottlenecks = [];

  // Rule 1: High Rejection Rate Bottleneck (<5% shortlist conversion)
  const shortlistRate = funnelData.conversionRates?.applicationToShortlist || 0;
  if (shortlistRate > 0 && shortlistRate < 5) {
    bottlenecks.push({
      type: 'HIGH_REJECTION',
      severity: 'WARNING',
      title: 'High Initial Application Rejection Rate',
      message: `Only ${shortlistRate}% of submitted applications advance to shortlisting. Consider reviewing candidate eligibility thresholds or resume quality.`,
    });
  }

  // Rule 2: Low Interview Selection Conversion (<15%)
  const intSelectionRate = funnelData.conversionRates?.interviewToSelection || 0;
  if (intSelectionRate > 0 && intSelectionRate < 15) {
    bottlenecks.push({
      type: 'LOW_INTERVIEW_CONVERSION',
      severity: 'WARNING',
      title: 'Low Interview-to-Selection Conversion Rate',
      message: `Only ${intSelectionRate}% of candidates clear technical/HR interviews. Consider conducting mock interview preparation sessions for candidates.`,
    });
  }

  // Rule 3: Top Performing Branch Insight
  if (branchData.length > 0) {
    const topBranch = [...branchData].sort((a, b) => b.placementRate - a.placementRate)[0];
    if (topBranch && topBranch.placementRate > 0) {
      insights.push(`🎓 ${topBranch.branch} holds the highest placement rate at ${topBranch.placementRate}%.`);
    }
  }

  // Rule 4: Top Recruiter Insight
  if (companyData.length > 0) {
    const topCompany = companyData[0];
    if (topCompany && topCompany.applicationsCount > 0) {
      insights.push(`🏢 ${topCompany.companyName} is the most applied corporate recruiter with ${topCompany.applicationsCount} candidate applications.`);
    }
  }

  return {
    insights,
    bottlenecks,
  };
};

/**
 * 10. Filter-Aware CSV Report Generator
 */
const generateCsvExport = async (type, queryParams = {}) => {
  let headers = [];
  let rows = [];

  switch (type) {
    case 'companies': {
      const data = await getCompanyPerformance(queryParams);
      headers = ['Company Name', 'Industry', 'Location', 'Jobs Posted', 'Applications', 'Shortlisted', 'Selection Rate (%)'];
      rows = data.map((c) => [c.companyName, c.industry, c.location, c.jobsCount, c.applicationsCount, c.shortlistedCount, c.selectionRate]);
      break;
    }
    case 'jobs': {
      const data = await getJobPerformance(queryParams);
      headers = ['Job Title', 'Company Name', 'Status', 'Location', 'Applications', 'Shortlisted', 'Shortlist Rate (%)'];
      rows = data.map((j) => [j.title, j.companyName, j.status, j.location, j.applicationsCount, j.shortlistedCount, j.shortlistRate]);
      break;
    }
    case 'branches': {
      const data = await getBranchPerformance(queryParams);
      headers = ['Course & Branch', 'Total Students', 'Participating', 'Applications', 'Placed', 'Placement Rate (%)'];
      rows = data.map((b) => [b.branch, b.totalStudents, b.participating, b.totalApplications, b.placed, b.placementRate]);
      break;
    }
    case 'drives': {
      const data = await getDriveAnalytics(queryParams);
      headers = ['Drive Name', 'Company Name', 'Status', 'Associated Jobs', 'Total Applications', 'Shortlisted', 'Conversion Rate (%)'];
      rows = data.map((d) => [d.driveName, d.companyName, d.status, d.jobsCount, d.totalApps, d.shortlisted, d.conversionRate]);
      break;
    }
    default:
      throw new AppError('Invalid CSV export type. Supported: companies, jobs, branches, drives', 400);
  }

  const csvLines = [headers.join(',')];
  rows.forEach((row) => {
    const escapedRow = row.map((field) => {
      const str = String(field !== undefined && field !== null ? field : '');
      return `"${str.replace(/"/g, '""')}"`;
    });
    csvLines.push(escapedRow.join(','));
  });

  return csvLines.join('\n');
};

module.exports = {
  getOverviewAnalytics,
  getRecruitmentFunnel,
  getApplicationTrends,
  getCompanyPerformance,
  getJobPerformance,
  getBranchPerformance,
  getInterviewAnalytics,
  getDriveAnalytics,
  generateInsights,
  generateCsvExport,
};
