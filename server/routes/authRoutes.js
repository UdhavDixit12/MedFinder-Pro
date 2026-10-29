import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { requireAuth } from '../middleware/auth.js';
import { login, logout, me, register } from '../controllers/authController.js';

const router = Router();

export const nameRule = () =>
  body('name')
    .isString()
    .withMessage('Name is required.')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2–80 characters.')
    .matches(/^[\p{L}\p{M}' .-]+$/u)
    .withMessage('Name can only contain letters, spaces, apostrophes, dots and hyphens.');

export const passwordRule = (field = 'password') =>
  body(field)
    .isString()
    .withMessage('Password is required.')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8–128 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.');

const emailRule = () =>
  body('email')
    .isString()
    .withMessage('Email is required.')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .isLength({ max: 254 })
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false });

router.post('/register', authLimiter, [nameRule(), emailRule(), passwordRule()], validate, register);

router.post(
  '/login',
  authLimiter,
  [emailRule(), body('password').isString().notEmpty().withMessage('Password is required.').isLength({ max: 128 })],
  validate,
  login,
);

router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
