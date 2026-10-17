const { randomItem, randomInt } = require('../utils/random');

const auditActions = [
  { action: 'VERIFY_COMPANY', entityType: 'COMPANY', desc: 'Approved corporate recruiter credentials' },
  { action: 'TOGGLE_STUDENT_STATUS', entityType: 'STUDENT', desc: 'Updated student account active status' },
  { action: 'CREATE_PLACEMENT_DRIVE', entityType: 'DRIVE', desc: 'Organized campus placement hiring drive' },
  { action: 'UPDATE_JOB_STATUS', entityType: 'JOB', desc: 'Updated corporate job posting status' },
  { action: 'SCHEDULE_INTERVIEW_ROUND', entityType: 'INTERVIEW', desc: 'Scheduled candidate technical interview round' },
  { action: 'EXPORT_ANALYTICS_REPORT', entityType: 'APPLICATION', desc: 'Exported tabular placement analytics CSV' },
];

function generateAuditLogs(adminTpoUsers, companies, students, jobs, drives) {
  const auditLogs = [];

  for (let i = 1; i <= 600; i++) {
    const actor = adminTpoUsers[(i - 1) % adminTpoUsers.length];
    const item = auditActions[(i - 1) % auditActions.length];

    let entityId = actor._id;
    if (item.entityType === 'COMPANY' && companies.length > 0) entityId = randomItem(companies)._id;
    if (item.entityType === 'STUDENT' && students.length > 0) entityId = randomItem(students)._id;
    if (item.entityType === 'JOB' && jobs.length > 0) entityId = randomItem(jobs)._id;
    if (item.entityType === 'DRIVE' && drives.length > 0) entityId = randomItem(drives)._id;

    const createdAt = new Date(2026, randomInt(0, 7), randomInt(1, 28));

    auditLogs.push({
      actorId: actor._id,
      actorRole: actor.role,
      action: item.action,
      entityType: item.entityType,
      entityId,
      description: item.desc,
      metadata: { step: 'SEED', sequence: i },
      createdAt,
    });
  }

  return auditLogs;
}

module.exports = {
  generateAuditLogs,
};
