const interviewService = require('../services/interview.service');

const createInterview = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const interview = await interviewService.createInterview(userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const getInterviews = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const result = await interviewService.getInterviews(userId, userRole, req.query);
    res.status(200).json({
      success: true,
      data: result.interviews,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getInterviewById = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const interview = await interviewService.getInterviewById(userId, userRole, req.params.id);
    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleInterview = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const interview = await interviewService.rescheduleInterview(userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Interview rescheduled successfully',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const cancelInterview = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const interview = await interviewService.cancelInterview(userId, userRole, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Interview cancelled successfully',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const confirmInterview = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const interview = await interviewService.confirmInterview(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Interview attendance confirmed',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const completeInterview = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const interview = await interviewService.completeInterview(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Interview marked as completed',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const updateInterviewResult = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const interview = await interviewService.updateInterviewResult(userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Interview result recorded successfully',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const markNoShow = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const interview = await interviewService.markNoShow(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Candidate marked as no-show',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInterview,
  getInterviews,
  getInterviewById,
  rescheduleInterview,
  cancelInterview,
  confirmInterview,
  completeInterview,
  updateInterviewResult,
  markNoShow,
};
