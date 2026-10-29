import Favourite from '../models/Favourite.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';

export const listFavourites = asyncHandler(async (req, res) => {
  const favourites = await Favourite.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(500);
  sendSuccess(res, { favourites: favourites.map((f) => f.toJSON()) });
});

export const addFavourite = asyncHandler(async (req, res) => {
  const { osmType, osmId, name, category, categoryLabel, lat, lon, address, phones } = req.valid;
  const snapshot = {
    name: name || null,
    category: category || 'other',
    categoryLabel: categoryLabel || null,
    lat,
    lon,
    address: address || null,
    phones: Array.isArray(phones) ? phones.slice(0, 5) : [],
  };

  const favourite = await Favourite.findOneAndUpdate(
    { user: req.user._id, osmType, osmId },
    { $set: { snapshot }, $setOnInsert: { user: req.user._id, osmType, osmId } },
    { upsert: true, new: true, runValidators: true, includeResultMetadata: true },
  );
  const created = !favourite.lastErrorObject?.updatedExisting;
  sendSuccess(res, { favourite: favourite.value.toJSON(), created }, created ? 201 : 200);
});

export const removeFavourite = asyncHandler(async (req, res) => {
  const { osmType, osmId } = req.valid;
  const result = await Favourite.deleteOne({ user: req.user._id, osmType, osmId });
  if (result.deletedCount === 0) throw new AppError('This facility is not in your saved list.', 404, 'NOT_FOUND');
  sendSuccess(res, { removed: true, id: `${osmType}/${osmId}` });
});
