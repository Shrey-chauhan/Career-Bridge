const express = require('express');
const router = express.Router();

const studentController = require('../controllers/student.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All Student profile endpoints require Authentication + STUDENT Role
router.use(protect);
router.use(authorizeRoles('STUDENT'));

router.get('/profile', studentController.getProfile);
router.post('/profile', studentController.createProfile);
router.put('/profile', studentController.updateProfile);

module.exports = router;
