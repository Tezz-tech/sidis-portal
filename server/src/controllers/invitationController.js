const invitationService = require('../services/invitationService');

async function list(req, res, next) {
  try {
    const invitations = await invitationService.listInvitations(req.tenant, req.params.id);
    res.json({ invitations });
  } catch (err) {
    next(err);
  }
}

async function publishAndInvite(req, res, next) {
  try {
    const result = await invitationService.publishAndInvite(req.tenant, req.params.id, req.body.participantIds, req.tenant.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function sendMore(req, res, next) {
  try {
    const invitations = await invitationService.sendMore(req.tenant, req.params.id, req.body.participantIds, req.tenant.userId);
    res.status(201).json({ invitations });
  } catch (err) {
    next(err);
  }
}

async function resend(req, res, next) {
  try {
    const invitation = await invitationService.resend(req.tenant, req.params.id, req.params.invitationId);
    res.json({ invitation });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, publishAndInvite, sendMore, resend };
