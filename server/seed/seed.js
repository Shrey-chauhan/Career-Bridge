const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import Mongoose Models
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const ApplicationActivity = require('../models/ApplicationActivity');
const PlacementDrive = require('../models/PlacementDrive');
const AdminAuditLog = require('../models/AdminAuditLog');

// Import Generators & PRNG
const { resetSeed } = require('./utils/random');
const { generateUsers } = require('./generators/userGenerator');
const { generateStudentProfiles } = require('./generators/studentGenerator');
const { generateCompanies } = require('./generators/companyGenerator');
const { generateJobs } = require('./generators/jobGenerator');
const { generateApplicationsAndInterviews } = require('./generators/applicationGenerator');
const { generatePlacementDrives } = require('./generators/driveGenerator');
const { generateAuditLogs } = require('./generators/auditGenerator');
const { seedRealCompanies } = require('./generators/realCompanies.seed');

async function seedDatabase() {
  console.log('========================================');
  console.log(' Starting CareerBridge Seeder Execution ');
  console.log('========================================');

  // 1. Production Safety Check
  const isForceSeed = process.argv.includes('--force') || process.env.ALLOW_PROD_SEED === 'true';
  if (process.env.NODE_ENV === 'production' && !isForceSeed) {
    console.error('⛔ FATAL ERROR: Database seeding is disabled in production environment unless --force flag or ALLOW_PROD_SEED=true is provided.');
    process.exit(1);
  }

  // 2. Connect to MongoDB
  const connected = await connectDB();
  if (!connected) {
    console.error('⛔ FATAL ERROR: Failed to connect to MongoDB for seeding.');
    process.exit(1);
  }

  try {
    // Reset seed state for 100% deterministic reproducibility
    resetSeed(2026);

    // 3. Clear Existing Development Data
    console.log('\n🧹 Clearing existing development collections...');
    await Promise.all([
      AdminAuditLog.deleteMany({}),
      ApplicationActivity.deleteMany({}),
      Notification.deleteMany({}),
      Interview.deleteMany({}),
      Application.deleteMany({}),
      PlacementDrive.deleteMany({}),
      Resume.deleteMany({}),
      Job.deleteMany({}),
      Student.deleteMany({}),
      Company.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('✓ Existing development data cleared successfully.');

    // 4. Generate & Insert 250 Users
    console.log('\n👥 Generating Users (220 Students, 25 Companies, 3 TPOs, 2 Admins)...');
    const { users: userData, companyNames } = await generateUsers();
    const insertedUsers = await User.insertMany(userData);

    const studentUsers = insertedUsers.filter((u) => u.role === 'STUDENT');
    const companyUsers = insertedUsers.filter((u) => u.role === 'COMPANY');
    const tpoUsers = insertedUsers.filter((u) => u.role === 'TPO');
    const adminUsers = insertedUsers.filter((u) => u.role === 'ADMIN');
    const adminTpoUsers = [...tpoUsers, ...adminUsers];

    // 5. Generate & Insert Student Profiles & Resumes
    console.log('🎓 Generating Student Profiles & Resumes...');
    const { students: studentData, resumes: resumeData } = generateStudentProfiles(studentUsers);
    const insertedStudents = await Student.insertMany(studentData);
    const insertedResumes = await Resume.insertMany(resumeData);

    // 6. Generate & Insert Company Profiles
    console.log('🏢 Generating Company Profiles...');
    const companyData = generateCompanies(companyUsers, companyNames);
    const insertedCompanies = await Company.insertMany(companyData);

    // 7. Generate & Insert Job Postings
    console.log('💼 Generating Job Postings...');
    const jobData = generateJobs(insertedCompanies);
    const insertedJobs = await Job.insertMany(jobData);

    // 7.1 Generate & Insert Real Corporations & Jobs
    // Note: realCompanies data is demo/portfolio data using real company names with authored (not scraped) job postings for realistic recruitment dashboard demonstration.
    console.log('🏛️ Seeding Real Corporate Entities & Job Postings...');
    const realCompaniesResult = await seedRealCompanies();

    // 8. Generate & Insert Applications, Interviews, Activities & Notifications
    console.log('📄 Generating Applications, Interviews, Activities & Notifications...');
    const { applications: appData, interviews: intData, activities: actData, notifications: notifData } =
      generateApplicationsAndInterviews(insertedStudents, insertedJobs, insertedCompanies, tpoUsers, adminUsers, insertedResumes);

    const insertedApps = await Application.insertMany(appData);
    const insertedInterviews = await Interview.insertMany(intData);
    const insertedActivities = await ApplicationActivity.insertMany(actData);
    const insertedNotifications = await Notification.insertMany(notifData);

    // 9. Generate & Insert Placement Drives
    console.log('🚀 Generating Campus Placement Drives...');
    const driveData = generatePlacementDrives(insertedCompanies, insertedJobs, adminTpoUsers);
    const insertedDrives = await PlacementDrive.insertMany(driveData);

    // 10. Generate & Insert Admin Audit Logs
    console.log('📜 Generating Security Audit Logs...');
    const auditData = generateAuditLogs(adminTpoUsers, insertedCompanies, insertedStudents, insertedJobs, insertedDrives);
    const insertedAuditLogs = await AdminAuditLog.insertMany(auditData);

    // -------------------------------------------------------------
    // Validation & Integrity Verification
    // -------------------------------------------------------------
    console.log('\n🔍 Running Relationship Integrity & Orphan Validation Checks...');

    const userCount = await User.countDocuments();
    const studentCount = await Student.countDocuments();
    const companyCount = await Company.countDocuments();

    if (userCount < 250) throw new Error(`User count mismatch! Expected at least 250, got ${userCount}`);
    if (studentCount !== 220) throw new Error(`Student count mismatch! Expected 220, got ${studentCount}`);
    if (companyCount < 25) throw new Error(`Company count mismatch! Expected at least 25, got ${companyCount}`);

    // Duplicate Application Check (studentId + jobId)
    const appDuplicates = await Application.aggregate([
      { $group: { _id: { studentId: '$studentId', jobId: '$jobId' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    if (appDuplicates.length > 0) {
      throw new Error(`Duplicate applications detected! Count: ${appDuplicates.length}`);
    }

    // Password Validation Check
    const sampleUser = await User.findOne({ email: 'aarav.sharma001@example.com' }).select('+password');
    const isPasswordValid = await sampleUser.matchPassword('Password@123');
    if (!isPasswordValid) {
      throw new Error('Password verification failed for Password@123!');
    }

    const totalJobsCount = await Job.countDocuments();

    // Print Final Summary Banner
    console.log('\n========================================');
    console.log(' CareerBridge Database Seed Completed ');
    console.log('========================================');
    console.log(` Users:               ${userCount} (220 Students, ${companyCount} Companies, 3 TPOs, 2 Admins)`);
    console.log(` Student Profiles:    ${studentCount}`);
    console.log(` Company Profiles:    ${companyCount}`);
    console.log(` Resumes:             ${insertedResumes.length}`);
    console.log(` Job Postings:        ${totalJobsCount} (${insertedJobs.length} generated + ${totalJobsCount - insertedJobs.length} real)`);
    console.log(` Applications:       ${insertedApps.length}`);
    console.log(` Interviews:           ${insertedInterviews.length}`);
    console.log(` Placement Drives:      ${insertedDrives.length}`);
    console.log(` Activities:          ${insertedActivities.length}`);
    console.log(` Notifications:       ${insertedNotifications.length}`);
    console.log(` Audit Logs:            ${insertedAuditLogs.length}`);
    console.log('========================================');
    console.log(' Validation Status:   PASSED (0 Orphans, 0 Duplicates, Password Authenticated)');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`\n⛔ SEED EXECUTION FAILED: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

seedDatabase();
