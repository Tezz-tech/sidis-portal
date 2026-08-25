const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');
const { scoped } = require('./scopedRepo');
const { Document } = require('../models');
const { extractText } = require('./extractionService');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

function uploadBuffer(buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'sidis-portal/documents', filename_override: filename, use_filename: true },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

async function createDocument(tenant, file) {
  const uploadResult = await uploadBuffer(file.buffer, file.originalname);

  const doc = await scoped(Document, tenant).create({
    uploadedBy: tenant.userId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    storageUrl: uploadResult.secure_url,
    extractionStatus: 'pending',
  });

  // Extraction runs inline — it takes well under a second for typical
  // documents and the client is already waiting on the upload response, so a
  // queue would only add latency here. Generation (the slow, AI-bound step)
  // is what runs through the job queue.
  try {
    const text = await extractText(file.buffer, file.mimetype);
    doc.extractedText = text;
    doc.charCount = text.length;
    doc.extractionStatus = 'done';
    await doc.save();
  } catch (err) {
    doc.extractionStatus = 'failed';
    doc.extractionError = err instanceof AppError ? err.message : 'Extraction failed';
    await doc.save();
    logger.warn({ err, documentId: doc._id }, 'Document extraction failed');
  }

  return doc;
}

async function listDocuments(tenant) {
  return scoped(Document, tenant).find({}, '-extractedText').sort({ createdAt: -1 });
}

async function getDocument(tenant, id) {
  const doc = await scoped(Document, tenant).findById(id);
  if (!doc) throw new AppError('Document not found', 404, 'NOT_FOUND');
  return doc;
}

async function deleteDocument(tenant, id) {
  const result = await scoped(Document, tenant).deleteOne({ _id: id });
  if (result.deletedCount === 0) throw new AppError('Document not found', 404, 'NOT_FOUND');
}

module.exports = { createDocument, listDocuments, getDocument, deleteDocument };
