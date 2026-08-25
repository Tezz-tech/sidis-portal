const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireStaffAuth, requireRole } = require('../middleware/auth');

const router = Router();

router.use(requireStaffAuth, requireRole('org_admin', 'creator'));
router.get('/', dashboardController.get);

module.exports = router;
