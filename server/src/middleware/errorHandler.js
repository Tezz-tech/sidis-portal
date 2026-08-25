const logger = require('../config/logger');

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: { message: 'That route does not exist', code: 'NOT_FOUND' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  } else {
    logger.warn({ code, path: req.path, method: req.method }, err.message);
  }

  const message = isOperational
    ? err.message
    : 'Something went wrong on our end. Try again in a moment.';

  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
