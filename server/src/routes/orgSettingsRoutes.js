const { Router } = require('express');
const orgSettingsController = require('../controllers/orgSettingsController');
const validate = require('../middleware/validate');
const { requireStaffAuth, requireRole } = require('../middleware/auth');
const { updateOrgSettingsSchema } = require('../validators/orgSettingsValidators');

const router = Router();

router.use(requireStaffAuth);

router.get('/', orgSettingsController.get);
router.patch('/', requireRole('org_admin'), validate(updateOrgSettingsSchema), orgSettingsController.update);

module.exports = router;
