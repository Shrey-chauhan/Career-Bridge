const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Public Authentication Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected Authentication Routes
router.get('/me', protect, authController.getMe);
router.get('/protected-test', protect, authController.protectedTest);

// RBAC Test Routes
router.get('/test/student', protect, authorizeRoles('STUDENT'), authController.studentTest);
router.get('/test/company', protect, authorizeRoles('COMPANY'), authController.companyTest);
router.get('/test/admin', protect, authorizeRoles('ADMIN'), authController.adminTest);

module.exports = router;
