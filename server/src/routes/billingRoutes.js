const { Router } = require('express');
const billingController = require('../controllers/billingController');
const validate = require('../middleware/validate');
const { requireStaffAuth, requireRole } = require('../middleware/auth');
const { initializePurchaseSchema } = require('../validators/billingValidators');

const router = Router();

router.use(requireStaffAuth);

router.get('/packs', billingController.getPacks);
router.get('/rates', billingController.getRates);
router.get('/balance', billingController.getBalance);
router.get('/ledger', billingController.getLedger);
router.post('/purchase', requireRole('org_admin'), validate(initializePurchaseSchema), billingController.initializePurchase);

module.exports = router;
