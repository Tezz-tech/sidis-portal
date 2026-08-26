const pricingService = require('../services/pricingService');
const organizationService = require('../services/organizationService');
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

// Creates the workspace immediately — same underlying action as the
// platform owner's "New workspace" flow (org + invited admin + invite
// email) — rather than only notifying the owner and waiting on a manual
// follow-up. The owner still gets a heads-up email, but it's informational.
async function submitLead(req, res, next) {
  try {
    const { organizationName, firstName, lastName, email, phone, organizationType, message } = req.body;
    const org = await organizationService.createSelfServeOrganization({
      name: organizationName,
      type: organizationType,
      adminEmail: email,
      adminFirstName: firstName,
      adminLastName: lastName,
    });

    if (env.PLATFORM_OWNER_EMAIL) {
      await emailService.send({
        to: env.PLATFORM_OWNER_EMAIL,
        subject: `New self-serve workspace: ${organizationName}`,
        html: `
          <p>Organization: ${organizationName} (${organizationType}) — workspace: ${org.slug}</p>
          <p>Admin: ${firstName} ${lastName} — ${email}${phone ? ` — ${phone}` : ''}</p>
          ${message ? `<p>${message}</p>` : ''}
        `,
      }).catch(() => {}); // best-effort notification only — must never block the signup itself
    }

    res.status(201).json({ organizationSlug: org.slug });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPricing, submitLead };
