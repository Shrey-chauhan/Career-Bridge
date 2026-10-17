const express = require('express');
const router = express.Router();

const companyController = require('../controllers/company.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All Company profile endpoints require Authentication + COMPANY Role
router.use(protect);
router.use(authorizeRoles('COMPANY'));

router.get('/profile', companyController.getProfile);
router.post('/profile', companyController.createProfile);
router.put('/profile', companyController.updateProfile);

module.exports = router;
