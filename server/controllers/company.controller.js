const companyService = require('../services/company.service');

const getProfile = async (req, res, next) => {
  try {
    const profile = await companyService.getProfileByUserId(req.user.id || req.user._id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const profile = await companyService.createProfile(
      req.user.id || req.user._id,
      req.body
    );
    res.status(201).json({
      success: true,
      message: 'Company profile created successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await companyService.updateProfile(
      req.user.id || req.user._id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
};
