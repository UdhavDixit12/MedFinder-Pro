import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

const handler = (message, code) => (_req, res) =>
  res.status(429).json({ success: false, error: { message, code } });

const make = (options, message, code = 'RATE_LIMITED') =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.disableRateLimit,
    handler: handler(message, code),
    ...options,
  });

export const apiLimiter = make({ windowMs: 15 * 60 * 1000, limit: 600 }, 'Too many requests. Please slow down.');

export const authLimiter = make(
  { windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true },
  'Too many sign-in attempts. Please wait 15 minutes and try again.',
);

export const searchLimiter = make(
  { windowMs: 60 * 1000, limit: 20 },
  'You are searching too quickly. Please wait a minute before searching again.',
);

export const symptomLimiter = make({ windowMs: 60 * 1000, limit: 15 }, 'Too many symptom checks. Please wait a minute.');
