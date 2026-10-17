const ApplicationActivity = require('../models/ApplicationActivity');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');
const studentService = require('./student.service');
const companyService = require('./company.service');

// In-memory fallback storage for Activities
const memoryActivities = new Map();

/**
 * Log an application activity event
 */
const createActivity = async ({
  applicationId,
  actorId,
  action,
  description,
  metadata = {},
}) => {
  if (!applicationId || !actorId || !action || !description) {
    console.error('Invalid activity parameters:', { applicationId, actorId, action, description });
    return null;
  }

  const appIdStr = applicationId.toString();
  const actorIdStr = actorId.toString();

  if (isConnected()) {
    try {
      const activity = await ApplicationActivity.create({
        applicationId,
        actorId,
        action,
        description,
        metadata,
      });
      return activity;
    } catch (err) {
      console.error('Error logging application activity:', err.message);
      return null;
    }
  } else {
    const actId = 'mem_act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newAct = {
      id: actId,
      _id: actId,
      applicationId: appIdStr,
      actorId: actorIdStr,
      action,
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryActivities.set(actId, newAct);
    return newAct;
  }
};

/**
 * Get activity timeline for an application with ownership validation
 */
const getApplicationActivities = async (userId, userRole, applicationId) => {
  if (!applicationId) {
    throw new AppError('Application ID is required', 400);
  }

  const userIdStr = userId.toString();

  if (isConnected()) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Ownership authorization check
    if (userRole === 'STUDENT') {
      const student = await studentService.getProfileByUserId(userId);
      if (!student || application.studentId.toString() !== student._id.toString()) {
        throw new AppError('You are not authorized to view activity for this application', 403);
      }
    } else if (userRole === 'COMPANY') {
      const company = await companyService.getProfileByUserId(userId);
      if (!company || application.companyId.toString() !== company._id.toString()) {
        throw new AppError('You are not authorized to view activity for this application', 403);
      }
    } else if (userRole !== 'ADMIN') {
      throw new AppError('Unauthorized access to application activity', 403);
    }

    const activities = await ApplicationActivity.find({ applicationId })
      .sort({ createdAt: 1 });

    return activities;
  } else {
    // Memory Mode
    const appIdStr = applicationId.toString();
    const appActivities = [];
    for (const act of memoryActivities.values()) {
      if (act.applicationId.toString() === appIdStr) {
        appActivities.push(act);
      }
    }

    appActivities.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return appActivities;
  }
};

module.exports = {
  createActivity,
  getApplicationActivities,
};
