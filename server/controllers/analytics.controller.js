const analyticsService = require('../services/analytics.service');
const auditLogService = require('../services/auditLog.service');

/**
 * 1. GET Overview KPIs & Growth
 */
const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverviewAnalytics(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET 5-Stage Recruitment Conversion Funnel
 */
const getFunnel = async (req, res, next) => {
  try {
    const data = await analyticsService.getRecruitmentFunnel(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET Time-Series Application Volume Trends
 */
const getTrends = async (req, res, next) => {
  try {
    const data = await analyticsService.getApplicationTrends(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET Company Performance & Conversion Rates
 */
const getCompanies = async (req, res, next) => {
  try {
    const data = await analyticsService.getCompanyPerformance(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET Top Job Postings Performance
 */
const getJobs = async (req, res, next) => {
  try {
    const data = await analyticsService.getJobPerformance(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET Branch / Course Placement Performance
 */
const getBranches = async (req, res, next) => {
  try {
    const data = await analyticsService.getBranchPerformance(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. GET Interview Status & Result Distribution
 */
const getInterviews = async (req, res, next) => {
  try {
    const data = await analyticsService.getInterviewAnalytics(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. GET Campus Placement Drives Performance
 */
const getDrives = async (req, res, next) => {
  try {
    const data = await analyticsService.getDriveAnalytics(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. GET Dynamic Rule-Based Insights & Bottlenecks
 */
const getInsights = async (req, res, next) => {
  try {
    const data = await analyticsService.generateInsights(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. GET Filter-Aware CSV Export Download
 */
const exportCsv = async (req, res, next) => {
  try {
    const { type } = req.params;
    const csvData = await analyticsService.generateCsvExport(type, req.query);

    // Audit Log for sensitive data export
    await auditLogService.createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ANALYTICS_EXPORT',
      entityType: 'ANALYTICS',
      entityId: req.user.id,
      description: `Exported ${type} analytics report to CSV`,
      metadata: { type, query: req.query },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="careerbridge_${type}_analytics.csv"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getFunnel,
  getTrends,
  getCompanies,
  getJobs,
  getBranches,
  getInterviews,
  getDrives,
  getInsights,
  exportCsv,
};
