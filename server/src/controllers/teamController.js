const teamService = require('../services/teamService');
const authService = require('../services/authService');

async function list(req, res, next) {
  try {
    const users = await teamService.listTeam(req.tenant);
    res.json({ team: users.map(authService.toSafeUser) });
  } catch (err) {
    next(err);
  }
}

async function invite(req, res, next) {
  try {
    const user = await authService.inviteStaff({
      organizationId: req.tenant.organizationId,
      ...req.body,
      invitedBy: req.tenant.userId,
    });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function resendInvite(req, res, next) {
  try {
    const user = await authService.resendStaffInvite(req.tenant, req.params.id, req.tenant.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const user = await teamService.updateRole(req.tenant, req.params.id, req.body.role, req.tenant.userId);
    res.json({ user: authService.toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const user = await teamService.setStatus(req.tenant, req.params.id, req.body.status, req.tenant.userId);
    res.json({ user: authService.toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, invite, resendInvite, updateRole, setStatus };
