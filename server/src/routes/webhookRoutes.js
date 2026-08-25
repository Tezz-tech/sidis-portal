const { Router } = require('express');
const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = Router();

router.post('/paystack', express.raw({ type: 'application/json' }), webhookController.paystackWebhook);

module.exports = router;
