const { Router } = require('express');
const platformController = require('../controllers/platformController');
const validate = require('../middleware/validate');
const { requireStaffAuth, requirePlatformOwner } = require('../middleware/auth');
const {
  createOrganizationSchema,
  grantCreditsSchema,
  suspendOrganizationSchema,
} = require('../validators/organizationValidators');
const { pricingConfigSchema } = require('../validators/billingValidators');

const router = Router();

router.use(requireStaffAuth, requirePlatformOwner);

router.get('/organizations', platformController.listOrganizations);
router.post('/organizations', validate(createOrganizationSchema), platformController.createOrganization);
router.get('/organizations/:id', platformController.getOrganization);
router.patch('/organizations/:id/status', validate(suspendOrganizationSchema), platformController.setOrganizationStatus);
router.post('/organizations/:id/credits/grant', validate(grantCreditsSchema), platformController.grantCredits);
router.get('/organizations/:id/ledger', platformController.getOrganizationLedger);

router.get('/pricing', platformController.getPricingConfig);
router.put('/pricing', validate(pricingConfigSchema), platformController.updatePricingConfig);

router.get('/payments', platformController.listPayments);
router.get('/metrics', platformController.getMetrics);

module.exports = router;
