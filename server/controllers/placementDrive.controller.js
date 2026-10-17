const placementDriveService = require('../services/placementDrive.service');

const createDrive = async (req, res, next) => {
  try {
    const user = req.user;
    const drive = await placementDriveService.createDrive(user, req.body);
    res.status(201).json({
      success: true,
      message: 'Placement drive created successfully',
      data: drive,
    });
  } catch (error) {
    next(error);
  }
};

const getDrives = async (req, res, next) => {
  try {
    const result = await placementDriveService.getDrives(req.query);
    res.status(200).json({
      success: true,
      data: result.drives,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getDriveById = async (req, res, next) => {
  try {
    const result = await placementDriveService.getDriveById(req.params.id);
    res.status(200).json({
      success: true,
      data: result.drive,
      metrics: result.metrics,
    });
  } catch (error) {
    next(error);
  }
};

const updateDrive = async (req, res, next) => {
  try {
    const user = req.user;
    const drive = await placementDriveService.updateDrive(req.params.id, user, req.body);
    res.status(200).json({
      success: true,
      message: 'Placement drive updated successfully',
      data: drive,
    });
  } catch (error) {
    next(error);
  }
};

const associateJobsToDrive = async (req, res, next) => {
  try {
    const user = req.user;
    const { jobIds } = req.body;
    const drive = await placementDriveService.associateJobsToDrive(req.params.id, user, jobIds);
    res.status(200).json({
      success: true,
      message: 'Jobs associated with placement drive successfully',
      data: drive,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  associateJobsToDrive,
};
