import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';
import { geocode, reverseGeocode } from '../services/geocodingService.js';
import { getFacility, searchFacilities } from '../services/overpassService.js';
import { CATEGORIES, SEARCH_TYPES } from '../services/facilityCategories.js';

export const DEFAULT_LOCATION = 'Bhiwani, Haryana, India';

export const searchHospitals = asyncHandler(async (req, res) => {
  const { location, lat, lon, radius = 5000, type = 'all' } = req.valid;

  let place;
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const label = await reverseGeocode(lat, lon);
    place = { label: label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`, name: null, lat, lon, source: 'coordinates' };
  } else {
    const query = location || DEFAULT_LOCATION;
    const geo = await geocode(query);
    place = { ...geo, query, source: 'geocoded' };
  }

  const result = await searchFacilities({ lat: place.lat, lon: place.lon, radius, type });

  sendSuccess(res, {
    location: place,
    query: { radius, type },
    facilities: result.facilities,
    total: result.total,
    truncated: result.truncated,
    source: result.source,
  });
});

export const getHospital = asyncHandler(async (req, res) => {
  const { osmType, osmId, lat, lon } = req.valid;
  const origin = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  const { facility, cached } = await getFacility(osmType, osmId, origin);
  sendSuccess(res, { facility, source: { provider: 'OpenStreetMap Overpass API', cached, attribution: '© OpenStreetMap contributors, ODbL' } });
});

export const listCategories = (_req, res) =>
  sendSuccess(res, {
    defaultLocation: DEFAULT_LOCATION,
    types: SEARCH_TYPES.map((key) => ({ key, label: key === 'all' ? 'All facilities' : CATEGORIES[key].label })),
  });
