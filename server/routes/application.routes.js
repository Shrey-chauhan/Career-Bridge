const express = require('express');
const router = express.Router();

const applicationController = require('../controllers/application.controller');
const activityController = require('../controllers/activity.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Application Activity Timeline Endpoint (Student / Company / Admin ownership guarded in controller/service)
router.get('/:id/activity', protect, activityController.getApplicationActivities);

// Student Application Endpoints
router.post('/', protect, authorizeRoles('STUDENT'), applicationController.applyForJob);
router.get('/my', protect, authorizeRoles('STUDENT'), applicationController.getMyApplications);
router.get('/:id', protect, authorizeRoles('STUDENT'), applicationController.getMyApplicationById);
router.patch('/:id/withdraw', protect, authorizeRoles('STUDENT'), applicationController.withdrawApplication);

// Company Application Endpoints
router.get('/company', protect, authorizeRoles('COMPANY'), applicationController.getCompanyApplications);
router.get('/company/:id', protect, authorizeRoles('COMPANY'), applicationController.getCompanyApplicationById);
router.patch('/company/:id/shortlist', protect, authorizeRoles('COMPANY'), applicationController.shortlistApplication);
router.patch('/company/:id/reject', protect, authorizeRoles('COMPANY'), applicationController.rejectApplication);
router.patch('/company/:id/notes', protect, authorizeRoles('COMPANY'), applicationController.updateCompanyNotes);

module.exports = router;
