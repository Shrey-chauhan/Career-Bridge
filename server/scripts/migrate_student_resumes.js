require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');
const Resume = require('../models/Resume');

async function migrateStudentResumes() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Database connection failed. Exiting migration.');
    process.exit(1);
  }

  try {
    console.log('Starting migration of legacy Student.resume data to Resume collection...');
    
    // Find all raw student documents containing resume field with a valid URL or filename
    const studentsWithResume = await Student.collection.find({
      'resume.url': { $exists: true, $ne: '' },
    }).toArray();

    console.log(`Found ${studentsWithResume.length} students with legacy resume data.`);

    let migratedCount = 0;
    for (const student of studentsWithResume) {
      const resumeData = student.resume;
      if (!resumeData || !resumeData.url) continue;

      // Check if an active Resume document already exists for this student
      const existingResume = await Resume.findOne({ studentId: student._id, isActive: true });
      if (!existingResume) {
        await Resume.create({
          studentId: student._id,
          fileName: resumeData.fileName || 'resume.pdf',
          originalFileName: resumeData.fileName || 'resume.pdf',
          fileType: 'application/pdf',
          fileSize: 100000,
          storageProvider: 'LOCAL',
          publicId: `migrated_${student._id}`,
          secureUrl: resumeData.url,
          version: resumeData.version || 1,
          isActive: true,
          uploadedAt: resumeData.uploadedAt || new Date(),
        });
        migratedCount++;
      }
    }

    console.log(`Migrated ${migratedCount} new Resume documents from Student.resume.`);

    // Unset the resume field across all Student documents
    const unsetResult = await Student.collection.updateMany(
      { resume: { $exists: true } },
      { $unset: { resume: '' } }
    );

    console.log(`Unset resume field from ${unsetResult.modifiedCount} Student documents.`);
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateStudentResumes();
