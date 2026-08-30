const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: { message: 'That route does not exist', code: 'NOT_FOUND' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // A raw Mongo duplicate-key error (E11000) means some unique-index check
  // was missed upstream (a service should have caught this with a clear
  // message before ever hitting the database) — this is a safety net, not
  // the primary defense, so it stays generic about which field collided.
  if (err.code === 11000 && !err.isOperational) {
    err = new AppError('That value is already in use.', 409, 'DUPLICATE_KEY');
  }

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
