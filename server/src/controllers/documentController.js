const documentService = require('../services/documentService');
const AppError = require('../utils/AppError');

async function upload(req, res, next) {
  try {
    if (!req.file) throw new AppError('Choose a file to upload', 400, 'NO_FILE');
    const doc = await documentService.createDocument(req.tenant, req.file);
    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentService.listDocuments(req.tenant);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const document = await documentService.getDocument(req.tenant, req.params.id);
    res.json({ document });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await documentService.deleteDocument(req.tenant, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, get, remove };
