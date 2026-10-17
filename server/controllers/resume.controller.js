const resumeService = require('../services/resume.service');

const uploadResume = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const resume = await resumeService.uploadResume(userId, req.file);
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

const getMyResume = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const resume = await resumeService.getActiveResume(userId);
    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

const getResumeById = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const resume = await resumeService.getResumeById(userId, userRole, req.params.id);
    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const result = await resumeService.deleteResume(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getMyResume,
  getResumeById,
  deleteResume,
};
