const { Router } = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { requireStaffAuth } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimit');
const {
  loginSchema,
  acceptInviteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/authValidators');

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', requireStaffAuth, authController.logout);
router.post('/accept-invite', validate(acceptInviteSchema), authController.acceptInvite);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', requireStaffAuth, authController.me);

module.exports = router;
