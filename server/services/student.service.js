const Student = require('../models/Student');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');

// In-memory fallback storage for Student profiles
const memoryStudentProfiles = new Map();

/**
 * Calculates Student Profile Completion percentage
 * Weighting:
 *  College: 10%
 *  Degree: 10%
 *  Branch: 10%
 *  Graduation Year: 10%
 *  CGPA: 10%
 *  Skills (at least 1): 15%
 *  Projects (at least 1): 15%
 *  Bio: 5%
 *  Resume (metadata present): 15%
 */
const calculateStudentProfileCompletion = (data) => {
  let score = 0;

  if (data.college && data.college.trim()) score += 10;
  if (data.degree && data.degree.trim()) score += 10;
  if (data.branch && data.branch.trim()) score += 10;
  if (data.graduationYear) score += 10;
  if (data.cgpa !== undefined && data.cgpa !== null && data.cgpa >= 0) score += 10;
  if (Array.isArray(data.skills) && data.skills.length > 0) score += 15;
  if (Array.isArray(data.projects) && data.projects.length > 0) score += 15;
  if (data.bio && data.bio.trim()) score += 5;
  if (data.hasResume) score += 15;

  return Math.min(100, Math.max(0, score));
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  const uniqueSkills = new Set(
    skills.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
  );
  return Array.from(uniqueSkills);
};

const validateStudentData = (data) => {
  if (data.cgpa !== undefined && (data.cgpa < 0 || data.cgpa > 10)) {
    throw new AppError('CGPA must be between 0.0 and 10.0', 400);
  }

  if (data.backlogs !== undefined && data.backlogs < 0) {
    throw new AppError('Backlogs cannot be negative', 400);
  }

  if (
    data.graduationYear !== undefined &&
    (data.graduationYear < 2000 || data.graduationYear > 2100)
  ) {
    throw new AppError('Graduation year must be between 2000 and 2100', 400);
  }
};

const getProfileByUserId = async (userId) => {
  const userIdStr = userId.toString();

  if (isConnected()) {
    return await Student.findOne({ userId });
  } else {
    return memoryStudentProfiles.get(userIdStr) || null;
  }
};

const createProfile = async (userId, data) => {
  const userIdStr = userId.toString();
  validateStudentData(data);

  const existingProfile = await getProfileByUserId(userId);
  if (existingProfile) {
    throw new AppError('Student profile already exists for this user', 409);
  }

  if (!data.college || !data.degree || !data.branch || !data.graduationYear || data.cgpa === undefined) {
    throw new AppError('Please provide college, degree, branch, graduationYear, and cgpa', 400);
  }

  const cleanedSkills = normalizeSkills(data.skills);
  const completion = calculateStudentProfileCompletion({ ...data, skills: cleanedSkills });

  if (isConnected()) {
    const student = await Student.create({
      ...data,
      userId,
      skills: cleanedSkills,
      profileCompletion: completion,
      placementStatus: 'NOT_PLACED', // Force default
    });
    return student;
  } else {
    const id = 'mem_stud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const memoryProfile = {
      id,
      _id: id,
      userId: userIdStr,
      phone: data.phone || '',
      college: data.college.trim(),
      degree: data.degree.trim(),
      branch: data.branch.trim(),
      graduationYear: data.graduationYear,
      cgpa: data.cgpa,
      backlogs: data.backlogs || 0,
      skills: cleanedSkills,
      projects: data.projects || [],
      certifications: data.certifications || [],
      experience: data.experience || [],

      location: data.location || '',
      bio: data.bio || '',
      linkedin: data.linkedin || '',
      github: data.github || '',
      portfolio: data.portfolio || '',
      profileCompletion: completion,
      placementStatus: 'NOT_PLACED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStudentProfiles.set(userIdStr, memoryProfile);
    return memoryProfile;
  }
};

const updateProfile = async (userId, data) => {
  const userIdStr = userId.toString();
  validateStudentData(data);

  const existingProfile = await getProfileByUserId(userId);
  if (!existingProfile) {
    throw new AppError('Student profile not found. Please create a profile first', 404);
  }

  // Prevent overriding restricted fields
  delete data.userId;
  delete data.placementStatus;

  if (data.skills) {
    data.skills = normalizeSkills(data.skills);
  }

  const mergedData = isConnected()
    ? { ...existingProfile.toObject(), ...data }
    : { ...existingProfile, ...data };

  const newCompletion = calculateStudentProfileCompletion(mergedData);
  data.profileCompletion = newCompletion;

  if (isConnected()) {
    const updatedStudent = await Student.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return updatedStudent;
  } else {
    const updatedMemoryProfile = {
      ...existingProfile,
      ...data,
      updatedAt: new Date(),
    };
    memoryStudentProfiles.set(userIdStr, updatedMemoryProfile);
    return updatedMemoryProfile;
  }
};

const markStudentPlacementStatus = async (studentId, newStatus, { actorId, reason } = {}) => {
  const validStatuses = ['NOT_PLACED', 'PLACED', 'NOT_INTERESTED'];
  if (!validStatuses.includes(newStatus)) {
    throw new AppError('Invalid placement status', 400);
  }

  let student;
  if (isConnected()) {
    student = await Student.findById(studentId);
  } else {
    for (const p of memoryStudentProfiles.values()) {
      if (p._id.toString() === studentId.toString() || p.id === studentId.toString()) {
        student = p;
        break;
      }
    }
  }

  if (!student) {
    throw new AppError('Student not found', 404);
  }

  const oldStatus = student.placementStatus;
  if (oldStatus !== newStatus) {
    if (isConnected()) {
      student.placementStatus = newStatus;
      await student.save();
    } else {
      student.placementStatus = newStatus;
      student.updatedAt = new Date();
      if (student.userId) {
        memoryStudentProfiles.set(student.userId.toString(), student);
      }
    }

    if (actorId) {
      const auditLogService = require('./auditLog.service');
      await auditLogService.createAuditLog({
        actorId,
        actorRole: 'ADMIN',
        action: 'UPDATE_PLACEMENT_STATUS',
        entityType: 'Student',
        entityId: student._id || student.id,
        description: `Student placement status updated from ${oldStatus || 'NOT_PLACED'} to ${newStatus}`,
        metadata: { oldStatus, newStatus, reason: reason || '' },
      });
    }
  }

  return student;
};

module.exports = {
  calculateStudentProfileCompletion,
  getProfileByUserId,
  createProfile,
  updateProfile,
  markStudentPlacementStatus,
};
