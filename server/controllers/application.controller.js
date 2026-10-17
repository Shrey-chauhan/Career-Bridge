const applicationService = require('../services/application.service');

/**
 * Student Controllers
 */
const applyForJob = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { jobId, coverLetter } = req.body;
    const application = await applicationService.createApplication(userId, {
      jobId,
      coverLetter,
    });
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const result = await applicationService.getStudentApplications(userId, req.query);
    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getMyApplicationById = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const application = await applicationService.getStudentApplicationById(
      userId,
      req.params.id
    );
    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const withdrawApplication = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const application = await applicationService.withdrawApplication(
      userId,
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company Controllers
 */
const getCompanyApplications = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const result = await applicationService.getCompanyApplications(userId, req.query);
    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyApplicationById = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const application = await applicationService.getCompanyApplicationById(
      userId,
      req.params.id
    );
    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const shortlistApplication = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const application = await applicationService.shortlistApplication(
      userId,
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: 'Application shortlisted',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const rejectApplication = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { reason, companyNotes } = req.body;
    const application = await applicationService.rejectApplication(
      userId,
      req.params.id,
      { reason, companyNotes }
    );
    res.status(200).json({
      success: true,
      message: 'Application rejected',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const updateCompanyNotes = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { companyNotes } = req.body;
    const application = await applicationService.updateCompanyNotes(
      userId,
      req.params.id,
      { companyNotes }
    );
    res.status(200).json({
      success: true,
      message: 'Company notes updated successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getMyApplicationById,
  withdrawApplication,
  getCompanyApplications,
  getCompanyApplicationById,
  shortlistApplication,
  rejectApplication,
  updateCompanyNotes,
};
