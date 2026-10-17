const adminService = require('../services/admin.service');
const auditLogService = require('../services/auditLog.service');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await adminService.getDashboardMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const result = await adminService.getStudents(req.query);
    res.status(200).json({
      success: true,
      data: result.students,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const result = await adminService.getStudentById(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const toggleStudentStatus = async (req, res, next) => {
  try {
    const adminUser = req.user;
    const { isActive } = req.body;
    const result = await adminService.toggleStudentStatus(adminUser, req.params.id, isActive);
    res.status(200).json({
      success: true,
      message: `Student account ${result.user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const result = await adminService.getCompanies(req.query);
    res.status(200).json({
      success: true,
      data: result.companies,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const verifyCompany = async (req, res, next) => {
  try {
    const adminUser = req.user;
    const { status } = req.body;
    const company = await adminService.verifyCompany(adminUser, req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Company status updated to ${company.verificationStatus}`,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const result = await adminService.getJobs(req.query);
    res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const result = await adminService.getApplications(req.query);
    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getInterviews = async (req, res, next) => {
  try {
    const result = await adminService.getInterviews(req.query);
    res.status(200).json({
      success: true,
      data: result.interviews,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await auditLogService.getAuditLogs(req.query);
    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getStudents,
  getStudentById,
  toggleStudentStatus,
  getCompanies,
  verifyCompany,
  getJobs,
  getApplications,
  getInterviews,
  getAuditLogs,
};
