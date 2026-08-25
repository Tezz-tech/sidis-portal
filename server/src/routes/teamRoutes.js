const { Router } = require('express');
const teamController = require('../controllers/teamController');
const validate = require('../middleware/validate');
const { requireStaffAuth, requireRole } = require('../middleware/auth');
const { inviteStaffSchema } = require('../validators/authValidators');
const { updateRoleSchema, updateStatusSchema } = require('../validators/teamValidators');

const router = Router();

router.use(requireStaffAuth);

router.get('/', teamController.list);
router.post('/', requireRole('org_admin'), validate(inviteStaffSchema), teamController.invite);
router.patch('/:id/role', requireRole('org_admin'), validate(updateRoleSchema), teamController.updateRole);
router.patch('/:id/status', requireRole('org_admin'), validate(updateStatusSchema), teamController.setStatus);

module.exports = router;
