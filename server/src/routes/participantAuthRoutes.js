const { Router } = require('express');
const participantAuthController = require('../controllers/participantAuthController');
const validate = require('../middleware/validate');
const { requireParticipantAuth } = require('../middleware/auth');
const { otpRequestLimiter } = require('../middleware/rateLimit');
const { verifyCodeSchema, saveAnswerSchema, integrityEventSchema } = require('../validators/participantAuthValidators');

const router = Router();

router.get('/invite/:token', participantAuthController.getInvite);
router.post('/invite/:token/request-code', otpRequestLimiter, participantAuthController.requestCode);
router.post('/invite/:token/verify-code', validate(verifyCodeSchema), participantAuthController.verifyCode);

router.use(requireParticipantAuth);

router.post('/attempt/start', participantAuthController.startAttempt);
router.get('/attempt', participantAuthController.getState);
router.get('/attempt/status', participantAuthController.getStatus);
router.patch('/attempt/answers/:questionId', validate(saveAnswerSchema), participantAuthController.saveAnswer);
router.post('/attempt/integrity', validate(integrityEventSchema), participantAuthController.recordIntegrity);
router.post('/attempt/submit', participantAuthController.submit);
router.get('/attempt/result', participantAuthController.getResult);
router.get('/attempt/result/pdf', participantAuthController.getResultPdf);
router.post('/logout', participantAuthController.logout);

module.exports = router;
