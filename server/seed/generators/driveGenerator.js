const { randomItem, randomInt } = require('../utils/random');

function generatePlacementDrives(companies, jobs, adminTpoUsers) {
  const drives = [];
  const statuses = [
    ...Array(3).fill('DRAFT'),
    ...Array(5).fill('UPCOMING'),
    ...Array(4).fill('ACTIVE'),
    ...Array(10).fill('COMPLETED'),
    ...Array(3).fill('CANCELLED'),
  ];

  // Group jobs by company ID
  const companyJobsMap = new Map();
  jobs.forEach((j) => {
    const cId = j.companyId.toString();
    if (!companyJobsMap.has(cId)) companyJobsMap.set(cId, []);
    companyJobsMap.get(cId).push(j._id);
  });

  const verifiedCompanies = companies.filter((c) => c.verificationStatus === 'VERIFIED');

  for (let i = 0; i < 25; i++) {
    const company = verifiedCompanies[i % verifiedCompanies.length];
    const companyJobIds = companyJobsMap.get(company._id.toString()) || [];
    const createdBy = adminTpoUsers[i % adminTpoUsers.length]._id;
    const status = statuses[i];

    const startDate = new Date(2026, randomInt(1, 8), randomInt(1, 15));
    const endDate = new Date(startDate.getTime() + (randomInt(3, 7) * 24 * 60 * 60 * 1000));

    drives.push({
      name: `${company.companyName} Annual Campus Drive 2026`,
      description: `Campus placement hiring drive conducted by ${company.companyName} for B.Tech and MCA candidates.`,
      companyId: company._id,
      jobIds: companyJobIds,
      startDate,
      endDate,
      location: 'Main Campus Auditorium & Computer Labs',
      status,
      eligibleCourses: ['B.Tech', 'M.Tech', 'MCA'],
      eligibleGraduationYears: [2026, 2025],
      createdBy,
      createdAt: startDate,
    });
  }

  return drives;
}

module.exports = {
  generatePlacementDrives,
};
