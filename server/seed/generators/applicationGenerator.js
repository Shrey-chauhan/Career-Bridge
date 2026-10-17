const mongoose = require('mongoose');
const { randomItem, randomInt, shuffle } = require('../utils/random');

function generateApplicationsAndInterviews(students, jobs, companies, tpoUsers, adminUsers, resumes) {
  const publishedJobs = jobs.filter((j) => j.status === 'PUBLISHED' || j.status === 'CLOSED');
  const studentResumeMap = new Map();
  resumes.forEach((r) => studentResumeMap.set(r.studentId.toString(), r));

  const adminTpoUsers = [...tpoUsers, ...adminUsers];

  const applications = [];
  const applicationSet = new Set(); // Key: "studentId_jobId" to prevent duplicates

  // Target: exactly 2500 applications
  const targetAppCount = 2500;
  let attempts = 0;

  while (applications.length < targetAppCount && attempts < 50000) {
    attempts++;
    const student = randomItem(students);
    const job = randomItem(publishedJobs);
    const key = `${student._id.toString()}_${job._id.toString()}`;

    if (applicationSet.has(key)) continue;
    applicationSet.add(key);

    const appId = new mongoose.Types.ObjectId();
    const resume = studentResumeMap.get(student._id.toString());
    const resumeSnapshot = resume ? {
      url: resume.secureUrl,
      fileName: resume.fileName,
      resumeId: resume._id,
      version: resume.version,
    } : { url: '', fileName: '' };

    // Application Status Distribution: APPLIED ~1200, SHORTLISTED ~500, REJECTED ~600, WITHDRAWN ~200
    const idx = applications.length;
    let status = 'APPLIED';
    if (idx >= 1200 && idx < 1700) status = 'SHORTLISTED';
    else if (idx >= 1700 && idx < 2300) status = 'REJECTED';
    else if (idx >= 2300) status = 'WITHDRAWN';

    const appliedAt = new Date(job.createdAt.getTime() + (randomInt(1, 15) * 24 * 60 * 60 * 1000));
    const reviewedAt = status !== 'APPLIED' ? new Date(appliedAt.getTime() + (randomInt(1, 5) * 24 * 60 * 60 * 1000)) : null;

    let rejectionReason = '';
    if (status === 'REJECTED') {
      rejectionReason = randomItem([
        'CGPA below company threshold criteria.',
        'Profile skills do not match job requirements.',
        'Did not meet graduation year eligibility.',
        'Candidate selected for another company offer.',
      ]);
    }

    let companyNotes = '';
    if (status === 'SHORTLISTED') {
      companyNotes = randomItem([
        'Strong problem solving and React fundamentals. Proceed to technical round.',
        'Good academic background and project portfolio.',
        'Passed initial resume screening. Schedule interview.',
      ]);
    }

    applications.push({
      _id: appId,
      studentId: student._id,
      jobId: job._id,
      companyId: job.companyId,
      resumeSnapshot,
      coverLetter: `Dear Hiring Team at ${job.companyName}, I am excited to submit my application for the ${job.title} position.`,
      status,
      appliedAt,
      reviewedAt,
      rejectionReason,
      companyNotes,
      createdAt: appliedAt,
    });
  }

  // -------------------------------------------------------------
  // Generate 500 Interviews (From Shortlisted Applications)
  // -------------------------------------------------------------
  const shortlistedApps = applications.filter((app) => app.status === 'SHORTLISTED');
  const interviews = [];
  const targetInterviewCount = 500;

  for (let i = 0; i < targetInterviewCount; i++) {
    const app = shortlistedApps[i % shortlistedApps.length];
    const createdBy = randomItem(adminTpoUsers)._id;

    // Multi-round distribution (Round 1, Round 2, HR Round)
    const roundNumber = (i % 3) + 1;
    let roundName = 'Technical Round 1';
    if (roundNumber === 2) roundName = 'System Design & Problem Solving';
    if (roundNumber === 3) roundName = 'HR & Culture Fit';

    // Status distribution: COMPLETED ~300, CONFIRMED ~100, SCHEDULED ~50, CANCELLED ~35, NO_SHOW ~15
    let status = 'COMPLETED';
    let result = 'PASSED';
    if (i >= 300 && i < 400) { status = 'CONFIRMED'; result = 'PENDING'; }
    else if (i >= 400 && i < 450) { status = 'SCHEDULED'; result = 'PENDING'; }
    else if (i >= 450 && i < 485) { status = 'CANCELLED'; result = 'PENDING'; }
    else if (i >= 485) { status = 'NO_SHOW'; result = 'FAILED'; }

    if (status === 'COMPLETED') {
      result = i % 2 === 0 ? 'PASSED' : 'FAILED';
    }

    const scheduledAt = status === 'COMPLETED'
      ? new Date(app.appliedAt.getTime() + (randomInt(5, 20) * 24 * 60 * 60 * 1000))
      : new Date(Date.now() + (randomInt(1, 15) * 24 * 60 * 60 * 1000));

    interviews.push({
      _id: new mongoose.Types.ObjectId(),
      applicationId: app._id,
      jobId: app.jobId,
      studentId: app.studentId,
      companyId: app.companyId,
      roundNumber,
      roundName,
      scheduledAt,
      duration: 45,
      interviewType: randomItem(['ONLINE', 'OFFLINE', 'PHONE']),
      meetingLink: `https://meet.example.com/interview-${i + 1}`,
      location: 'Main Campus Auditorium Hall A',
      interviewerName: `Interviewer ${i + 1}`,
      interviewerEmail: `interviewer${i + 1}@example.com`,
      status,
      result,
      feedback: status === 'COMPLETED' ? 'Candidate demonstrated strong technical competence and clear communication.' : '',
      cancelledAt: status === 'CANCELLED' ? new Date() : null,
      cancellationReason: status === 'CANCELLED' ? 'Schedule conflict requested by candidate' : '',
      confirmedAt: status === 'CONFIRMED' || status === 'COMPLETED' ? app.appliedAt : null,
      createdBy,
      createdAt: app.appliedAt,
    });
  }

  // -------------------------------------------------------------
  // Generate 3500 Application Activities
  // -------------------------------------------------------------
  const activities = [];
  applications.forEach((app) => {
    activities.push({
      applicationId: app._id,
      actorId: app.studentId,
      action: 'APPLICATION_SUBMITTED',
      description: 'Candidate submitted job application',
      createdAt: app.appliedAt,
    });

    if (app.status === 'SHORTLISTED') {
      activities.push({
        applicationId: app._id,
        actorId: app.companyId,
        action: 'APPLICATION_SHORTLISTED',
        description: 'Recruiter shortlisted candidate for interview round',
        createdAt: app.reviewedAt || app.appliedAt,
      });
    } else if (app.status === 'REJECTED') {
      activities.push({
        applicationId: app._id,
        actorId: app.companyId,
        action: 'APPLICATION_REJECTED',
        description: `Application rejected: ${app.rejectionReason || 'Did not meet requirements'}`,
        createdAt: app.reviewedAt || app.appliedAt,
      });
    } else if (app.status === 'WITHDRAWN') {
      activities.push({
        applicationId: app._id,
        actorId: app.studentId,
        action: 'APPLICATION_WITHDRAWN',
        description: 'Candidate withdrew placement application',
        createdAt: app.appliedAt,
      });
    }
  });

  // Add interview timeline activities until reaching ~3500 total
  interviews.forEach((int) => {
    activities.push({
      applicationId: int.applicationId,
      actorId: int.createdBy,
      action: 'INTERVIEW_SCHEDULED',
      description: `Scheduled ${int.roundName} (Round ${int.roundNumber})`,
      createdAt: int.createdAt,
    });

    if (int.status === 'COMPLETED') {
      activities.push({
        applicationId: int.applicationId,
        actorId: int.createdBy,
        action: 'INTERVIEW_COMPLETED',
        description: `Completed ${int.roundName} evaluation`,
        createdAt: int.scheduledAt,
      });
    }
  });

  // Limit to 3500 activities target
  const finalActivities = activities.slice(0, 3500);

  // -------------------------------------------------------------
  // Generate 1200 Notifications
  // -------------------------------------------------------------
  const notifications = [];
  const targetNotificationCount = 1200;

  for (let i = 0; i < targetNotificationCount; i++) {
    const app = applications[i % applications.length];
    const isRead = i % 2 === 0;

    notifications.push({
      recipientId: app.studentId,
      type: app.status === 'SHORTLISTED' ? 'APPLICATION_SHORTLISTED' : 'APPLICATION_SUBMITTED',
      title: app.status === 'SHORTLISTED' ? 'Application Shortlisted 🎉' : 'Application Received',
      message: `Your application status for job ID ${app.jobId} has been updated to ${app.status}.`,
      entityType: 'Application',
      entityId: app._id,
      isRead,
      readAt: isRead ? new Date() : null,
      createdAt: app.appliedAt,
    });
  }

  return {
    applications,
    interviews,
    activities: finalActivities,
    notifications,
  };
}

module.exports = {
  generateApplicationsAndInterviews,
};
