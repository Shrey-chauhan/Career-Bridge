const express = require('express');
const router = express.Router();

const jobController = require('../controllers/job.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Company Job Management Endpoints
router.post('/', protect, authorizeRoles('COMPANY'), jobController.createJob);
router.get('/company', protect, authorizeRoles('COMPANY'), jobController.getCompanyJobs);
router.get('/company/:id', protect, authorizeRoles('COMPANY'), jobController.getCompanyJobById);
router.put('/company/:id', protect, authorizeRoles('COMPANY'), jobController.updateCompanyJob);
router.delete('/company/:id', protect, authorizeRoles('COMPANY'), jobController.deleteCompanyJob);
router.patch('/company/:id/publish', protect, authorizeRoles('COMPANY'), jobController.publishCompanyJob);
router.patch('/company/:id/close', protect, authorizeRoles('COMPANY'), jobController.closeCompanyJob);

// Student Discovery & Eligibility Endpoints
router.get('/', protect, authorizeRoles('STUDENT'), jobController.getPublishedJobs);
router.get('/:id/eligibility', protect, authorizeRoles('STUDENT'), jobController.checkStudentEligibility);
router.get('/:id', protect, jobController.getPublishedJobById);

module.exports = router;
