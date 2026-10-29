import config from '../config/env.js';
import AppError from '../utils/AppError.js';
import TTLCache from '../utils/ttlCache.js';
import { fetchWithTimeout, readJson } from '../utils/http.js';

const SERVICE = 'The geocoding service (Nominatim)';
const cache = new TTLCache({ ttlMs: 24 * 60 * 60 * 1000, maxEntries: 1000 });

// Nominatim usage policy: max 1 request/second for the whole application.
const MIN_INTERVAL_MS = config.isTest ? 0 : 1100;
let queue = Promise.resolve();
let lastRequestAt = 0;

function throttled(task) {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => {});
  return run;
}

function headers() {
  return {
    'User-Agent': config.osm.userAgent,
    Accept: 'application/json',
    'Accept-Language': 'en',
  };
}

async function nominatimRequest(path, params) {
  const url = new URL(`${config.osm.nominatimUrl}${path}`);
  Object.entries({ format: 'jsonv2', ...params }).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  if (config.osm.contactEmail) url.searchParams.set('email', config.osm.contactEmail);

  const response = await throttled(() =>
    fetchWithTimeout(url, { headers: headers() }, config.osm.geocodeTimeoutMs, SERVICE),
  );

  if (response.status === 429) {
    throw new AppError('The geocoding service is rate limiting requests. Please wait a moment and try again.', 503, 'UPSTREAM_RATE_LIMITED');
  }
  if (response.status === 403) {
    throw new AppError('The geocoding service refused the request. Check OSM_USER_AGENT configuration.', 502, 'UPSTREAM_FORBIDDEN');
  }
  if (!response.ok) {
    throw new AppError(`${SERVICE} returned an error (HTTP ${response.status}).`, 502, 'UPSTREAM_ERROR');
  }
  return readJson(response, SERVICE);
}

const toPlace = (item) => ({
  label: item.display_name,
  name: item.name || item.display_name?.split(',')[0] || null,
  lat: Number(item.lat),
  lon: Number(item.lon),
  type: item.type || null,
  osmType: item.osm_type || null,
  osmId: item.osm_id || null,
  boundingBox: Array.isArray(item.boundingbox) ? item.boundingbox.map(Number) : null,
});

const SETTLEMENT_TYPES = new Set(['city', 'town', 'village', 'suburb', 'hamlet', 'neighbourhood', 'quarter']);
const normaliseName = (s) => (s || '').trim().toLowerCase();

// Nominatim often ranks a district boundary above the town of the same name; the boundary's
// centroid can be many km from the town, which would centre a small-radius search on farmland.
export function pickBestMatch(results) {
  const [top] = results;
  const isBroadArea = top.category === 'boundary' && Number(top.place_rank) < 13;
  if (!isBroadArea) return top;
  const settlement = results.find(
    (r) => r.category === 'place' && SETTLEMENT_TYPES.has(r.type) && normaliseName(r.name) === normaliseName(top.name),
  );
  return settlement || top;
}

/**
 * Forward-geocode a free-text location. Returns the best match.
 */
export async function geocode(query) {
  const key = `fwd:${query.trim().toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  const data = await nominatimRequest('/search', { q: query, limit: 5, addressdetails: 0 });
  if (!Array.isArray(data)) {
    throw new AppError(`${SERVICE} returned an unexpected response.`, 502, 'UPSTREAM_BAD_RESPONSE');
  }
  if (data.length === 0) {
    throw new AppError(`We couldn't find a place called "${query}". Try a more specific name, e.g. "Bhiwani, Haryana".`, 404, 'LOCATION_NOT_FOUND');
  }
  const place = toPlace(pickBestMatch(data));
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon)) {
    throw new AppError(`${SERVICE} returned invalid coordinates.`, 502, 'UPSTREAM_BAD_RESPONSE');
  }
  cache.set(key, place);
  return { ...place, cached: false };
}

/**
 * Reverse-geocode coordinates into a human-readable label. Failures are
 * non-fatal: callers fall back to showing coordinates.
 */
export async function reverseGeocode(lat, lon) {
  const key = `rev:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  try {
    const data = await nominatimRequest('/reverse', { lat, lon, zoom: 14 });
    const label = data && !data.error ? data.display_name || null : null;
    cache.set(key, label);
    return label;
  } catch {
    return null;
  }
}

export const _clearGeocodeCache = () => cache.clear();
