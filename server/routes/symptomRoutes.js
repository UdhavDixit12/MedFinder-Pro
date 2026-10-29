import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { symptomLimiter } from '../middleware/rateLimiters.js';
import { check, getCatalog } from '../controllers/symptomController.js';
import { RED_FLAG_IDS, SYMPTOM_IDS } from '../services/symptomKnowledge.js';

const router = Router();

router.get('/catalog', getCatalog);

router.post(
  '/check',
  symptomLimiter,
  [
    body('symptoms').optional().isArray({ max: 20 }).withMessage('Select up to 20 symptoms.'),
    body('symptoms.*').isIn(SYMPTOM_IDS).withMessage('Unknown symptom selected.'),
    body('redFlags').optional().isArray({ max: 20 }).withMessage('Invalid warning signs list.'),
    body('redFlags.*').isIn(RED_FLAG_IDS).withMessage('Unknown warning sign selected.'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be text.')
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be 1000 characters or fewer.'),
    body('ageGroup').optional({ values: 'falsy' }).isIn(['infant', 'child', 'adult', 'older_adult', 'pregnant']).withMessage('Invalid age group.'),
    body('duration').optional({ values: 'falsy' }).isIn(['under_day', '1_3_days', '3_7_days', 'over_week']).withMessage('Invalid duration.'),
  ],
  validate,
  check,
);

export default router;
