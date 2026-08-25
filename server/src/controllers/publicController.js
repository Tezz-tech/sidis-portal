const pricingService = require('../services/pricingService');
const emailService = require('../services/emailService');
const env = require('../config/env');

async function getPricing(req, res, next) {
  try {
    const pricing = await pricingService.getPricingConfig();
    res.json({ packs: pricing.packs.filter((p) => p.isActive) });
  } catch (err) {
    next(err);
  }
}

async function submitLead(req, res, next) {
  try {
    const { organizationName, contactName, email, phone, organizationType, message } = req.body;
    if (env.PLATFORM_OWNER_EMAIL) {
      await emailService.send({
        to: env.PLATFORM_OWNER_EMAIL,
        subject: `New workspace request: ${organizationName}`,
        html: `
          <p>Organization: ${organizationName} (${organizationType})</p>
          <p>Contact: ${contactName} — ${email}${phone ? ` — ${phone}` : ''}</p>
          ${message ? `<p>${message}</p>` : ''}
        `,
      });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getPricing, submitLead };
