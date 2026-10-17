const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Student = require('../models/Student');
const Company = require('../models/Company');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');
const studentService = require('./student.service');
const companyService = require('./company.service');
const notificationService = require('./notification.service');
const activityService = require('./activity.service');

// In-memory fallback storage for Interviews
const memoryInterviews = new Map();

/**
 * Format interview DTO to strip private recruiter feedback from student views
 */
const formatInterviewDTO = (interviewObj, isStudent = false) => {
  if (!interviewObj) return null;
  const dto = { ...interviewObj };
  if (isStudent) {
    delete dto.feedback; // Strictly protect internal recruiter evaluation from candidate view
  }
  return dto;
};

/**
 * Recruiter: Schedule an Interview for a shortlisted candidate
 */
const createInterview = async (userId, data) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  const companyId = company._id || company.id;
  const {
    applicationId,
    scheduledAt,
    duration,
    interviewType,
    meetingLink,
    location,
    interviewerName,
    interviewerEmail,
    roundName,
  } = data;

  if (!applicationId || !scheduledAt || !duration || !interviewType || !interviewerName || !interviewerEmail) {
    throw new AppError('Please provide all required interview scheduling fields', 400);
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new AppError('Invalid scheduled date/time format', 400);
  }

  if (scheduledDate <= new Date()) {
    throw new AppError('Scheduled interview time must be in the future', 400);
  }

  const parsedDuration = Number(duration);
  if (isNaN(parsedDuration) || parsedDuration < 15 || parsedDuration > 240) {
    throw new AppError('Interview duration must be between 15 and 240 minutes', 400);
  }

  if (interviewType === 'ONLINE' && (!meetingLink || !meetingLink.trim())) {
    throw new AppError('Meeting link is required for online interviews', 400);
  }

  if (interviewType === 'OFFLINE' && (!location || !location.trim())) {
    throw new AppError('Location address is required for offline interviews', 400);
  }

  let application, job, student;

  if (isConnected()) {
    application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.companyId.toString() !== companyId.toString()) {
      throw new AppError('You are not authorized to schedule an interview for this application', 403);
    }

    if (application.status !== 'SHORTLISTED') {
      throw new AppError(
        `Interviews can only be scheduled for shortlisted candidates (Current status: ${application.status})`,
        400
      );
    }

    job = await Job.findById(application.jobId);
    student = await Student.findById(application.studentId);

    // Prevent duplicate active interview for same application
    const existingActiveAppInterview = await Interview.findOne({
      applicationId: application._id,
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    });

    if (existingActiveAppInterview) {
      throw new AppError(
        'An active interview is already scheduled for this application. Reschedule or complete it first.',
        400
      );
    }

    // Candidate overlap conflict detection
    const endTime = new Date(scheduledDate.getTime() + parsedDuration * 60000);
    const overlappingInterview = await Interview.findOne({
      studentId: student._id,
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      scheduledAt: { $lt: endTime },
      $expr: {
        $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledDate],
      },
    });

    if (overlappingInterview) {
      throw new AppError('Candidate already has an overlapping interview scheduled at this time slot.', 409);
    }

    // Determine round number
    const existingRoundsCount = await Interview.countDocuments({ applicationId: application._id });
    const roundNumber = existingRoundsCount + 1;

    const newInterview = await Interview.create({
      applicationId: application._id,
      jobId: application.jobId,
      studentId: student._id,
      companyId: companyId,
      roundNumber,
      roundName: roundName && roundName.trim() ? roundName.trim() : `Round ${roundNumber} Interview`,
      scheduledAt: scheduledDate,
      duration: parsedDuration,
      interviewType,
      meetingLink: meetingLink ? meetingLink.trim() : '',
      location: location ? location.trim() : '',
      interviewerName: interviewerName.trim(),
      interviewerEmail: interviewerEmail.trim(),
      status: 'SCHEDULED',
      result: 'PENDING',
      createdBy: userId,
    });

    // Log Activity Event
    await activityService.createActivity({
      applicationId: application._id,
      actorId: userId,
      action: 'INTERVIEW_SCHEDULED',
      description: `${newInterview.roundName} scheduled for ${scheduledDate.toLocaleDateString()} ${scheduledDate.toLocaleTimeString()}`,
      metadata: { roundNumber, roundName: newInterview.roundName, scheduledAt: scheduledDate },
    });

    // Dispatch Notification to Student User
    if (student && student.userId) {
      await notificationService.createNotification({
        recipientId: student.userId,
        type: 'INTERVIEW_SCHEDULED',
        title: 'Interview Scheduled',
        message: `Your ${newInterview.roundName} for ${job?.title || 'the job'} is scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        entityType: 'Interview',
        entityId: newInterview._id,
        metadata: {
          jobTitle: job?.title,
          roundName: newInterview.roundName,
          scheduledAt: scheduledDate,
        },
      });
    }

    return newInterview;
  } else {
    // Memory Mode
    const memIntId = 'mem_int_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newInterview = {
      id: memIntId,
      _id: memIntId,
      applicationId: applicationId.toString(),
      jobId: data.jobId || 'mem_job',
      studentId: data.studentId || 'mem_student',
      companyId: companyId.toString(),
      roundNumber: 1,
      roundName: roundName || 'Round 1 Interview',
      scheduledAt: scheduledDate,
      duration: parsedDuration,
      interviewType,
      meetingLink: meetingLink || '',
      location: location || '',
      interviewerName: interviewerName.trim(),
      interviewerEmail: interviewerEmail.trim(),
      status: 'SCHEDULED',
      result: 'PENDING',
      feedback: '',
      createdBy: userId.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryInterviews.set(memIntId, newInterview);
    return newInterview;
  }
};

/**
 * Get Interview By ID with ownership guards
 */
const getInterviewById = async (userId, userRole, interviewId) => {
  if (isConnected()) {
    const interview = await Interview.findById(interviewId)
      .populate('jobId', 'title location workMode jobType')
      .populate('companyId', 'companyName logo location website industry')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (userRole === 'STUDENT') {
      const student = await studentService.getProfileByUserId(userId);
      if (!student || interview.studentId._id.toString() !== student._id.toString()) {
        throw new AppError('You are not authorized to view this interview', 403);
      }
      return formatInterviewDTO(interview.toObject(), true);
    } else if (userRole === 'COMPANY') {
      const company = await companyService.getProfileByUserId(userId);
      if (!company || interview.companyId._id.toString() !== company._id.toString()) {
        throw new AppError('You are not authorized to view this interview', 403);
      }
      return formatInterviewDTO(interview.toObject(), false);
    } else if (userRole === 'ADMIN') {
      return formatInterviewDTO(interview.toObject(), false);
    } else {
      throw new AppError('Unauthorized access', 403);
    }
  } else {
    const intObj = memoryInterviews.get(interviewId);
    if (!intObj) {
      throw new AppError('Interview not found', 404);
    }
    return formatInterviewDTO(intObj, userRole === 'STUDENT');
  }
};

/**
 * List Interviews for authenticated user (Student or Company)
 */
const getInterviews = async (userId, userRole, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const filter = {};

    if (userRole === 'STUDENT') {
      const student = await studentService.getProfileByUserId(userId);
      if (!student) return { interviews: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      filter.studentId = student._id;
    } else if (userRole === 'COMPANY') {
      const company = await companyService.getProfileByUserId(userId);
      if (!company) return { interviews: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      filter.companyId = company._id;
    }

    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    if (queryParams.applicationId) {
      filter.applicationId = queryParams.applicationId;
    }

    let sortOption = { scheduledAt: 1 };
    if (queryParams.timeframe === 'PAST') {
      filter.scheduledAt = { $lt: new Date() };
      sortOption = { scheduledAt: -1 };
    } else if (queryParams.timeframe === 'UPCOMING') {
      filter.scheduledAt = { $gte: new Date() };
      sortOption = { scheduledAt: 1 };
    }

    const total = await Interview.countDocuments(filter);
    const interviews = await Interview.find(filter)
      .populate('jobId', 'title location workMode jobType')
      .populate('companyId', 'companyName logo location website')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const formattedList = interviews.map((item) =>
      formatInterviewDTO(item.toObject(), userRole === 'STUDENT')
    );

    return {
      interviews: formattedList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    // Memory Mode
    let list = Array.from(memoryInterviews.values());
    if (queryParams.status) {
      list = list.filter((i) => i.status === queryParams.status);
    }
    if (queryParams.applicationId) {
      list = list.filter((i) => i.applicationId.toString() === queryParams.applicationId.toString());
    }

    list.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    const total = list.length;
    const paginated = list.slice(skip, skip + limit).map((i) => formatInterviewDTO(i, userRole === 'STUDENT'));

    return {
      interviews: paginated,
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
 * Recruiter: Reschedule Interview
 */
const rescheduleInterview = async (userId, interviewId, data) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  const { scheduledAt, duration, meetingLink, location } = data;
  if (!scheduledAt) {
    throw new AppError('New scheduled date and time is required', 400);
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    throw new AppError('New scheduled interview time must be a valid future date', 400);
  }

  if (isConnected()) {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.companyId.toString() !== company._id.toString()) {
      throw new AppError('You are not authorized to reschedule this interview', 403);
    }

    if (interview.status === 'CANCELLED' || interview.status === 'COMPLETED') {
      throw new AppError(`Cannot reschedule an interview with status '${interview.status}'`, 400);
    }

    const newDuration = duration ? Number(duration) : interview.duration;
    interview.scheduledAt = scheduledDate;
    interview.duration = newDuration;
    if (meetingLink !== undefined) interview.meetingLink = meetingLink.trim();
    if (location !== undefined) interview.location = location.trim();
    interview.status = 'SCHEDULED'; // Reset to SCHEDULED pending student confirmation
    interview.confirmedAt = null;

    await interview.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: interview.applicationId,
      actorId: userId,
      action: 'INTERVIEW_RESCHEDULED',
      description: `${interview.roundName} rescheduled to ${scheduledDate.toLocaleDateString()} ${scheduledDate.toLocaleTimeString()}`,
      metadata: { scheduledAt: scheduledDate, duration: newDuration },
    });

    // Notify Student User
    const student = await Student.findById(interview.studentId);
    const job = await Job.findById(interview.jobId);
    if (student && student.userId) {
      await notificationService.createNotification({
        recipientId: student.userId,
        type: 'INTERVIEW_RESCHEDULED',
        title: 'Interview Rescheduled',
        message: `Your ${interview.roundName} for ${job?.title || 'the position'} has been rescheduled to ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        entityType: 'Interview',
        entityId: interview._id,
        metadata: { jobTitle: job?.title, scheduledAt: scheduledDate },
      });
    }

    return interview;
  } else {
    const intObj = memoryInterviews.get(interviewId);
    if (!intObj) throw new AppError('Interview not found', 404);
    intObj.scheduledAt = scheduledDate;
    intObj.status = 'SCHEDULED';
    intObj.updatedAt = new Date();
    memoryInterviews.set(interviewId, intObj);
    return intObj;
  }
};

/**
 * Cancel Interview (Recruiter or Student)
 */
const cancelInterview = async (userId, userRole, interviewId, { cancellationReason } = {}) => {
  if (isConnected()) {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (userRole === 'STUDENT') {
      const student = await studentService.getProfileByUserId(userId);
      if (!student || interview.studentId.toString() !== student._id.toString()) {
        throw new AppError('You are not authorized to cancel this interview', 403);
      }
    } else if (userRole === 'COMPANY') {
      const company = await companyService.getProfileByUserId(userId);
      if (!company || interview.companyId.toString() !== company._id.toString()) {
        throw new AppError('You are not authorized to cancel this interview', 403);
      }
    }

    if (interview.status === 'CANCELLED' || interview.status === 'COMPLETED') {
      throw new AppError(`Interview is already ${interview.status.toLowerCase()}`, 400);
    }

    interview.status = 'CANCELLED';
    interview.cancelledAt = new Date();
    if (cancellationReason) {
      interview.cancellationReason = String(cancellationReason).trim();
    }
    await interview.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: interview.applicationId,
      actorId: userId,
      action: 'INTERVIEW_CANCELLED',
      description: `${interview.roundName} cancelled ${cancellationReason ? `(Reason: ${cancellationReason})` : ''}`,
      metadata: { cancellationReason: interview.cancellationReason },
    });

    // Notify opposite party
    const job = await Job.findById(interview.jobId);
    if (userRole === 'COMPANY') {
      const student = await Student.findById(interview.studentId);
      if (student && student.userId) {
        await notificationService.createNotification({
          recipientId: student.userId,
          type: 'INTERVIEW_CANCELLED',
          title: 'Interview Cancelled',
          message: `Your ${interview.roundName} for ${job?.title || 'the position'} has been cancelled.`,
          entityType: 'Interview',
          entityId: interview._id,
          metadata: { jobTitle: job?.title, cancellationReason: interview.cancellationReason },
        });
      }
    } else {
      const company = await Company.findById(interview.companyId);
      if (company && company.userId) {
        await notificationService.createNotification({
          recipientId: company.userId,
          type: 'INTERVIEW_CANCELLED',
          title: 'Interview Cancelled by Candidate',
          message: `The candidate has cancelled their ${interview.roundName} for ${job?.title || 'the position'}.`,
          entityType: 'Interview',
          entityId: interview._id,
          metadata: { jobTitle: job?.title },
        });
      }
    }

    return interview;
  } else {
    const intObj = memoryInterviews.get(interviewId);
    if (!intObj) throw new AppError('Interview not found', 404);
    intObj.status = 'CANCELLED';
    intObj.cancelledAt = new Date();
    memoryInterviews.set(interviewId, intObj);
    return intObj;
  }
};

/**
 * Student: Confirm attendance for scheduled interview
 */
const confirmInterview = async (userId, interviewId) => {
  const student = await studentService.getProfileByUserId(userId);
  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  if (isConnected()) {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.studentId.toString() !== student._id.toString()) {
      throw new AppError('You are not authorized to confirm this interview', 403);
    }

    if (interview.status !== 'SCHEDULED') {
      throw new AppError(`Cannot confirm interview with status '${interview.status}'`, 400);
    }

    interview.status = 'CONFIRMED';
    interview.confirmedAt = new Date();
    await interview.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: interview.applicationId,
      actorId: userId,
      action: 'INTERVIEW_CONFIRMED',
      description: `${interview.roundName} attendance confirmed by candidate`,
      metadata: {},
    });

    // Notify Company Recruiter User
    const company = await Company.findById(interview.companyId);
    const job = await Job.findById(interview.jobId);
    if (company && company.userId) {
      await notificationService.createNotification({
        recipientId: company.userId,
        type: 'INTERVIEW_CONFIRMED',
        title: 'Interview Confirmed by Candidate',
        message: `The candidate has confirmed attendance for the ${interview.roundName} (${job?.title || 'Job'}).`,
        entityType: 'Interview',
        entityId: interview._id,
        metadata: { jobTitle: job?.title, roundName: interview.roundName },
      });
    }

    return interview;
  } else {
    const intObj = memoryInterviews.get(interviewId);
    if (!intObj) throw new AppError('Interview not found', 404);
    intObj.status = 'CONFIRMED';
    intObj.confirmedAt = new Date();
    memoryInterviews.set(interviewId, intObj);
    return intObj;
  }
};

/**
 * Recruiter: Mark Interview as Completed
 */
const completeInterview = async (userId, interviewId) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  if (isConnected()) {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.companyId.toString() !== company._id.toString()) {
      throw new AppError('You are not authorized to complete this interview', 403);
    }

    if (interview.status === 'CANCELLED' || interview.status === 'COMPLETED') {
      throw new AppError(`Interview is already ${interview.status.toLowerCase()}`, 400);
    }

    interview.status = 'COMPLETED';
    await interview.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: interview.applicationId,
      actorId: userId,
      action: 'INTERVIEW_COMPLETED',
      description: `${interview.roundName} marked as completed by interviewer`,
      metadata: {},
    });

    return interview;
  } else {
    const intObj = memoryInterviews.get(interviewId);
    if (!intObj) throw new AppError('Interview not found', 404);
    intObj.status = 'COMPLETED';
    memoryInterviews.set(interviewId, intObj);
    return intObj;
  }
};

/**
 * Recruiter: Update Interview Evaluation Result & Internal Feedback
 */
const updateInterviewResult = async (userId, interviewId, { result, feedback } = {}) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  if (!result || !['PENDING', 'PASSED', 'FAILED', 'NEXT_ROUND'].includes(result)) {
    throw new AppError('Valid interview result is required (PASSED, FAILED, NEXT_ROUND)', 400);
  }

  if (isConnected()) {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.companyId.toString() !== company._id.toString()) {
      throw new AppError('You are not authorized to evaluate this interview', 403);
    }

    interview.result = result;
    if (feedback !== undefined) {
      interview.feedback = String(feedback).trim();
    }
    if (interview.status !== 'COMPLETED') {
      interview.status = 'COMPLETED';
    }
    await interview.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: interview.applicationId,
      actorId: userId,
      action: 'INTERVIEW_RESULT_UPDATED',
      description: `${interview.roundName} evaluation recorded: ${result}`,
      metadata: { result },
    });

    return interview;
  } else {
    const intObj = memoryInterviews.get(interviewId);
    if (!intObj) throw new AppError('Interview not found', 404);
    intObj.result = result;
    if (feedback !== undefined) intObj.feedback = String(feedback).trim();
    intObj.status = 'COMPLETED';
    memoryInterviews.set(interviewId, intObj);
    return intObj;
  }
};

/**
 * Recruiter: Mark Candidate as No-Show
 */
const markNoShow = async (userId, interviewId) => {
  const company = await companyService.getProfileByUserId(userId);
  if (!company) {
    throw new AppError('Company profile not found', 404);
  }

  if (isConnected()) {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.companyId.toString() !== company._id.toString()) {
      throw new AppError('You are not authorized to update this interview', 403);
    }

    interview.status = 'NO_SHOW';
    interview.result = 'FAILED';
    await interview.save();

    // Log Activity Event
    await activityService.createActivity({
      applicationId: interview.applicationId,
      actorId: userId,
      action: 'INTERVIEW_RESULT_UPDATED',
      description: `${interview.roundName} status marked as NO_SHOW`,
      metadata: { status: 'NO_SHOW' },
    });

    return interview;
  } else {
    const intObj = memoryInterviews.get(interviewId);
    if (!intObj) throw new AppError('Interview not found', 404);
    intObj.status = 'NO_SHOW';
    intObj.result = 'FAILED';
    memoryInterviews.set(interviewId, intObj);
    return intObj;
  }
};

module.exports = {
  createInterview,
  getInterviewById,
  getInterviews,
  rescheduleInterview,
  cancelInterview,
  confirmInterview,
  completeInterview,
  updateInterviewResult,
  markNoShow,
};
