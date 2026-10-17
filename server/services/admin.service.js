const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const PlacementDrive = require('../models/PlacementDrive');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');
const auditLogService = require('./auditLog.service');
const notificationService = require('./notification.service');

/**
 * Get placement dashboard summary metrics
 */
const getDashboardMetrics = async () => {
  if (isConnected()) {
    const [
      totalStudents,
      activeStudents,
      totalCompanies,
      pendingCompanies,
      verifiedCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      shortlistedApps,
      upcomingInterviews,
      completedInterviews,
      totalDrives,
    ] = await Promise.all([
      Student.countDocuments(),
      User.countDocuments({ role: 'STUDENT', isActive: true }),
      Company.countDocuments(),
      Company.countDocuments({ verificationStatus: 'PENDING' }),
      Company.countDocuments({ verificationStatus: 'VERIFIED' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'PUBLISHED' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'SHORTLISTED' }),
      Interview.countDocuments({ status: { $in: ['SCHEDULED', 'CONFIRMED'] }, scheduledAt: { $gte: new Date() } }),
      Interview.countDocuments({ status: 'COMPLETED' }),
      PlacementDrive.countDocuments(),
    ]);

    // Calculate unique placed candidates (passed interview evaluation or shortlisted application)
    const placedStudents = shortlistedApps;

    return {
      students: { total: totalStudents, active: activeStudents },
      companies: { total: totalCompanies, pending: pendingCompanies, verified: verifiedCompanies },
      jobs: { total: totalJobs, active: activeJobs },
      applications: { total: totalApplications, shortlisted: shortlistedApps },
      interviews: { upcoming: upcomingInterviews, completed: completedInterviews },
      drives: { total: totalDrives },
      placedStudents,
    };
  } else {
    // Memory Mode fallback
    return {
      students: { total: 0, active: 0 },
      companies: { total: 0, pending: 0, verified: 0 },
      jobs: { total: 0, active: 0 },
      applications: { total: 0, shortlisted: 0 },
      interviews: { upcoming: 0, completed: 0 },
      drives: { total: 0 },
      placedStudents: 0,
    };
  }
};

/**
 * Admin: Get Paginated Student Directory
 */
const getStudents = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 15));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const studentFilter = {};

    if (queryParams.course) {
      studentFilter.course = queryParams.course;
    }
    if (queryParams.graduationYear) {
      studentFilter.graduationYear = Number(queryParams.graduationYear);
    }

    let userIdsMatch = null;
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search, 'i');
      const matchingUsers = await User.find({
        role: 'STUDENT',
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      userIdsMatch = matchingUsers.map((u) => u._id);

      studentFilter.$or = [
        { userId: { $in: userIdsMatch } },
        { rollNumber: searchRegex },
        { branch: searchRegex },
      ];
    }

    const total = await Student.countDocuments(studentFilter);
    const students = await Student.find(studentFilter)
      .populate('userId', 'name email role isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    return { students: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
};

/**
 * Admin: Get Detailed Student Overview
 */
const getStudentById = async (studentId) => {
  if (isConnected()) {
    const student = await Student.findById(studentId).populate('userId', 'name email role isActive createdAt');
    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const [applications, interviews] = await Promise.all([
      Application.find({ studentId: student._id }).populate('jobId', 'title companyId').sort({ createdAt: -1 }),
      Interview.find({ studentId: student._id }).sort({ scheduledAt: -1 }),
    ]);

    return {
      student,
      applications,
      interviews,
    };
  } else {
    throw new AppError('Student profile not found', 404);
  }
};

/**
 * Admin: Toggle Student Active Status
 */
const toggleStudentStatus = async (adminUser, studentId, isActive) => {
  if (isConnected()) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const user = await User.findById(student.userId);
    if (!user) {
      throw new AppError('Associated user record not found', 404);
    }

    user.isActive = Boolean(isActive);
    await user.save();

    const actionName = user.isActive ? 'STUDENT_ACTIVATED' : 'STUDENT_DEACTIVATED';

    await auditLogService.createAuditLog({
      actorId: adminUser.id || adminUser._id,
      actorRole: adminUser.role,
      action: actionName,
      entityType: 'STUDENT',
      entityId: student._id,
      description: `Student account ${user.name} (${user.email}) ${user.isActive ? 'activated' : 'deactivated'}`,
      metadata: { isActive: user.isActive },
    });

    return { student, user };
  } else {
    throw new AppError('Student not found', 404);
  }
};

/**
 * Admin: Get Paginated Company Directory
 */
const getCompanies = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 15));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const companyFilter = {};

    if (queryParams.verificationStatus) {
      companyFilter.verificationStatus = queryParams.verificationStatus;
    }

    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search, 'i');
      companyFilter.$or = [
        { companyName: searchRegex },
        { contactEmail: searchRegex },
        { industry: searchRegex },
      ];
    }

    const total = await Company.countDocuments(companyFilter);
    const companies = await Company.find(companyFilter)
      .populate('userId', 'name email role isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    return { companies: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
};

/**
 * Admin: Verify or Reject Company Credentials
 */
const verifyCompany = async (adminUser, companyId, verificationStatus) => {
  if (!['VERIFIED', 'REJECTED'].includes(verificationStatus)) {
    throw new AppError('Verification status must be VERIFIED or REJECTED', 400);
  }

  if (isConnected()) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    company.verificationStatus = verificationStatus;
    await company.save();

    const actionName = verificationStatus === 'VERIFIED' ? 'COMPANY_VERIFIED' : 'COMPANY_REJECTED';

    // Create Audit Log
    await auditLogService.createAuditLog({
      actorId: adminUser.id || adminUser._id,
      actorRole: adminUser.role,
      action: actionName,
      entityType: 'COMPANY',
      entityId: company._id,
      description: `Company ${company.companyName} verification status updated to ${verificationStatus}`,
      metadata: { verificationStatus },
    });

    // Notify Recruiter User
    if (company.userId) {
      await notificationService.createNotification({
        recipientId: company.userId,
        type: 'JOB_PUBLISHED', // Central alert trigger
        title: `Company Profile ${verificationStatus}`,
        message: `Your company profile for ${company.companyName} has been ${verificationStatus.toLowerCase()} by placement administration.`,
        entityType: 'JOB',
        entityId: company._id,
        metadata: { verificationStatus },
      });
    }

    return company;
  } else {
    throw new AppError('Company not found', 404);
  }
};

/**
 * Admin: Monitor All Job Postings
 */
const getJobs = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 15));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const jobFilter = {};
    if (queryParams.status) jobFilter.status = queryParams.status;
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search, 'i');
      jobFilter.$or = [{ title: searchRegex }, { location: searchRegex }];
    }

    const total = await Job.countDocuments(jobFilter);
    const jobs = await Job.find(jobFilter)
      .populate('companyId', 'companyName logo verificationStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    return { jobs: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
};

/**
 * Admin: Monitor Placement Applications Pipeline
 */
const getApplications = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 15));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const filter = {};
    if (queryParams.status) filter.status = queryParams.status;

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .populate('jobId', 'title location companyId')
      .populate('companyId', 'companyName')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    return { applications: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
};

/**
 * Admin: Monitor Global Interviews Pipeline
 */
const getInterviews = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 15));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const filter = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.result) filter.result = queryParams.result;

    const total = await Interview.countDocuments(filter);
    const interviews = await Interview.find(filter)
      .populate('jobId', 'title location')
      .populate('companyId', 'companyName')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      interviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    return { interviews: [], pagination: { page, limit, total: 0, totalPages: 0 } };
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
};
