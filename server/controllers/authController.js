import config from '../config/env.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';
import { cookieOptions, signToken } from '../middleware/auth.js';

function issueSession(res, user) {
  const token = signToken(user.id);
  res.cookie(config.cookie.name, token, cookieOptions(token));
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.valid;
  const existing = await User.exists({ email });
  if (existing) throw new AppError('An account with this email already exists. Try logging in.', 409, 'EMAIL_TAKEN');

  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();

  issueSession(res, user);
  sendSuccess(res, { user: user.toJSON() }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user ? await user.verifyPassword(password) : false;
  if (!ok) throw new AppError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS');

  issueSession(res, user);
  sendSuccess(res, { user: user.toJSON() });
});

export const logout = (_req, res) => {
  res.clearCookie(config.cookie.name, cookieOptions());
  sendSuccess(res, { loggedOut: true });
};

export const me = (req, res) => sendSuccess(res, { user: req.user.toJSON() });
