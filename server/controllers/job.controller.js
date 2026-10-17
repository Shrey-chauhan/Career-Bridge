const jobService = require('../services/job.service');
const companyService = require('../services/company.service');
const studentService = require('../services/student.service');
const AppError = require('../utils/appError');

// Helper to retrieve authenticated company ID
const getCompanyId = async (userId) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found. Please complete your company profile first', 400);
  }
  return company._id || company.id;
};

// Company Controllers
const createJob = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req.user.id || req.user._id);
    const job = await jobService.createJob(companyId, req.body);
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyJobs = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req.user.id || req.user._id);
    const jobs = await jobService.getCompanyJobs(companyId);
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyJobById = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req.user.id || req.user._id);
    const job = await jobService.getJobByIdForCompany(companyId, req.params.id);
    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const updateCompanyJob = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req.user.id || req.user._id);
    const job = await jobService.updateJob(companyId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCompanyJob = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req.user.id || req.user._id);
    await jobService.deleteJob(companyId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const publishCompanyJob = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req.user.id || req.user._id);
    const job = await jobService.publishJob(companyId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Job published successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const closeCompanyJob = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req.user.id || req.user._id);
    const job = await jobService.closeJob(companyId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Job closed successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Student & Public Discovery Controllers
const getPublishedJobs = async (req, res, next) => {
  try {
    const result = await jobService.getPublishedJobs(req.query);
    res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getPublishedJobById = async (req, res, next) => {
  try {
    let studentProfile = null;
    if (req.user && req.user.role === 'STUDENT') {
      studentProfile = await studentService.getProfileByUserId(req.user.id || req.user._id);
    }
    const result = await jobService.getPublishedJobById(req.params.id, studentProfile);
    res.status(200).json({
      success: true,
      data: result.job,
      eligibility: result.eligibility,
    });
  } catch (error) {
    next(error);
  }
};

const checkStudentEligibility = async (req, res, next) => {
  try {
    const studentProfile = await studentService.getProfileByUserId(req.user.id || req.user._id);
    const result = await jobService.getPublishedJobById(req.params.id, studentProfile);
    res.status(200).json({
      success: true,
      jobId: req.params.id,
      eligibility: result.eligibility,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getCompanyJobs,
  getCompanyJobById,
  updateCompanyJob,
  deleteCompanyJob,
  publishCompanyJob,
  closeCompanyJob,
  getPublishedJobs,
  getPublishedJobById,
  checkStudentEligibility,
};
