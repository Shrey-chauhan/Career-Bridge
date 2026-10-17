const Resume = require('../models/Resume');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');
const storageService = require('./storage.service');
const studentService = require('./student.service');
const companyService = require('./company.service');

// In-memory fallback storage for Resumes
const memoryResumes = new Map();

/**
 * Upload, replace, and version a student resume
 */
const uploadResume = async (userId, file) => {
  if (!file || !file.buffer) {
    throw new AppError('Resume file buffer is required for upload', 400);
  }

  // 1. Fetch Student Profile
  const student = await studentService.getProfileByUserId(userId);
  if (!student) {
    throw new AppError('Student profile not found. Please complete your profile first.', 400);
  }

  const studentIdStr = (student._id || student.id).toString();

  let highestVersion = 0;

  if (isConnected()) {
    // Determine highest existing version for this student
    const existingResumes = await Resume.find({ studentId: student._id }).sort({ version: -1 });
    if (existingResumes.length > 0) {
      highestVersion = existingResumes[0].version || 0;
    }
  } else {
    for (const r of memoryResumes.values()) {
      if (r.studentId.toString() === studentIdStr) {
        if (r.version > highestVersion) {
          highestVersion = r.version;
        }
      }
    }
  }

  const newVersion = highestVersion + 1;

  // 2. Upload file through storage abstraction
  const uploadResult = await storageService.uploadFile(file.buffer, {
    studentId: studentIdStr,
    originalFileName: file.originalname,
    fileType: file.mimetype,
  });

  const originalFileName = file.originalname || 'resume.pdf';

  if (isConnected()) {
    // Deactivate previous active resumes for this student
    await Resume.updateMany(
      { studentId: student._id, isActive: true },
      { $set: { isActive: false } }
    );

    // Save new Resume document
    const newResume = await Resume.create({
      studentId: student._id,
      fileName: originalFileName,
      originalFileName,
      fileType: file.mimetype,
      fileSize: file.size,
      storageProvider: uploadResult.storageProvider,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      version: newVersion,
      isActive: true,
      uploadedAt: new Date(),
    });



    return newResume;
  } else {
    // Memory Mode Fallback
    for (const [id, r] of memoryResumes.entries()) {
      if (r.studentId.toString() === studentIdStr && r.isActive) {
        memoryResumes.set(id, { ...r, isActive: false });
      }
    }

    const resMemId = 'mem_res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newMemResume = {
      id: resMemId,
      _id: resMemId,
      studentId: student._id || student.id,
      fileName: originalFileName,
      originalFileName,
      fileType: file.mimetype,
      fileSize: file.size,
      storageProvider: uploadResult.storageProvider,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      version: newVersion,
      isActive: true,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryResumes.set(resMemId, newMemResume);



    return newMemResume;
  }
};

/**
 * Get active resume for logged in student
 */
const getActiveResume = async (userId) => {
  const student = await studentService.getProfileByUserId(userId);
  if (!student) return null;

  const studentIdStr = (student._id || student.id).toString();

  if (isConnected()) {
    const activeResume = await Resume.findOne({
      studentId: student._id,
      isActive: true,
    });
    return activeResume;
  } else {
    for (const r of memoryResumes.values()) {
      if (r.studentId.toString() === studentIdStr && r.isActive) {
        return r;
      }
    }
    return null;
  }
};

/**
 * Get single resume by ID with role & ownership security
 */
const getResumeById = async (userId, userRole, resumeId) => {
  if (isConnected()) {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new AppError('Resume document not found', 404);
    }

    if (userRole === 'STUDENT') {
      const student = await studentService.getProfileByUserId(userId);
      if (!student || resume.studentId.toString() !== student._id.toString()) {
        throw new AppError('You are not authorized to view this resume', 403);
      }
    } else if (userRole === 'COMPANY') {
      const company = await companyService.getProfileByUserId(userId);
      if (!company) {
        throw new AppError('Company profile not found', 403);
      }

      // Check if company has an application referencing this student/resume
      const hasApplication = await Application.findOne({
        companyId: company._id,
        $or: [
          { 'resumeSnapshot.resumeId': resume._id },
          { studentId: resume.studentId },
        ],
      });

      if (!hasApplication) {
        throw new AppError(
          'You are not authorized to view this candidate resume. Access is permitted only for job applicants.',
          403
        );
      }
    } else if (userRole !== 'ADMIN') {
      throw new AppError('Unauthorized access to resume document', 403);
    }

    return resume;
  } else {
    const resume = memoryResumes.get(resumeId);
    if (!resume) {
      throw new AppError('Resume document not found', 404);
    }
    return resume;
  }
};

/**
 * Delete / deactivate student resume
 */
const deleteResume = async (userId, resumeId) => {
  const student = await studentService.getProfileByUserId(userId);
  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  const studentIdStr = (student._id || student.id).toString();

  if (isConnected()) {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new AppError('Resume document not found', 404);
    }

    if (resume.studentId.toString() !== studentIdStr) {
      throw new AppError('You are not authorized to delete this resume', 403);
    }

    // Check if referenced in historical applications
    const appCount = await Application.countDocuments({
      $or: [
        { 'resumeSnapshot.resumeId': resume._id },
        { studentId: student._id },
      ],
    });

    resume.isActive = false;
    await resume.save();



    // Clean storage if unreferenced
    if (appCount === 0 && resume.publicId) {
      await storageService.deleteFile(resume.publicId, resume.storageProvider);
    }

    return { message: 'Resume document deactivated successfully' };
  } else {
    const resume = memoryResumes.get(resumeId);
    if (!resume) {
      throw new AppError('Resume document not found', 404);
    }

    if (resume.studentId.toString() !== studentIdStr) {
      throw new AppError('You are not authorized to delete this resume', 403);
    }

    resume.isActive = false;
    memoryResumes.set(resumeId, resume);

    student.resume = { url: '', fileName: '', uploadedAt: null, version: 0 };
    return { message: 'Resume document deactivated successfully' };
  }
};

module.exports = {
  uploadResume,
  getActiveResume,
  getResumeById,
  deleteResume,
};
