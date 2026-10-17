const path = require('path');
const User = require('../../models/User');
const Company = require('../../models/Company');
const Job = require('../../models/Job');
const realCompaniesData = require('./realCompanies.data');
const jobTemplatesData = require('./jobTemplates.data');

/**
 * Helper to generate consistent recruiter emails from company names
 */
function getCompanyRecruiterEmail(companyName) {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  return `recruiter.${slug}@example.com`;
}

/**
 * Seed Real Top Companies and associated Job Postings
 * Additive seeder with built-in idempotency guard.
 */
async function seedRealCompanies({ isStandAlone = false } = {}) {
  try {
    const companyEmails = realCompaniesData.map((c) => getCompanyRecruiterEmail(c.companyName));

    // Idempotency check: check if users/companies already exist
    const existingRecruiterCount = await User.countDocuments({
      email: { $in: companyEmails },
    });

    if (existingRecruiterCount > 0) {
      console.log(`ℹ️ Real Companies Seeder: Skipping as ${existingRecruiterCount} real company accounts already exist.`);
      return { skipped: true, companyCount: 0, jobCount: 0 };
    }

    const createdUsers = [];
    const createdCompanies = [];
    const createdJobs = [];

    let templateIndex = 0;

    for (const compData of realCompaniesData) {
      const email = getCompanyRecruiterEmail(compData.companyName);

      // 1. Create Recruiter User Account
      const user = await User.create({
        name: `${compData.companyName} University Recruiting`,
        email,
        password: 'Password@123',
        role: 'COMPANY',
      });
      createdUsers.push(user);

      // Extract domain for clean logo fallback
      let domain = 'example.com';
      try {
        domain = new URL(compData.website).hostname.replace('www.', '');
      } catch (e) {
        domain = `${compData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      }

      // 2. Create Company Profile
      const company = await Company.create({
        userId: user._id,
        companyName: compData.companyName,
        logo: `https://logo.clearbit.com/${domain}`,
        description: compData.description,
        industry: compData.industry,
        website: compData.website,
        location: compData.location,
        companySize: compData.companySize || '500+',
        foundedYear: compData.foundedYear,
        contactEmail: compData.contactEmail,
        verificationStatus: 'VERIFIED',
      });
      createdCompanies.push(company);

      // 3. Create 2 Published Jobs per Company using jobTemplatesData
      for (let j = 0; j < 2; j++) {
        const template = jobTemplatesData[templateIndex % jobTemplatesData.length];
        templateIndex++;

        const deadline = new Date(2026, 9 + (templateIndex % 3), 15 + (templateIndex % 14)); // Oct - Dec 2026

        const job = await Job.create({
          companyId: company._id,
          title: template.title,
          description: template.description,
          jobType: template.jobType,
          workMode: template.workMode,
          location: compData.location || template.location,
          salary: {
            min: template.salary.min,
            max: template.salary.max,
            currency: template.salary.currency,
            period: template.salary.period,
          },
          experienceRequired: {
            minYears: template.experienceRequired.minYears,
            maxYears: template.experienceRequired.maxYears,
          },
          skills: template.skills,
          eligibility: {
            minimumCgpa: template.eligibility.minimumCgpa,
            maximumBacklogs: template.eligibility.maximumBacklogs,
            allowedBranches: template.eligibility.allowedBranches,
            graduationYears: template.eligibility.graduationYears,
            requiredSkills: template.eligibility.requiredSkills,
          },
          applicationDeadline: deadline,
          openings: template.openings || 5,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        });
        createdJobs.push(job);
      }
    }

    console.log(`✓ Seeded ${createdCompanies.length} Real Corporate Accounts with ${createdJobs.length} Published Jobs.`);
    return {
      skipped: false,
      companyCount: createdCompanies.length,
      jobCount: createdJobs.length,
    };
  } catch (error) {
    console.error('Failed to seed real companies:', error);
    throw error;
  }
}

module.exports = {
  seedRealCompanies,
};
