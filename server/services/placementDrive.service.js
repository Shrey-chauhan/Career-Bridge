const PlacementDrive = require('../models/PlacementDrive');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');
const auditLogService = require('./auditLog.service');

// In-memory fallback
const memoryDrives = new Map();

/**
 * Create a new Campus Placement Drive
 */
const createDrive = async (user, data) => {
  const {
    name,
    description,
    companyId,
    jobIds,
    startDate,
    endDate,
    location,
    eligibleCourses,
    eligibleGraduationYears,
  } = data;

  if (!name || !companyId || !startDate || !endDate) {
    throw new AppError('Placement drive name, company, start date, and end date are required', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid placement drive start or end date format', 400);
  }

  if (end < start) {
    throw new AppError('End date cannot be prior to start date', 400);
  }

  if (isConnected()) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new AppError('Associated company not found', 404);
    }

    const drive = await PlacementDrive.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      companyId,
      jobIds: Array.isArray(jobIds) ? jobIds : [],
      startDate: start,
      endDate: end,
      location: location ? location.trim() : 'College Campus',
      status: 'UPCOMING',
      eligibleCourses: Array.isArray(eligibleCourses) ? eligibleCourses : [],
      eligibleGraduationYears: Array.isArray(eligibleGraduationYears) ? eligibleGraduationYears : [],
      createdBy: user.id || user._id,
    });

    await auditLogService.createAuditLog({
      actorId: user.id || user._id,
      actorRole: user.role,
      action: 'DRIVE_CREATED',
      entityType: 'DRIVE',
      entityId: drive._id,
      description: `Campus placement drive '${drive.name}' created for ${company.companyName}`,
      metadata: { companyId, startDate: start, endDate: end },
    });

    return drive;
  } else {
    const memId = 'mem_drive_' + Date.now();
    const drive = {
      id: memId,
      _id: memId,
      name: name.trim(),
      description: description || '',
      companyId: companyId.toString(),
      jobIds: Array.isArray(jobIds) ? jobIds : [],
      startDate: start,
      endDate: end,
      location: location || 'College Campus',
      status: 'UPCOMING',
      eligibleCourses: eligibleCourses || [],
      eligibleGraduationYears: eligibleGraduationYears || [],
      createdBy: (user.id || user._id).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryDrives.set(memId, drive);
    return drive;
  }
};

/**
 * Get paginated list of Placement Drives
 */
const getDrives = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const filter = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.companyId) filter.companyId = queryParams.companyId;

    if (queryParams.search) {
      filter.name = new RegExp(queryParams.search, 'i');
    }

    const total = await PlacementDrive.countDocuments(filter);
    const drives = await PlacementDrive.find(filter)
      .populate('companyId', 'companyName logo location industry verificationStatus')
      .populate('jobIds', 'title status location workMode')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    return {
      drives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    let list = Array.from(memoryDrives.values());
    if (queryParams.status) list = list.filter((d) => d.status === queryParams.status);
    const total = list.length;
    const paginated = list.slice(skip, skip + limit);
    return {
      drives: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
  }
};

/**
 * Get single Placement Drive by ID with calculated metrics
 */
const getDriveById = async (driveId) => {
  if (isConnected()) {
    const drive = await PlacementDrive.findById(driveId)
      .populate('companyId', 'companyName logo location website industry contactEmail')
      .populate('jobIds', 'title status jobType location workMode salary');

    if (!drive) {
      throw new AppError('Placement drive not found', 404);
    }

    // Calculate aggregated drive performance metrics from associated jobs
    const jobObjectIds = drive.jobIds.map((j) => j._id);
    let appMetrics = { totalApps: 0, shortlistedApps: 0 };
    let intMetrics = { totalInterviews: 0, completedInterviews: 0 };

    if (jobObjectIds.length > 0) {
      const [totalApps, shortlistedApps, totalInterviews, completedInterviews] = await Promise.all([
        Application.countDocuments({ jobId: { $in: jobObjectIds } }),
        Application.countDocuments({ jobId: { $in: jobObjectIds }, status: 'SHORTLISTED' }),
        Interview.countDocuments({ jobId: { $in: jobObjectIds } }),
        Interview.countDocuments({ jobId: { $in: jobObjectIds }, status: 'COMPLETED' }),
      ]);
      appMetrics = { totalApps, shortlistedApps };
      intMetrics = { totalInterviews, completedInterviews };
    }

    return {
      drive,
      metrics: {
        associatedJobs: drive.jobIds.length,
        ...appMetrics,
        ...intMetrics,
      },
    };
  } else {
    const drive = memoryDrives.get(driveId);
    if (!drive) throw new AppError('Placement drive not found', 404);
    return { drive, metrics: { associatedJobs: (drive.jobIds || []).length, totalApps: 0, shortlistedApps: 0, totalInterviews: 0, completedInterviews: 0 } };
  }
};

/**
 * Update Placement Drive & Status Lifecycle
 */
const updateDrive = async (driveId, user, data) => {
  if (isConnected()) {
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) {
      throw new AppError('Placement drive not found', 404);
    }

    const { name, description, startDate, endDate, location, status, eligibleCourses, eligibleGraduationYears } = data;

    if (status && ['DRAFT', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      drive.status = status;
    }

    if (name) drive.name = name.trim();
    if (description !== undefined) drive.description = description.trim();
    if (location) drive.location = location.trim();
    if (startDate) drive.startDate = new Date(startDate);
    if (endDate) drive.endDate = new Date(endDate);
    if (Array.isArray(eligibleCourses)) drive.eligibleCourses = eligibleCourses;
    if (Array.isArray(eligibleGraduationYears)) drive.eligibleGraduationYears = eligibleGraduationYears;

    await drive.save();

    await auditLogService.createAuditLog({
      actorId: user.id || user._id,
      actorRole: user.role,
      action: status === 'CANCELLED' ? 'DRIVE_CANCELLED' : 'DRIVE_UPDATED',
      entityType: 'DRIVE',
      entityId: drive._id,
      description: `Placement drive '${drive.name}' updated (Status: ${drive.status})`,
      metadata: { status: drive.status },
    });

    return drive;
  } else {
    const drive = memoryDrives.get(driveId);
    if (!drive) throw new AppError('Placement drive not found', 404);
    if (data.status) drive.status = data.status;
    drive.updatedAt = new Date();
    memoryDrives.set(driveId, drive);
    return drive;
  }
};

/**
 * Associate Jobs to Placement Drive
 */
const associateJobsToDrive = async (driveId, user, jobIds = []) => {
  if (!Array.isArray(jobIds)) {
    throw new AppError('Job IDs must be an array of ObjectIDs', 400);
  }

  if (isConnected()) {
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) {
      throw new AppError('Placement drive not found', 404);
    }

    drive.jobIds = jobIds;
    await drive.save();

    await auditLogService.createAuditLog({
      actorId: user.id || user._id,
      actorRole: user.role,
      action: 'DRIVE_UPDATED',
      entityType: 'DRIVE',
      entityId: drive._id,
      description: `Associated ${jobIds.length} job(s) with placement drive '${drive.name}'`,
      metadata: { jobIds },
    });

    return drive;
  } else {
    const drive = memoryDrives.get(driveId);
    if (!drive) throw new AppError('Placement drive not found', 404);
    drive.jobIds = jobIds;
    memoryDrives.set(driveId, drive);
    return drive;
  }
};

module.exports = {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  associateJobsToDrive,
};
