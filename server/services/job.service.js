const Job = require('../models/Job');
const Student = require('../models/Student');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');
const { evaluateEligibility } = require('./eligibility.service');
const notificationService = require('./notification.service');

// In-memory fallback storage for Jobs when offline
const memoryJobs = new Map();

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  const unique = new Set(skills.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()));
  return Array.from(unique);
};

const validateJobData = (data) => {
  if (data.salary) {
    if (data.salary.min < 0 || data.salary.max < 0) {
      throw new AppError('Salary values cannot be negative', 400);
    }
    if (data.salary.max < data.salary.min) {
      throw new AppError('Maximum salary cannot be less than minimum salary', 400);
    }
  }

  if (data.experienceRequired) {
    if (data.experienceRequired.minYears < 0 || data.experienceRequired.maxYears < 0) {
      throw new AppError('Experience values cannot be negative', 400);
    }
    if (data.experienceRequired.maxYears < data.experienceRequired.minYears) {
      throw new AppError('Maximum experience cannot be less than minimum experience', 400);
    }
  }

  if (data.openings !== undefined && (data.openings < 1 || !Number.isInteger(data.openings))) {
    throw new AppError('Openings must be a positive integer', 400);
  }
};

const createJob = async (companyId, data) => {
  const companyIdStr = companyId.toString();
  validateJobData(data);

  if (!data.title || !data.description || !data.jobType || !data.workMode || !data.applicationDeadline || !data.openings) {
    throw new AppError('Please provide title, description, jobType, workMode, applicationDeadline, and openings', 400);
  }

  const requestedStatus = data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
  const deadlineDate = new Date(data.applicationDeadline);

  if (isNaN(deadlineDate.getTime())) {
    throw new AppError('Invalid application deadline date format', 400);
  }

  if (requestedStatus === 'PUBLISHED' && deadlineDate < new Date()) {
    throw new AppError('Application deadline must be in the future to publish a job', 400);
  }

  const cleanedSkills = normalizeSkills(data.skills);
  const cleanedReqSkills = data.eligibility ? normalizeSkills(data.eligibility.requiredSkills) : [];

  const jobPayload = {
    ...data,
    companyId: isConnected() ? companyId : companyIdStr,
    skills: cleanedSkills,
    eligibility: {
      ...(data.eligibility || {}),
      requiredSkills: cleanedReqSkills,
    },
    status: requestedStatus,
    publishedAt: requestedStatus === 'PUBLISHED' ? new Date() : undefined,
  };

  if (isConnected()) {
    const job = await Job.create(jobPayload);
    return job;
  } else {
    const id = 'mem_job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const memoryJob = {
      id,
      _id: id,
      ...jobPayload,
      companyId: companyIdStr,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryJobs.set(id, memoryJob);
    return memoryJob;
  }
};

const getCompanyJobs = async (companyId) => {
  const companyIdStr = companyId.toString();
  if (isConnected()) {
    return await Job.find({ companyId }).sort({ createdAt: -1 });
  } else {
    const jobs = Array.from(memoryJobs.values()).filter(
      (j) => j.companyId.toString() === companyIdStr
    );
    return jobs.sort((a, b) => b.createdAt - a.createdAt);
  }
};

const getJobByIdForCompany = async (companyId, jobId) => {
  const companyIdStr = companyId.toString();
  let job;

  if (isConnected()) {
    job = await Job.findById(jobId);
  } else {
    job = memoryJobs.get(jobId.toString());
  }

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const jobCompanyId = (job.companyId._id || job.companyId).toString();
  if (jobCompanyId !== companyIdStr) {
    throw new AppError('You do not have permission to manage this job', 403);
  }

  return job;
};

const updateJob = async (companyId, jobId, data) => {
  const job = await getJobByIdForCompany(companyId, jobId);
  validateJobData(data);

  delete data.companyId;

  if (data.skills) data.skills = normalizeSkills(data.skills);
  if (data.eligibility && data.eligibility.requiredSkills) {
    data.eligibility.requiredSkills = normalizeSkills(data.eligibility.requiredSkills);
  }

  if (data.status === 'PUBLISHED' && job.status !== 'PUBLISHED') {
    const deadline = new Date(data.applicationDeadline || job.applicationDeadline);
    if (deadline < new Date()) {
      throw new AppError('Cannot publish job with a past application deadline', 400);
    }
    data.publishedAt = new Date();
  }

  if (isConnected()) {
    return await Job.findByIdAndUpdate(jobId, { $set: data }, { new: true, runValidators: true });
  } else {
    const updated = {
      ...job,
      ...data,
      updatedAt: new Date(),
    };
    memoryJobs.set(jobId.toString(), updated);
    return updated;
  }
};

const deleteJob = async (companyId, jobId) => {
  const job = await getJobByIdForCompany(companyId, jobId);
  if (isConnected()) {
    await Job.findByIdAndDelete(jobId);
  } else {
    memoryJobs.delete(jobId.toString());
  }
  return true;
};

const publishJob = async (companyId, jobId) => {
  const job = await getJobByIdForCompany(companyId, jobId);

  if (job.status === 'PUBLISHED') {
    throw new AppError('Job is already published', 400);
  }

  const deadlineDate = new Date(job.applicationDeadline);
  if (deadlineDate < new Date()) {
    throw new AppError('Cannot publish job. Application deadline has passed', 400);
  }

  const updatedJob = await updateJob(companyId, jobId, {
    status: 'PUBLISHED',
    publishedAt: new Date(),
  });

  // Batch notify eligible students using existing eligibility engine
  try {
    let students = [];
    if (isConnected()) {
      students = await Student.find({}).select('_id userId cgpa backlogs branch graduationYear skills');
    }

    const notificationsToCreate = [];
    for (const student of students) {
      if (!student.userId) continue;
      const eligibilityResult = evaluateEligibility(student, updatedJob);
      if (eligibilityResult.eligible) {
        notificationsToCreate.push({
          recipientId: student.userId,
          type: 'JOB_PUBLISHED',
          title: 'New Job Opening Published',
          message: `A new job "${updatedJob.title}" matching your eligibility profile is open for applications.`,
          entityType: 'Job',
          entityId: updatedJob._id || updatedJob.id,
          metadata: { jobTitle: updatedJob.title },
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await notificationService.createBulkNotifications(notificationsToCreate);
    }
  } catch (notifErr) {
    console.error('Failed to dispatch job published notifications:', notifErr.message);
  }

  return updatedJob;
};

const closeJob = async (companyId, jobId) => {
  const job = await getJobByIdForCompany(companyId, jobId);

  if (job.status === 'CLOSED') {
    throw new AppError('Job is already closed', 400);
  }

  return await updateJob(companyId, jobId, {
    status: 'CLOSED',
  });
};

const getPublishedJobs = async (queryParams = {}) => {
  const {
    search,
    jobType,
    workMode,
    location,
    minSalary,
    maxSalary,
    skills,
    page = 1,
    limit = 10,
  } = queryParams;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const now = new Date();

  if (isConnected()) {
    const filter = {
      status: 'PUBLISHED',
      applicationDeadline: { $gte: now },
    };

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { skills: regex }];
    }

    if (jobType) filter.jobType = jobType;
    if (workMode) filter.workMode = workMode;
    if (location) filter.location = new RegExp(location.trim(), 'i');

    if (minSalary || maxSalary) {
      filter['salary.max'] = {};
      if (minSalary) filter['salary.max'].$gte = Number(minSalary);
      if (maxSalary) filter['salary.min'] = { $lte: Number(maxSalary) };
    }

    if (skills) {
      const skillArr = skills.split(',').map((s) => s.trim());
      filter.skills = { $in: skillArr.map((s) => new RegExp(s, 'i')) };
    }

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('companyId', 'companyName logo industry location website')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    return {
      jobs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };
  } else {
    // In-memory filter logic
    let jobs = Array.from(memoryJobs.values()).filter((j) => {
      if (j.status !== 'PUBLISHED') return false;
      if (new Date(j.applicationDeadline) < now) return false;
      return true;
    });

    if (search) {
      const q = search.toLowerCase().trim();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          (j.skills && j.skills.some((s) => s.toLowerCase().includes(q)))
      );
    }

    if (jobType) jobs = jobs.filter((j) => j.jobType === jobType);
    if (workMode) jobs = jobs.filter((j) => j.workMode === workMode);

    const total = jobs.length;
    const paginatedJobs = jobs.slice(skip, skip + parsedLimit);

    return {
      jobs: paginatedJobs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit) || 1,
      },
    };
  }
};

const getPublishedJobById = async (jobId, studentProfile) => {
  let job;
  if (isConnected()) {
    job = await Job.findOne({ _id: jobId, status: 'PUBLISHED' }).populate(
      'companyId',
      'companyName logo description industry website location companySize'
    );
  } else {
    const raw = memoryJobs.get(jobId.toString());
    if (raw && raw.status === 'PUBLISHED') {
      job = raw;
    }
  }

  if (!job) {
    throw new AppError('Job opportunity not found or no longer active', 404);
  }

  const eligibility = evaluateEligibility(studentProfile, job);

  return {
    job,
    eligibility,
  };
};

module.exports = {
  createJob,
  getCompanyJobs,
  getJobByIdForCompany,
  updateJob,
  deleteJob,
  publishJob,
  closeJob,
  getPublishedJobs,
  getPublishedJobById,
};
