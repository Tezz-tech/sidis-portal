const { Router } = require('express');
const publicController = require('../controllers/publicController');
const validate = require('../middleware/validate');
const { leadSchema } = require('../validators/publicValidators');

const router = Router();

router.get('/pricing', publicController.getPricing);
router.post('/leads', validate(leadSchema), publicController.submitLead);

module.exports = router;
