const examService = require('../services/examService');
const questionService = require('../services/questionService');
const generationJobService = require('../services/generationJobService');

async function create(req, res, next) {
  try {
    const exam = await examService.createExam(req.tenant, req.body);
    res.status(201).json({ exam });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const exams = await examService.listExams(req.tenant, req.query);
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const exam = await examService.getExam(req.tenant, req.params.id);
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function updateDetails(req, res, next) {
  try {
    const exam = await examService.updateDetails(req.tenant, req.params.id, req.body);
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function updateConfig(req, res, next) {
  try {
    const exam = await examService.updateConfig(req.tenant, req.params.id, req.body);
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function confirmReview(req, res, next) {
  try {
    const exam = await examService.confirmReview(req.tenant, req.params.id, req.tenant.userId);
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function close(req, res, next) {
  try {
    const exam = await examService.closeExam(req.tenant, req.params.id, req.tenant.userId);
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function requestGeneration(req, res, next) {
  try {
    const result = await generationJobService.requestGeneration(req.tenant, req.params.id, req.body);
    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
}

async function estimateGenerationCost(req, res, next) {
  try {
    const count = Number(req.query.count) || 0;
    const estimatedCost = await generationJobService.estimateCost(count);
    res.json({ estimatedCost });
  } catch (err) {
    next(err);
  }
}

async function generationStatus(req, res, next) {
  try {
    const status = await generationJobService.getJobStatus(req.params.jobId);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function listQuestions(req, res, next) {
  try {
    const questions = await questionService.listQuestions(req.tenant, req.params.id);
    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

async function addQuestion(req, res, next) {
  try {
    const question = await questionService.addManualQuestion(req.tenant, req.params.id, req.body);
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const question = await questionService.updateQuestion(req.tenant, req.params.id, req.params.questionId, req.body);
    res.json({ question });
  } catch (err) {
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    await questionService.deleteQuestion(req.tenant, req.params.id, req.params.questionId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function reorderQuestions(req, res, next) {
  try {
    const questions = await questionService.reorderQuestions(req.tenant, req.params.id, req.body.questionIds);
    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

async function regenerateQuestion(req, res, next) {
  try {
    const question = await questionService.regenerateQuestion(req.tenant, req.params.id, req.params.questionId);
    res.json({ question });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  get,
  updateDetails,
  updateConfig,
  confirmReview,
  close,
  requestGeneration,
  estimateGenerationCost,
  generationStatus,
  listQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  regenerateQuestion,
};
