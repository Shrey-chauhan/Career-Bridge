const activityService = require('../services/activity.service');

const getApplicationActivities = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const applicationId = req.params.id;

    const activities = await activityService.getApplicationActivities(
      userId,
      userRole,
      applicationId
    );

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApplicationActivities,
};
