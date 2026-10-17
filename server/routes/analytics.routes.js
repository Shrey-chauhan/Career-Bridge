const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All analytics endpoints are strictly restricted to ADMIN and TPO roles
router.use(protect);
router.use(authorizeRoles('ADMIN', 'TPO'));

router.get('/overview', analyticsController.getOverview);
router.get('/funnel', analyticsController.getFunnel);
router.get('/trends', analyticsController.getTrends);
router.get('/companies', analyticsController.getCompanies);
router.get('/jobs', analyticsController.getJobs);
router.get('/branches', analyticsController.getBranches);
router.get('/interviews', analyticsController.getInterviews);
router.get('/drives', analyticsController.getDrives);
router.get('/insights', analyticsController.getInsights);
router.get('/export/:type', analyticsController.exportCsv);

module.exports = router;
