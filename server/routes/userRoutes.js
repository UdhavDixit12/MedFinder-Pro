import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { changePassword, getProfile, updateProfile } from '../controllers/userController.js';
import { nameRule, passwordRule } from './authRoutes.js';

const router = Router();
router.use(requireAuth);

router.get('/profile', getProfile);

router.patch(
  '/profile',
  [
    nameRule().optional(),
    body('homeLocation')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 120 })
      .withMessage('Home location must be 120 characters or fewer.'),
  ],
  validate,
  updateProfile,
);

router.patch(
  '/password',
  authLimiter,
  [body('currentPassword').isString().notEmpty().withMessage('Current password is required.'), passwordRule('newPassword')],
  validate,
  changePassword,
);

export default router;
