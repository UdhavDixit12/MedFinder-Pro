import mongoose from 'mongoose';
import config from '../config/env.js';
import AppError from '../utils/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let error = err;

  if (err?.type === 'entity.parse.failed') {
    error = new AppError('Request body is not valid JSON.', 400, 'INVALID_JSON');
  } else if (err?.type === 'entity.too.large') {
    error = new AppError('Request body is too large.', 413, 'PAYLOAD_TOO_LARGE');
  } else if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    error = new AppError('Some fields are invalid.', 400, 'VALIDATION_ERROR', { fields });
  } else if (err instanceof mongoose.Error.CastError) {
    error = new AppError('Invalid identifier.', 400, 'INVALID_ID');
  } else if (err?.code === 11000) {
    error = new AppError('This record already exists.', 409, 'DUPLICATE');
  } else if (
    err?.name === 'MongooseServerSelectionError' ||
    err?.name === 'MongoNotConnectedError' ||
    /buffering timed out/i.test(err?.message || '')
  ) {
    error = new AppError('The database is temporarily unavailable.', 503, 'DB_UNAVAILABLE');
  } else if (!(err instanceof AppError)) {
    console.error('[error]', err);
    error = new AppError('Something went wrong on our side. Please try again.', 500, 'INTERNAL_ERROR');
  }

  if (error.statusCode >= 500 && !config.isTest) {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.code}: ${error.message}`);
  }

  const body = { success: false, error: { message: error.message, code: error.code } };
  if (error.details) body.error.details = error.details;
  res.status(error.statusCode).json(body);
}
