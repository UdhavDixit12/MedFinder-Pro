import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' });
}

/** Cookie options; when a token is given, the cookie expires together with it. */
export function cookieOptions(token) {
  const options = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
  };
  const exp = token ? jwt.decode(token)?.exp : null;
  if (exp) options.maxAge = Math.max(0, exp * 1000 - Date.now());
  return options;
}

function extractToken(req) {
  const fromCookie = req.cookies?.[config.cookie.name];
  if (fromCookie) return fromCookie;
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError('Please log in to continue.', 401, 'UNAUTHENTICATED');

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    throw new AppError('Your session has expired or is invalid. Please log in again.', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('Your account no longer exists. Please register again.', 401, 'INVALID_TOKEN');

  req.user = user;
  next();
});
