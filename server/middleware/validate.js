import { validationResult, matchedData } from 'express-validator';
import AppError from '../utils/AppError.js';

/**
 * Runs after express-validator chains. On failure responds with 400 and a
 * field -> message map. On success exposes sanitized values as req.valid.
 */
export default function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const fields = {};
    for (const err of result.array({ onlyFirstError: true })) {
      fields[err.path] = err.msg;
    }
    const first = Object.values(fields)[0];
    return next(new AppError(first || 'Invalid request.', 400, 'VALIDATION_ERROR', { fields }));
  }
  req.valid = matchedData(req, { locations: ['body', 'query', 'params'] });
  return next();
}
