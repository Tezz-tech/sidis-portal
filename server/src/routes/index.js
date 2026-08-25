const { Router } = require('express');

const router = Router();

router.use('/auth', require('./authRoutes'));
router.use('/public', require('./publicRoutes'));
router.use('/platform', require('./platformRoutes'));
router.use('/team', require('./teamRoutes'));
router.use('/organization', require('./orgSettingsRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/billing', require('./billingRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/exams', require('./examRoutes'));
router.use('/participants', require('./participantRoutes'));
router.use('/exam', require('./participantAuthRoutes'));

module.exports = router;
