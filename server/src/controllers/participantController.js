const participantService = require('../services/participantService');

async function list(req, res, next) {
  try {
    const result = await participantService.listParticipants(req.tenant, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const participant = await participantService.createParticipant(req.tenant, req.body);
    res.status(201).json({ participant });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const participant = await participantService.updateParticipant(req.tenant, req.params.id, req.body);
    res.json({ participant });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await participantService.deleteParticipant(req.tenant, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function bulkImport(req, res, next) {
  try {
    const result = await participantService.importParticipants(req.tenant, req.body.rows);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, bulkImport };
