import config from '../config/env.js';
import AppError from '../utils/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defence-in-depth against CSRF for cookie-authenticated requests: reject
 * state-changing requests whose Origin header is present but not allowed.
 */
export default function originCheck(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  const selfOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin === selfOrigin || config.clientOrigins.includes(origin)) return next();
  return next(new AppError('Request origin is not allowed.', 403, 'FORBIDDEN_ORIGIN'));
}
