import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { addFavourite, listFavourites, removeFavourite } from '../controllers/favouriteController.js';
import { CATEGORY_KEYS } from '../services/facilityCategories.js';

const router = Router();
router.use(requireAuth);

const optionalText = (field, max) =>
  body(field).optional({ values: 'null' }).isString().withMessage(`${field} must be text.`).trim().isLength({ max });

router.get('/', listFavourites);

router.post(
  '/',
  [
    body('osmType').isIn(['node', 'way', 'relation']).withMessage('osmType must be node, way or relation.'),
    body('osmId').isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).withMessage('osmId must be a positive integer.').toInt(),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90.').toFloat(),
    body('lon').isFloat({ min: -180, max: 180 }).withMessage('lon must be between -180 and 180.').toFloat(),
    optionalText('name', 200),
    body('category').optional().isIn([...CATEGORY_KEYS, 'other']).withMessage('Unknown category.'),
    optionalText('categoryLabel', 60),
    optionalText('address', 300),
    body('phones').optional().isArray({ max: 5 }).withMessage('phones must be a list of up to 5 numbers.'),
    body('phones.*').isString().trim().isLength({ max: 40 }),
  ],
  validate,
  addFavourite,
);

router.delete(
  '/:osmType/:osmId',
  [
    param('osmType').isIn(['node', 'way', 'relation']).withMessage('osmType must be node, way or relation.'),
    param('osmId').isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).withMessage('osmId must be a positive integer.').toInt(),
  ],
  validate,
  removeFavourite,
);

export default router;
