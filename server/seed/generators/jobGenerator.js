const { randomItem, randomItems, randomInt } = require('../utils/random');

const jobTitles = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'React Developer', 'Node.js Developer', 'Java Developer', 'Python Developer',
  'Software Intern', 'Web Developer', 'QA Engineer', 'Data Analyst', 'DevOps Engineer', 'Cloud Engineer',
];

const skillPool = [
  'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Java', 'Python',
  'SQL', 'Git', 'REST API', 'TypeScript', 'Docker', 'AWS',
];

const branchList = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
];

function generateJobs(companies) {
  const jobs = [];
  const verifiedCompanies = companies.filter((c) => c.verificationStatus === 'VERIFIED');

  for (let i = 1; i <= 90; i++) {
    const company = verifiedCompanies[(i - 1) % verifiedCompanies.length];
    const title = jobTitles[(i - 1) % jobTitles.length];
    const jobType = i % 8 === 0 ? 'INTERNSHIP' : 'FULL_TIME';
    const workMode = randomItem(['ONSITE', 'HYBRID', 'REMOTE']);
    const location = company.location;

    // Status distribution: ~75 PUBLISHED, ~10 CLOSED, ~5 DRAFT
    let status = 'PUBLISHED';
    if (i > 75 && i <= 85) status = 'CLOSED';
    if (i > 85) status = 'DRAFT';

    const minCgpa = randomItem([6.0, 6.5, 7.0, 7.5]);
    const maxBacklogs = randomItem([0, 0, 1, 2]);
    const requiredSkills = randomItems(skillPool, randomInt(2, 4));

    const createdAt = new Date(2026, 8, randomInt(1, 15)); // Sept 2026
    const deadline = new Date(2026, randomInt(9, 11), randomInt(1, 28)); // Oct - Dec 2026

    const minSalary = randomInt(4, 8) * 100000;
    const maxSalary = minSalary + randomInt(2, 6) * 100000;

    jobs.push({
      companyId: company._id,
      title: `${title} - ${company.companyName}`,
      description: `We are seeking a talented ${title} to join ${company.companyName}. You will design, develop, and scale modern web software applications.`,
      jobType,
      workMode,
      location,
      salary: {
        min: minSalary,
        max: maxSalary,
        currency: 'INR',
        period: 'YEARLY',
      },
      experienceRequired: {
        minYears: 0,
        maxYears: jobType === 'INTERNSHIP' ? 0 : 1,
      },
      skills: requiredSkills,
      eligibility: {
        minimumCgpa: minCgpa,
        maximumBacklogs: maxBacklogs,
        allowedBranches: randomItems(branchList, randomInt(2, 4)),
        graduationYears: [2026, 2025],
        requiredSkills,
      },
      applicationDeadline: deadline,
      openings: randomInt(2, 10),
      status,
      publishedAt: status !== 'DRAFT' ? createdAt : null,
      createdAt,
    });
  }

  return jobs;
}

module.exports = {
  generateJobs,
};
