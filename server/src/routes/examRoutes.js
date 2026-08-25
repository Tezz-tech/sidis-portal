const { Router } = require('express');
const examController = require('../controllers/examController');
const invitationController = require('../controllers/invitationController');
const monitorController = require('../controllers/monitorController');
const resultController = require('../controllers/resultController');
const validate = require('../middleware/validate');
const { requireStaffAuth, requireRole } = require('../middleware/auth');
const {
  createExamSchema,
  updateExamDetailsSchema,
  updateExamConfigSchema,
  generateQuestionsSchema,
} = require('../validators/examValidators');
const { manualQuestionSchema, updateQuestionSchema, reorderSchema } = require('../validators/questionValidators');
const { publishExamSchema, sendInvitationsSchema } = require('../validators/invitationValidators');

const router = Router();

router.use(requireStaffAuth);
router.use(requireRole('org_admin', 'creator'));

router.get('/', examController.list);
router.post('/', validate(createExamSchema), examController.create);
router.get('/:id', examController.get);
router.patch('/:id', validate(updateExamDetailsSchema), examController.updateDetails);
router.patch('/:id/config', validate(updateExamConfigSchema), examController.updateConfig);
router.post('/:id/confirm-review', examController.confirmReview);
router.post('/:id/close', examController.close);

router.get('/:id/generation/estimate', examController.estimateGenerationCost);
router.post('/:id/generate', validate(generateQuestionsSchema), examController.requestGeneration);
router.get('/:id/generation/:jobId', examController.generationStatus);

router.get('/:id/questions', examController.listQuestions);
router.post('/:id/questions', validate(manualQuestionSchema), examController.addQuestion);
router.patch('/:id/questions/reorder', validate(reorderSchema), examController.reorderQuestions);
router.patch('/:id/questions/:questionId', validate(updateQuestionSchema), examController.updateQuestion);
router.delete('/:id/questions/:questionId', examController.deleteQuestion);
router.post('/:id/questions/:questionId/regenerate', examController.regenerateQuestion);

router.get('/:id/invitations', invitationController.list);
router.post('/:id/publish', validate(publishExamSchema), invitationController.publishAndInvite);
router.post('/:id/invitations', validate(sendInvitationsSchema), invitationController.sendMore);
router.post('/:id/invitations/:invitationId/resend', invitationController.resend);

router.get('/:id/monitor', monitorController.getLiveMonitor);

router.get('/:id/results', resultController.listResults);
router.get('/:id/results/export', resultController.exportResultsCsv);
router.get('/:id/results/:attemptId', resultController.getResultDetail);
router.post('/:id/results/:attemptId/override', resultController.overrideScore);

module.exports = router;
