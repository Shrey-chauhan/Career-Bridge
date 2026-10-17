const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const placementDriveController = require('../controllers/placementDrive.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Protect all admin routes for ADMIN & TPO roles
router.use(protect);
router.use(authorizeRoles('ADMIN', 'TPO'));

// Dashboard Overview
router.get('/dashboard', adminController.getDashboardMetrics);

// Student Management
router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentById);
router.patch('/students/:id/status', adminController.toggleStudentStatus);

// Company Management & Verification
router.get('/companies', adminController.getCompanies);
router.patch('/companies/:id/verify', adminController.verifyCompany);

// Monitoring Routes
router.get('/jobs', adminController.getJobs);
router.get('/applications', adminController.getApplications);
router.get('/interviews', adminController.getInterviews);

// Audit Trail Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Placement Drive Management
router.post('/drives', placementDriveController.createDrive);
router.get('/drives', placementDriveController.getDrives);
router.get('/drives/:id', placementDriveController.getDriveById);
router.put('/drives/:id', placementDriveController.updateDrive);
router.patch('/drives/:id/jobs', placementDriveController.associateJobsToDrive);

module.exports = router;
