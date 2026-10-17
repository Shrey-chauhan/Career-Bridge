require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');

async function runTest() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Database connection failed. Exiting test.');
    process.exit(1);
  }

  try {
    // Ensure index sync
    try {
      await Application.collection.dropIndexes();
    } catch (e) {
      // ignore if collection doesn't exist yet
    }
    await Application.syncIndexes();

    // Create dummy objects or use existing
    let user = await User.findOne({ email: 'test_reapply_student@example.com' });
    if (!user) {
      user = await User.create({
        name: 'Test Reapply Student',
        email: 'test_reapply_student@example.com',
        password: 'password123',
        role: 'STUDENT',
      });
    }

    let student = await Student.findOne({ userId: user._id });
    if (!student) {
      student = await Student.create({
        userId: user._id,
        college: 'Test College',
        degree: 'B.Tech',
        branch: 'CSE',
        graduationYear: 2025,
        cgpa: 8.5,
        backlogs: 0,
      });
    }

    let companyUser = await User.findOne({ email: 'test_reapply_company@example.com' });
    if (!companyUser) {
      companyUser = await User.create({
        name: 'Test Reapply Company',
        email: 'test_reapply_company@example.com',
        password: 'password123',
        role: 'COMPANY',
      });
    }

    let company = await Company.findOne({ userId: companyUser._id });
    if (!company) {
      company = await Company.create({
        userId: companyUser._id,
        companyName: 'Reapply Corp',
        website: 'https://reapply.com',
        industry: 'Software',
      });
    }

    let job = await Job.findOne({ title: 'Reapply Test Job', companyId: company._id });
    if (!job) {
      job = await Job.create({
        companyId: company._id,
        title: 'Reapply Test Job',
        description: 'Testing withdraw and reapply functionality',
        location: 'Remote',
        jobType: 'FULL_TIME',
        workMode: 'REMOTE',
        openings: 5,
        applicationDeadline: new Date(Date.now() + 864000000),
      });
    }

    // Clean up previous applications for this student & job
    await Application.deleteMany({ studentId: student._id, jobId: job._id });

    // Step 1: Initial Application
    console.log('Step 1: Submitting initial application...');
    const app1 = await Application.create({
      studentId: student._id,
      jobId: job._id,
      companyId: company._id,
      status: 'APPLIED',
    });
    console.log('Application 1 created successfully, ID:', app1._id);

    // Verify duplicate active application fails
    try {
      await Application.create({
        studentId: student._id,
        jobId: job._id,
        companyId: company._id,
        status: 'APPLIED',
      });
      console.error('ERROR: Duplicate active application should have thrown unique constraint error!');
      process.exit(1);
    } catch (err) {
      console.log('SUCCESS: Duplicate active application blocked as expected:', err.message);
    }

    // Step 2: Withdraw application
    console.log('Step 2: Withdrawing application...');
    app1.status = 'WITHDRAWN';
    await app1.save();
    console.log('Application 1 status updated to WITHDRAWN');

    // Step 3: Re-apply to same job
    console.log('Step 3: Re-applying to the same job...');
    const app2 = await Application.create({
      studentId: student._id,
      jobId: job._id,
      companyId: company._id,
      status: 'APPLIED',
    });
    console.log('SUCCESS: Re-application succeeded! Application 2 ID:', app2._id);

    // Cleanup test data
    await Application.deleteMany({ studentId: student._id, jobId: job._id });
    console.log('Test completed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('TEST FAILED with error:', error);
    process.exit(1);
  }
}

runTest();
