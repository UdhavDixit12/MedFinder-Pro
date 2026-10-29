import User from '../models/User.js';
import Favourite from '../models/Favourite.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const getProfile = asyncHandler(async (req, res) => {
  const favouriteCount = await Favourite.countDocuments({ user: req.user._id });
  sendSuccess(res, { user: req.user.toJSON(), stats: { favouriteCount } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, homeLocation } = req.valid;
  if (name === undefined && homeLocation === undefined) {
    throw new AppError('Nothing to update.', 400, 'VALIDATION_ERROR');
  }
  if (name !== undefined) req.user.name = name;
  if (homeLocation !== undefined) req.user.homeLocation = homeLocation;
  await req.user.save();
  sendSuccess(res, { user: req.user.toJSON() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.valid;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(currentPassword))) {
    throw new AppError('Your current password is incorrect.', 400, 'INVALID_CREDENTIALS', {
      fields: { currentPassword: 'Your current password is incorrect.' },
    });
  }
  await user.setPassword(newPassword);
  await user.save();
  sendSuccess(res, { updated: true });
});
