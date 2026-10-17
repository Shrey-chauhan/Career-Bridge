const express = require('express');
const router = express.Router();

const resumeController = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { handleUpload } = require('../middleware/upload.middleware');

// Student Resume Management Endpoints
router.post('/', protect, authorizeRoles('STUDENT'), handleUpload, resumeController.uploadResume);
router.get('/me', protect, authorizeRoles('STUDENT'), resumeController.getMyResume);
router.delete('/:id', protect, authorizeRoles('STUDENT'), resumeController.deleteResume);

// Secure Resume Access Endpoint (Student / Company / Admin authorization checked in service)
router.get('/:id', protect, resumeController.getResumeById);

module.exports = router;
