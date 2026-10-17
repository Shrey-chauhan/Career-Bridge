const Company = require('../models/Company');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');

// In-memory fallback storage for Company profiles
const memoryCompanyProfiles = new Map();

const validateCompanyData = (data) => {
  if (data.foundedYear !== undefined) {
    const currentYear = new Date().getFullYear();
    if (data.foundedYear < 1800 || data.foundedYear > currentYear) {
      throw new AppError(`Founded year must be between 1800 and ${currentYear}`, 400);
    }
  }

  if (
    data.companySize &&
    !['1-10', '11-50', '51-200', '201-500', '500+'].includes(data.companySize)
  ) {
    throw new AppError('Invalid company size range', 400);
  }
};

const getProfileByUserId = async (userId) => {
  const userIdStr = userId.toString();

  if (isConnected()) {
    return await Company.findOne({ userId });
  } else {
    return memoryCompanyProfiles.get(userIdStr) || null;
  }
};

const createProfile = async (userId, data) => {
  const userIdStr = userId.toString();
  validateCompanyData(data);

  const existingProfile = await getProfileByUserId(userId);
  if (existingProfile) {
    throw new AppError('Company profile already exists for this user', 409);
  }

  if (!data.companyName || !data.industry) {
    throw new AppError('Please provide companyName and industry', 400);
  }

  if (isConnected()) {
    const company = await Company.create({
      ...data,
      userId,
      verificationStatus: 'PENDING', // Force default, company cannot self-verify
    });
    return company;
  } else {
    const id = 'mem_comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const memoryProfile = {
      id,
      _id: id,
      userId: userIdStr,
      companyName: data.companyName.trim(),
      logo: data.logo || '',
      description: data.description || '',
      industry: data.industry.trim(),
      website: data.website || '',
      location: data.location || '',
      companySize: data.companySize || undefined,
      foundedYear: data.foundedYear || undefined,
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      verificationStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryCompanyProfiles.set(userIdStr, memoryProfile);
    return memoryProfile;
  }
};

const updateProfile = async (userId, data) => {
  const userIdStr = userId.toString();
  validateCompanyData(data);

  const existingProfile = await getProfileByUserId(userId);
  if (!existingProfile) {
    throw new AppError('Company profile not found. Please create a profile first', 404);
  }

  // Prevent overriding restricted fields
  delete data.userId;
  delete data.verificationStatus;

  if (isConnected()) {
    const updatedCompany = await Company.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return updatedCompany;
  } else {
    const updatedMemoryProfile = {
      ...existingProfile,
      ...data,
      updatedAt: new Date(),
    };
    memoryCompanyProfiles.set(userIdStr, updatedMemoryProfile);
    return updatedMemoryProfile;
  }
};

module.exports = {
  getProfileByUserId,
  createProfile,
  updateProfile,
};
