import config from '../config/env.js';
import AppError from '../utils/AppError.js';
import TTLCache from '../utils/ttlCache.js';
import { fetchWithTimeout, readJson } from '../utils/http.js';
import { haversineMeters } from '../utils/geo.js';
import { categorize, categoryLabel, filtersForType } from './facilityCategories.js';

const SERVICE = 'The OpenStreetMap Overpass API';
export const MAX_RESULTS = 300;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

const searchCache = new TTLCache({ ttlMs: 10 * 60 * 1000, maxEntries: 300 });
const elementCache = new TTLCache({ ttlMs: 30 * 60 * 1000, maxEntries: 1000 });
const inFlight = new Map();

const OSM_TYPES = new Set(['node', 'way', 'relation']);
export const isOsmType = (t) => OSM_TYPES.has(t);

// ---------------------------------------------------------------------------
// Query construction
// ---------------------------------------------------------------------------

const escapeValue = (v) => String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export function buildAroundQuery({ lat, lon, radius, type, timeoutSec = 25 }) {
  const filters = filtersForType(type);
  if (!filters.length) throw new AppError('Unsupported facility type.', 400, 'VALIDATION_ERROR');
  const around = `(around:${Math.round(radius)},${lat.toFixed(6)},${lon.toFixed(6)})`;
  const statements = filters.map(([k, v]) => `  nwr["${escapeValue(k)}"="${escapeValue(v)}"]${around};`).join('\n');
  return `[out:json][timeout:${timeoutSec}];\n(\n${statements}\n);\nout center tags;`;
}

export function buildElementQuery(osmType, osmId, timeoutSec = 15) {
  return `[out:json][timeout:${timeoutSec}];\n${osmType}(${Number(osmId)});\nout center tags;`;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

const pick = (tags, ...keys) => {
  for (const key of keys) {
    const value = tags[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const splitMulti = (value) =>
  value
    ? value
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const safeWebsite = (value) => {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

export function buildAddress(tags) {
  const full = pick(tags, 'addr:full');
  const street = [pick(tags, 'addr:housenumber'), pick(tags, 'addr:street')].filter(Boolean).join(' ');
  const parts = [
    pick(tags, 'addr:housename'),
    street || full,
    pick(tags, 'addr:place', 'addr:suburb', 'addr:neighbourhood'),
    pick(tags, 'addr:city', 'addr:town', 'addr:village'),
    pick(tags, 'addr:district'),
    pick(tags, 'addr:state'),
    pick(tags, 'addr:postcode'),
  ].filter(Boolean);
  const tokens = [];
  const seen = new Set();
  for (const part of parts) {
    for (const token of part.split(',').map((t) => t.trim()).filter(Boolean)) {
      const key = token.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        tokens.push(token);
      }
    }
  }
  return tokens.length ? tokens.join(', ') : null;
}

export function normalizeElement(el, origin) {
  if (!el || !isOsmType(el.type) || !Number.isFinite(el.id)) return null;
  const lat = Number.isFinite(el.lat) ? el.lat : el.center?.lat;
  const lon = Number.isFinite(el.lon) ? el.lon : el.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const tags = el.tags || {};
  const category = categorize(tags);
  const name = pick(tags, 'name', 'name:en', 'official_name', 'alt_name');

  return {
    id: `${el.type}/${el.id}`,
    osmType: el.type,
    osmId: el.id,
    name,
    category,
    categoryLabel: categoryLabel(category),
    lat,
    lon,
    address: buildAddress(tags),
    phones: [...new Set([...splitMulti(pick(tags, 'phone', 'contact:phone')), ...splitMulti(pick(tags, 'mobile', 'contact:mobile'))])],
    website: safeWebsite(pick(tags, 'website', 'contact:website', 'url')),
    email: pick(tags, 'email', 'contact:email'),
    openingHours: pick(tags, 'opening_hours'),
    emergency: pick(tags, 'emergency'),
    operator: pick(tags, 'operator'),
    operatorType: pick(tags, 'operator:type'),
    speciality: pick(tags, 'healthcare:speciality'),
    beds: pick(tags, 'beds'),
    wheelchair: pick(tags, 'wheelchair'),
    distanceMeters: origin ? Math.round(haversineMeters(origin.lat, origin.lon, lat, lon)) : null,
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    source: 'openstreetmap',
  };
}

// ---------------------------------------------------------------------------
// Transport with endpoint failover
// ---------------------------------------------------------------------------

// Endpoints that recently failed are tried last for a cool-down period.
const COOL_DOWN_MS = 5 * 60 * 1000;
const unhealthyUntil = new Map();
const markUnhealthy = (endpoint) => unhealthyUntil.set(endpoint, Date.now() + COOL_DOWN_MS);

function orderedEndpoints() {
  const now = Date.now();
  const all = config.osm.overpassUrls;
  const healthy = all.filter((e) => (unhealthyUntil.get(e) || 0) <= now);
  const cooling = all.filter((e) => (unhealthyUntil.get(e) || 0) > now);
  return [...healthy, ...cooling];
}

async function runQuery(query, timeoutMs = config.osm.overpassTimeoutMs) {
  const endpoints = orderedEndpoints();
  const deadline = Date.now() + timeoutMs * 1.75;
  let lastError;
  let attempts = 0;

  for (const [index, endpoint] of endpoints.entries()) {
    const startedAt = Date.now();
    const remaining = deadline - startedAt;
    if (remaining < 3000) break;
    attempts += 1;
    // Earlier endpoints get a shorter budget so a hanging server doesn't delay failover;
    // the last endpoint gets the full timeout.
    const isLast = index === endpoints.length - 1;
    const attemptTimeout = Math.min(isLast ? timeoutMs : Math.min(timeoutMs, config.osm.overpassFailoverTimeoutMs), remaining);
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'User-Agent': config.osm.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Accept: 'application/json',
          },
          body: new URLSearchParams({ data: query }).toString(),
        },
        attemptTimeout,
        SERVICE,
      );

      if (RETRYABLE_STATUS.has(response.status)) {
        lastError = new AppError(
          response.status === 429
            ? 'The Overpass API is rate limiting requests. Please wait a minute and try again.'
            : `The Overpass API is busy or unavailable (HTTP ${response.status}).`,
          503,
          response.status === 429 ? 'UPSTREAM_RATE_LIMITED' : 'UPSTREAM_UNAVAILABLE',
        );
        markUnhealthy(endpoint);
        continue;
      }
      if (!response.ok) {
        lastError = new AppError(`${SERVICE} returned an error (HTTP ${response.status}).`, 502, 'UPSTREAM_ERROR');
        markUnhealthy(endpoint);
        continue;
      }

      const data = await readJson(response, SERVICE);
      if (!data || !Array.isArray(data.elements)) {
        lastError = new AppError(`${SERVICE} returned an unexpected response.`, 502, 'UPSTREAM_BAD_RESPONSE');
        markUnhealthy(endpoint);
        continue;
      }
      if (typeof data.remark === 'string' && /runtime error|timed out|out of memory/i.test(data.remark)) {
        lastError = new AppError('The Overpass API could not finish the query in time. Try a smaller radius.', 504, 'UPSTREAM_TIMEOUT');
        continue;
      }

      return {
        elements: data.elements,
        endpoint: new URL(endpoint).host,
        dataTimestamp: data.osm3s?.timestamp_osm_base || null,
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      lastError = err instanceof AppError ? err : new AppError(`${SERVICE} request failed.`, 502, 'UPSTREAM_ERROR');
      markUnhealthy(endpoint);
    }
  }

  const error = lastError || new AppError(`${SERVICE} is not configured.`, 500, 'CONFIG_ERROR');
  error.details = { ...(error.details || {}), endpointsTried: attempts };
  throw error;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for real healthcare facilities around a point.
 * @returns {{ facilities: object[], total: number, truncated: boolean, source: object }}
 */
export async function searchFacilities({ lat, lon, radius, type }) {
  const key = `${lat.toFixed(4)}|${lon.toFixed(4)}|${radius}|${type}`;
  const cached = searchCache.get(key);
  if (cached) return { ...cached, source: { ...cached.source, cached: true } };
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    const query = buildAroundQuery({ lat, lon, radius, type });
    const result = await runQuery(query);
    const origin = { lat, lon };

    const facilities = result.elements
      .map((el) => normalizeElement(el, origin))
      .filter(Boolean)
      .filter((f) => f.distanceMeters <= radius * 1.05)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    facilities.forEach((f) => elementCache.set(f.id, f));

    const payload = {
      facilities: facilities.slice(0, MAX_RESULTS),
      total: facilities.length,
      truncated: facilities.length > MAX_RESULTS,
      source: {
        provider: 'OpenStreetMap Overpass API',
        endpoint: result.endpoint,
        dataTimestamp: result.dataTimestamp,
        fetchedAt: new Date().toISOString(),
        durationMs: result.durationMs,
        cached: false,
        attribution: '© OpenStreetMap contributors, ODbL',
      },
    };
    searchCache.set(key, payload);
    return payload;
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}

/** Fetch a single facility by its OSM element type and id. */
export async function getFacility(osmType, osmId, origin) {
  const id = `${osmType}/${osmId}`;
  let facility = elementCache.get(id);
  let fromCache = Boolean(facility);

  if (!facility) {
    const result = await runQuery(buildElementQuery(osmType, osmId), 20000);
    const el = result.elements.find((e) => e.type === osmType && e.id === Number(osmId));
    facility = el ? normalizeElement(el, null) : null;
    if (!facility) {
      throw new AppError('This facility was not found in OpenStreetMap. It may have been removed or merged.', 404, 'FACILITY_NOT_FOUND');
    }
    elementCache.set(id, facility);
    fromCache = false;
  }

  const distanceMeters = origin ? Math.round(haversineMeters(origin.lat, origin.lon, facility.lat, facility.lon)) : null;
  return { facility: { ...facility, distanceMeters }, cached: fromCache };
}

export function _clearOverpassCaches() {
  unhealthyUntil.clear();
  searchCache.clear();
  elementCache.clear();
  inFlight.clear();
}
