const { Router } = require('express');
const participantController = require('../controllers/participantController');
const validate = require('../middleware/validate');
const { requireStaffAuth, requireRole } = require('../middleware/auth');
const { createParticipantSchema, updateParticipantSchema, importParticipantsSchema } = require('../validators/participantValidators');

const router = Router();

router.use(requireStaffAuth);
router.use(requireRole('org_admin', 'creator'));

router.get('/', participantController.list);
router.post('/', validate(createParticipantSchema), participantController.create);
router.post('/import', validate(importParticipantsSchema), participantController.bulkImport);
router.patch('/:id', validate(updateParticipantSchema), participantController.update);
router.delete('/:id', participantController.remove);

module.exports = router;
