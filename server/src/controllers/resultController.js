const resultService = require('../services/resultService');
const { overrideScoreSchema } = require('../validators/resultValidators');

async function listResults(req, res, next) {
  try {
    const results = await resultService.listResults(req.tenant, req.params.id, req.query);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

async function getResultDetail(req, res, next) {
  try {
    const result = await resultService.getResultDetail(req.tenant, req.params.id, req.params.attemptId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
}

async function overrideScore(req, res, next) {
  try {
    const parsed = overrideScoreSchema.parse(req.body);
    const attempt = await resultService.overrideScore(req.tenant, req.params.id, req.params.attemptId, parsed, req.tenant.userId);
    res.json({ attempt });
  } catch (err) {
    next(err);
  }
}

async function exportResultsCsv(req, res, next) {
  try {
    const csv = await resultService.exportResultsCsv(req.tenant, req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="results-${req.params.id}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

async function retryGrading(req, res, next) {
  try {
    const result = await resultService.retryGrading(req.tenant, req.params.id, req.params.attemptId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
}

module.exports = { listResults, getResultDetail, overrideScore, exportResultsCsv, retryGrading };
