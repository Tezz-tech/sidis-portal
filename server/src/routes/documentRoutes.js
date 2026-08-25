const { Router } = require('express');
const documentController = require('../controllers/documentController');
const { requireStaffAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = Router();

router.use(requireStaffAuth);
router.use(requireRole('org_admin', 'creator'));

router.get('/', documentController.list);
router.post('/', upload.single('file'), documentController.upload);
router.get('/:id', documentController.get);
router.delete('/:id', documentController.remove);

module.exports = router;
