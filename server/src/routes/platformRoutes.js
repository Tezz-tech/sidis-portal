const { Router } = require('express');
const platformController = require('../controllers/platformController');
const validate = require('../middleware/validate');
const { requireStaffAuth, requirePlatformOwner } = require('../middleware/auth');
const {
  createOrganizationSchema,
  grantCreditsSchema,
  adjustCreditsSchema,
  suspendOrganizationSchema,
  updateOrganizationSchema,
  updateOrgTeamRoleSchema,
  updateOrgTeamStatusSchema,
} = require('../validators/organizationValidators');
const { pricingConfigSchema } = require('../validators/billingValidators');

const router = Router();

router.use(requireStaffAuth, requirePlatformOwner);

router.get('/organizations', platformController.listOrganizations);
router.post('/organizations', validate(createOrganizationSchema), platformController.createOrganization);
router.get('/organizations/:id', platformController.getOrganization);
router.patch('/organizations/:id', validate(updateOrganizationSchema), platformController.updateOrganization);
router.patch('/organizations/:id/status', validate(suspendOrganizationSchema), platformController.setOrganizationStatus);
router.post('/organizations/:id/credits/grant', validate(grantCreditsSchema), platformController.grantCredits);
router.post('/organizations/:id/credits/adjust', validate(adjustCreditsSchema), platformController.adjustCredits);
router.get('/organizations/:id/ledger', platformController.getOrganizationLedger);

router.get('/organizations/:id/team', platformController.listOrgTeam);
router.patch('/organizations/:id/team/:userId/role', validate(updateOrgTeamRoleSchema), platformController.updateOrgTeamMemberRole);
router.patch('/organizations/:id/team/:userId/status', validate(updateOrgTeamStatusSchema), platformController.updateOrgTeamMemberStatus);

router.get('/organizations/:id/exams', platformController.listOrgExams);
router.post('/organizations/:id/exams/:examId/close', platformController.forceCloseExam);

router.get('/pricing', platformController.getPricingConfig);
router.put('/pricing', validate(pricingConfigSchema), platformController.updatePricingConfig);

router.get('/payments', platformController.listPayments);
router.get('/metrics', platformController.getMetrics);
router.get('/audit-log', platformController.getAuditLog);

module.exports = router;
