const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError('Upload a PDF or Word (.docx) file', 400, 'UNSUPPORTED_FILE_TYPE'));
    }
    return cb(null, true);
  },
});

module.exports = { upload, MAX_SIZE_BYTES };
