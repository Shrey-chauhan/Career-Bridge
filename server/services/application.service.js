const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');
const { evaluateEligibility } = require('./eligibility.service');
const studentService = require('./student.service');
const jobService = require('./job.service');
const companyService = require('./company.service');
const notificationService = require('./notification.service');
const activityService = require('./activity.service');

// In-memory fallback storage for Applications
const memoryApplications = new Map();

/**
 * Format Candidate DTO for Company view without exposing sensitive user data
 */
const formatCandidateDTO = (student, user = null) => {
  if (!student) return null;
  return {
    id: student._id || student.id,
    studentProfileId: student._id || student.id,
    name: user ? user.name : student.name || 'Candidate',
    email: user ? user.email : student.email || '',
    phone: student.phone || '',
    college: student.college || '',
    degree: student.degree || '',
    branch: student.branch || '',
    graduationYear: student.graduationYear || null,
    cgpa: student.cgpa || 0,
    backlogs: student.backlogs || 0,
    skills: student.skills || [],
    projects: student.projects || [],
    certifications: student.certifications || [],
    experience: student.experience || [],
    resume: student.resume || { url: '', fileName: '' },
    location: student.location || '',
    bio: student.bio || '',
    linkedin: student.linkedin || '',
    github: student.github || '',
    portfolio: student.portfolio || '',
    placementStatus: student.placementStatus || 'NOT_PLACED',
  };
};

/**
 * Student: Apply for a job
 */
const createApplication = async (userId, { jobId, coverLetter }) => {
  if (!jobId) {
    throw new AppError('Job ID is required to submit an application', 400);
  }

  // 1. Get Student Profile
  const student = await studentService.getProfileByUserId(userId);
  if (!student) {
    throw new AppError('Student profile not found. Please complete your profile before applying.', 400);
  }

  // 2. Get Job Posting
  let job;
  if (isConnected()) {
    job = await Job.findById(jobId).populate('companyId');
  }
  if (!job) {
    const jobRes = await jobService.getPublishedJobById(jobId).catch(() => null);
    job = jobRes?.job || jobRes;
  }
  if (!job) {
    throw new AppError('Job posting not found', 404);
  }

  // 3. Check Job Status
  if (job.status !== 'PUBLISHED') {
    throw new AppError('Applications are only accepted for published job postings', 400);
  }

  // 4. Check Application Deadline
  if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
    throw new AppError('Application deadline for this job has passed', 400);
  }

  // 5. Evaluate Eligibility Engine (Backend Enforcement)
  const eligibilityResult = evaluateEligibility(student, job);
  if (!eligibilityResult.eligible) {
    const mainReason = eligibilityResult.reasons[0] || 'You are not eligible for this job posting';
    const error = new AppError(`Not Eligible: ${mainReason}`, 400);
    error.reasons = eligibilityResult.reasons;
    throw error;
  }

  // 6. Fetch Active Resume from Resume collection
  let activeResume = null;
  if (isConnected()) {
    activeResume = await Resume.findOne({ studentId: student._id, isActive: true });
  }

  const studentIdStr = (student._id || student.id).toString();
  const jobIdStr = (job._id || job.id).toString();
  const companyIdStr = (job.companyId._id || job.companyId || job.companyId.id).toString();

  // Prepare Resume Snapshot
  const resumeSnapshot = {
    url: activeResume ? activeResume.secureUrl : (student.portfolio || 'https://example.com/resume.pdf'),
    fileName: activeResume ? (activeResume.fileName || activeResume.originalFileName || 'resume.pdf') : 'resume.pdf',
    resumeId: activeResume ? activeResume._id : null,
    version: activeResume ? (activeResume.version || 1) : 1,
  };

  const cleanCoverLetter = coverLetter ? String(coverLetter).trim() : '';

  if (isConnected()) {
    // DB Mode: Check duplicate application
    const existingApp = await Application.findOne({
      studentId: student._id,
      jobId: job._id || jobId,
    });

    if (existingApp) {
      throw new AppError('You have already applied to this job', 409);
    }

    try {
      const application = await Application.create({
        studentId: student._id,
        jobId: job._id || jobId,
        companyId: job.companyId._id || job.companyId,
        resumeSnapshot,
        coverLetter: cleanCoverLetter,
        status: 'APPLIED',
        appliedAt: new Date(),
      });

      // Log Application Activity
      await activityService.createActivity({
        applicationId: application._id,
        actorId: userId,
        action: 'APPLICATION_SUBMITTED',
        description: 'Application submitted',
        metadata: { jobTitle: job.title },
      });

      // Dispatch Notification to Company Recruiter User
      try {
        const companyObj = await Company.findById(job.companyId._id || job.companyId);
        if (companyObj && companyObj.userId) {
          await notificationService.createNotification({
            recipientId: companyObj.userId,
            type: 'APPLICATION_SUBMITTED',
            title: 'New Application Received',
            message: `A candidate has applied for ${job.title}.`,
            entityType: 'Application',
            entityId: application._id,
            metadata: { jobTitle: job.title },
          });
        }
      } catch (notifErr) {
        console.error('Failed to send company application notification:', notifErr.message);
      }

      return application;
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError('You have already applied to this job', 409);
      }
      throw err;
    }
  } else {
    // Memory Mode
    const memoryKey = `${studentIdStr}_${jobIdStr}`;
    for (const app of memoryApplications.values()) {
      if (app.studentId.toString() === studentIdStr && app.jobId.toString() === jobIdStr) {
        throw new AppError('You have already applied to this job', 409);
      }
    }

    const appMemId = 'mem_app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newApp = {
      id: appMemId,
      _id: appMemId,
      studentId: student._id || student.id,
      jobId: job._id || job.id,
      companyId: job.companyId._id || job.companyId,
      resumeSnapshot,
      coverLetter: cleanCoverLetter,
      status: 'APPLIED',
      appliedAt: new Date(),
      reviewedAt: null,
      rejectionReason: '',
      companyNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryApplications.set(appMemId, newApp);
    return newApp;
  }
};

/**
 * Student: Get list of applications submitted by student
 */
const getStudentApplications = async (userId, queryParams = {}) => {
  const student = await studentService.getProfileByUserId(userId);
  if (!student) {
    return {
      applications: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const studentIdStr = (student._id || student.id).toString();

  if (isConnected()) {
    const total = await Application.countDocuments({ studentId: student._id });
    const apps = await Application.find({ studentId: student._id })
      .populate({
        path: 'jobId',
        select: 'title location jobType workMode salary status applicationDeadline companyId',
        populate: {
          path: 'companyId',
          select: 'companyName logo website location',
        },
      })
      .populate('companyId', 'companyName logo website location')
      .select('-companyNotes')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      applications: apps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    // Memory Mode
    const userApps = [];
    for (const app of memoryApplications.values()) {
      if (app.studentId.toString() === studentIdStr) {
        const { companyNotes, ...safeApp } = app;
        userApps.push(safeApp);
      }
    }
    userApps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    const total = userApps.length;
    const paginated = userApps.slice(skip, skip + limit);

    return {
      applications: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
};

/**
 * Student: Get single application details
 */
const getStudentApplicationById = async (userId, applicationId) => {
  const student = await studentService.getProfileByUserId(userId);
  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  const studentIdStr = (student._id || student.id).toString();

  if (isConnected()) {
    const application = await Application.findById(applicationId)
      .populate({
        path: 'jobId',
        select: 'title description jobType workMode location salary applicationDeadline status eligibility skills',
        populate: {
          path: 'companyId',
          select: 'companyName logo website location description industry',
        },
      })
      .populate('companyId', 'companyName logo website location description industry')
      .select('-companyNotes');

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.studentId.toString() !== studentIdStr) {
      throw new AppError('You are not authorized to view this application', 403);
    }

    return application;
  } else {
    const app = memoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404);
    }

    if (app.studentId.toString() !== studentIdStr) {
      throw new AppError('You are not authorized to view this application', 403);
    }

    const { companyNotes, ...safeApp } = app;
    return safeApp;
  }
};

/**
 * Student: Withdraw an application (Only allowed when APPLIED)
 */
const withdrawApplication = async (userId, applicationId) => {
  const student = await studentService.getProfileByUserId(userId);
  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  const studentIdStr = (student._id || student.id).toString();

  if (isConnected()) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.studentId.toString() !== studentIdStr) {
      throw new AppError('You are not authorized to withdraw this application', 403);
    }

    if (application.status !== 'APPLIED') {
      throw new AppError(
        `Application cannot be withdrawn from its current status (${application.status})`,
        400
      );
    }

    application.status = 'WITHDRAWN';
    await application.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: application._id,
      actorId: userId,
      action: 'APPLICATION_WITHDRAWN',
      description: 'Application withdrawn by candidate',
      metadata: {},
    });

    // Dispatch Notification to Company Recruiter User
    try {
      const companyObj = await Company.findById(application.companyId);
      const jobObj = await Job.findById(application.jobId);
      if (companyObj && companyObj.userId) {
        await notificationService.createNotification({
          recipientId: companyObj.userId,
          type: 'APPLICATION_WITHDRAWN',
          title: 'Application Withdrawn',
          message: `A candidate has withdrawn their application for ${jobObj?.title || 'a job posting'}.`,
          entityType: 'Application',
          entityId: application._id,
          metadata: { jobTitle: jobObj?.title },
        });
      }
    } catch (notifErr) {
      console.error('Failed to send application withdrawn notification:', notifErr.message);
    }

    return application;
  } else {
    const app = memoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404);
    }

    if (app.studentId.toString() !== studentIdStr) {
      throw new AppError('You are not authorized to withdraw this application', 403);
    }

    if (app.status !== 'APPLIED') {
      throw new AppError(
        `Application cannot be withdrawn from its current status (${app.status})`,
        400
      );
    }

    app.status = 'WITHDRAWN';
    app.updatedAt = new Date();
    memoryApplications.set(applicationId, app);
    return app;
  }
};

/**
 * Company: Get applications for company's jobs with filters & pagination
 */
const getCompanyApplications = async (userId, queryParams = {}) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found. Please complete your profile first.', 404);
  }

  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const companyIdStr = (company._id || company.id).toString();

  if (isConnected()) {
    const filter = { companyId: company._id };

    if (queryParams.status && ['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'].includes(queryParams.status)) {
      filter.status = queryParams.status;
    }

    if (queryParams.jobId) {
      filter.jobId = queryParams.jobId;
    }

    const total = await Application.countDocuments(filter);

    let appsQuery = Application.find(filter)
      .populate({
        path: 'studentId',
        select: 'userId phone college degree branch graduationYear cgpa backlogs skills resume placementStatus',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .populate('jobId', 'title jobType workMode location status applicationDeadline')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    let apps = await appsQuery;

    // Search filter by student name or college if search param is provided
    if (queryParams.search && queryParams.search.trim() !== '') {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i');
      apps = apps.filter((app) => {
        const student = app.studentId;
        const userName = student?.userId?.name || '';
        const college = student?.college || '';
        const branch = student?.branch || '';
        return searchRegex.test(userName) || searchRegex.test(college) || searchRegex.test(branch);
      });
    }

    return {
      applications: apps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    // Memory mode
    let compApps = [];
    for (const app of memoryApplications.values()) {
      if (app.companyId.toString() === companyIdStr) {
        if (queryParams.status && app.status !== queryParams.status) continue;
        if (queryParams.jobId && app.jobId.toString() !== queryParams.jobId.toString()) continue;
        compApps.push(app);
      }
    }

    compApps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    const total = compApps.length;
    const paginated = compApps.slice(skip, skip + limit);

    return {
      applications: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
};

/**
 * Company: Get candidate & application details
 */
const getCompanyApplicationById = async (userId, applicationId) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  const companyIdStr = (company._id || company.id).toString();

  if (isConnected()) {
    const application = await Application.findById(applicationId)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .populate('jobId', 'title description jobType workMode location salary status applicationDeadline');

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to view this application', 403);
    }

    const appObj = application.toObject();
    appObj.candidate = formatCandidateDTO(application.studentId, application.studentId?.userId);

    return appObj;
  } else {
    const app = memoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404);
    }

    if (app.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to view this application', 403);
    }

    return app;
  }
};

/**
 * Company: Shortlist applicant (APPLIED -> SHORTLISTED)
 */
const shortlistApplication = async (userId, applicationId) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  const companyIdStr = (company._id || company.id).toString();

  if (isConnected()) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to modify this application', 403);
    }

    if (application.status !== 'APPLIED') {
      throw new AppError(
        `Application cannot be shortlisted from its current status (${application.status})`,
        400
      );
    }

    application.status = 'SHORTLISTED';
    application.reviewedAt = new Date();
    await application.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: application._id,
      actorId: userId,
      action: 'APPLICATION_SHORTLISTED',
      description: 'Application shortlisted by employer',
      metadata: {},
    });

    // Dispatch Notification to Student User
    try {
      const studentObj = await Student.findById(application.studentId);
      const jobObj = await Job.findById(application.jobId);
      if (studentObj && studentObj.userId) {
        await notificationService.createNotification({
          recipientId: studentObj.userId,
          type: 'APPLICATION_SHORTLISTED',
          title: 'Application Shortlisted',
          message: `Your application for ${jobObj?.title || 'the position'} has been shortlisted!`,
          entityType: 'Application',
          entityId: application._id,
          metadata: { jobTitle: jobObj?.title },
        });
      }
    } catch (notifErr) {
      console.error('Failed to send student shortlist notification:', notifErr.message);
    }

    return application;
  } else {
    const app = memoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404);
    }

    if (app.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to modify this application', 403);
    }

    if (app.status !== 'APPLIED') {
      throw new AppError(
        `Application cannot be shortlisted from its current status (${app.status})`,
        400
      );
    }

    app.status = 'SHORTLISTED';
    app.reviewedAt = new Date();
    app.updatedAt = new Date();
    memoryApplications.set(applicationId, app);

    return app;
  }
};

/**
 * Company: Reject applicant (APPLIED -> REJECTED)
 */
const rejectApplication = async (userId, applicationId, { reason, companyNotes } = {}) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  const companyIdStr = (company._id || company.id).toString();

  if (isConnected()) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to modify this application', 403);
    }

    if (application.status !== 'APPLIED') {
      throw new AppError(
        `Application cannot be rejected from its current status (${application.status})`,
        400
      );
    }

    application.status = 'REJECTED';
    if (reason !== undefined) {
      application.rejectionReason = String(reason).trim();
    }
    if (companyNotes !== undefined) {
      application.companyNotes = String(companyNotes).trim();
    }
    application.reviewedAt = new Date();
    await application.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: application._id,
      actorId: userId,
      action: 'APPLICATION_REJECTED',
      description: 'Application update: status marked as REJECTED',
      metadata: { reason: application.rejectionReason },
    });

    // Dispatch Notification to Student User (EXCLUDING internal recruiter notes!)
    try {
      const studentObj = await Student.findById(application.studentId);
      const jobObj = await Job.findById(application.jobId);
      if (studentObj && studentObj.userId) {
        await notificationService.createNotification({
          recipientId: studentObj.userId,
          type: 'APPLICATION_REJECTED',
          title: 'Application Update',
          message: `Your application for ${jobObj?.title || 'the position'} was not selected for the next stage.`,
          entityType: 'Application',
          entityId: application._id,
          metadata: {
            jobTitle: jobObj?.title,
            rejectionReason: application.rejectionReason || null,
          },
        });
      }
    } catch (notifErr) {
      console.error('Failed to send student rejection notification:', notifErr.message);
    }

    return application;
  } else {
    const app = memoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404);
    }

    if (app.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to modify this application', 403);
    }

    if (app.status !== 'APPLIED') {
      throw new AppError(
        `Application cannot be rejected from its current status (${app.status})`,
        400
      );
    }

    app.status = 'REJECTED';
    if (reason !== undefined) app.rejectionReason = String(reason).trim();
    if (companyNotes !== undefined) app.companyNotes = String(companyNotes).trim();
    app.reviewedAt = new Date();
    app.updatedAt = new Date();
    memoryApplications.set(applicationId, app);

    return app;
  }
};

/**
 * Company: Update private company notes
 */
const updateCompanyNotes = async (userId, applicationId, { companyNotes }) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  const companyIdStr = (company._id || company.id).toString();

  if (isConnected()) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to modify this application', 403);
    }

    application.companyNotes = String(companyNotes || '').trim();
    await application.save();

    return application;
  } else {
    const app = memoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404);
    }

    if (app.companyId.toString() !== companyIdStr) {
      throw new AppError('You are not authorized to modify this application', 403);
    }

    app.companyNotes = String(companyNotes || '').trim();
    app.updatedAt = new Date();
    memoryApplications.set(applicationId, app);

    return app;
  }
};

module.exports = {
  createApplication,
  getStudentApplications,
  getStudentApplicationById,
  withdrawApplication,
  getCompanyApplications,
  getCompanyApplicationById,
  shortlistApplication,
  rejectApplication,
  updateCompanyNotes,
};
