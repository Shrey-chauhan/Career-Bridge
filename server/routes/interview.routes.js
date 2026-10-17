const express = require('express');
const router = express.Router();

const interviewController = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(protect);

// Company & Student Interview Routes
router.post('/', authorizeRoles('COMPANY'), interviewController.createInterview);
router.get('/', interviewController.getInterviews);
router.get('/:id', interviewController.getInterviewById);
router.patch('/:id/reschedule', authorizeRoles('COMPANY'), interviewController.rescheduleInterview);
router.patch('/:id/cancel', interviewController.cancelInterview);
router.patch('/:id/confirm', authorizeRoles('STUDENT'), interviewController.confirmInterview);
router.patch('/:id/complete', authorizeRoles('COMPANY'), interviewController.completeInterview);
router.patch('/:id/result', authorizeRoles('COMPANY'), interviewController.updateInterviewResult);
router.patch('/:id/no-show', authorizeRoles('COMPANY'), interviewController.markNoShow);

module.exports = router;
