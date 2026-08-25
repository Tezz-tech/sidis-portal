const paystackService = require('../services/paystackService');
const billingService = require('../services/billingService');
const logger = require('../config/logger');

async function paystackWebhook(req, res) {
  const signature = req.headers['x-paystack-signature'];
  const rawBody = req.body; // Buffer, thanks to express.raw() on this route

  if (!signature || !paystackService.verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Rejected Paystack webhook with invalid signature');
    return res.status(401).end();
  }

  // Always respond 200 quickly; Paystack retries on non-2xx.
  res.status(200).end();

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    logger.error({ err }, 'Failed to parse Paystack webhook body');
    return;
  }

  if (event.event === 'charge.success') {
    try {
      await billingService.handleChargeSuccess(event.data.reference);
    } catch (err) {
      logger.error({ err, reference: event.data?.reference }, 'Failed to process charge.success webhook');
    }
  }
}

module.exports = { paystackWebhook };
