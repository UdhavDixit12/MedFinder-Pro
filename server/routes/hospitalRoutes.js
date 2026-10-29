import { Router } from 'express';
import { param, query } from 'express-validator';
import validate from '../middleware/validate.js';
import { searchLimiter } from '../middleware/rateLimiters.js';
import { getHospital, listCategories, searchHospitals } from '../controllers/hospitalController.js';
import { SEARCH_TYPES } from '../services/facilityCategories.js';

export const MIN_RADIUS = 500;
export const MAX_RADIUS = 25000;

const router = Router();

const optionalCoords = [
  query('lat').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90.').toFloat(),
  query('lon').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }).withMessage('lon must be between -180 and 180.').toFloat(),
];

router.get('/categories', listCategories);

router.get(
  '/search',
  searchLimiter,
  [
    query('location')
      .optional()
      .isString()
      .customSanitizer((v) => v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim())
      .isLength({ max: 200 })
      .withMessage('Location must be 200 characters or fewer.'),
    ...optionalCoords,
    query('lat').custom((lat, { req }) => {
      const hasLat = req.query.lat !== undefined && req.query.lat !== '';
      const hasLon = req.query.lon !== undefined && req.query.lon !== '';
      if (hasLat !== hasLon) throw new Error('Provide both lat and lon, or neither.');
      return true;
    }),
    query('radius')
      .optional()
      .isInt({ min: MIN_RADIUS, max: MAX_RADIUS })
      .withMessage(`Radius must be between ${MIN_RADIUS} and ${MAX_RADIUS} metres.`)
      .toInt(),
    query('type').optional().isIn(SEARCH_TYPES).withMessage(`Type must be one of: ${SEARCH_TYPES.join(', ')}.`),
  ],
  validate,
  searchHospitals,
);

router.get(
  '/:osmType/:osmId',
  searchLimiter,
  [
    param('osmType').isIn(['node', 'way', 'relation']).withMessage('osmType must be node, way or relation.'),
    param('osmId').isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).withMessage('osmId must be a positive integer.').toInt(),
    ...optionalCoords,
  ],
  validate,
  getHospital,
);

export default router;
