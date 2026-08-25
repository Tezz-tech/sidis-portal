const AppError = require('../utils/AppError');

/**
 * Validates req.body/query/params against a zod schema. On failure, throws a
 * 422 with field-level details rather than a generic message.
 */
function validate(schema, part = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      return next(new AppError('Some of the information you entered is not valid', 422, 'VALIDATION_ERROR', details));
    }
    req[part] = result.data;
    return next();
  };
}

module.exports = validate;
