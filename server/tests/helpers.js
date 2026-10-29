/**
 * Test helpers. External HTTP services (Nominatim, Overpass, AI) are mocked
 * here ONLY for automated tests; the running application always calls the
 * real services.
 */
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/medfinder_pro_test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.OVERPASS_URLS = 'https://overpass-a.test/api/interpreter,https://overpass-b.test/api/interpreter';
process.env.NOMINATIM_URL = 'https://nominatim.test';
process.env.OVERPASS_FAILOVER_TIMEOUT_MS = '200';
process.env.JWT_EXPIRES_IN = '2h';
process.env.AI_API_KEY = '';

const realFetch = globalThis.fetch;

export const jsonResponse = (body, status = 200) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Install a fetch mock. `handler(url, init)` returns a Response (or throws). */
export function mockFetch(handler) {
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });
    return handler(url, init, calls.length);
  };
  return calls;
}

export function restoreFetch() {
  globalThis.fetch = realFetch;
}

export const BHIWANI = { lat: 28.7931703, lon: 76.1391283 };

export const nominatimBhiwani = [
  { display_name: 'Bhiwani, Haryana, 125021, India', name: 'Bhiwani', lat: String(BHIWANI.lat), lon: String(BHIWANI.lon), type: 'city', osm_type: 'node', osm_id: 1395398115 },
];

export const overpassSample = {
  osm3s: { timestamp_osm_base: '2026-10-28T00:00:00Z' },
  elements: [
    {
      type: 'node',
      id: 6991544406,
      lat: 28.7975922,
      lon: 76.1454906,
      tags: { amenity: 'hospital', name: 'Ishwar Children Hospital', 'addr:full': 'Rohtak Gate', 'addr:district': 'Bhiwani', 'addr:state': 'Haryana', 'addr:postcode': '127021' },
    },
    {
      type: 'way',
      id: 123456,
      center: { lat: 28.80, lon: 76.14 },
      tags: { amenity: 'pharmacy', phone: '+91 98765 43210; 01664-123456' },
    },
    { type: 'node', id: 99, lat: 28.79, lon: 76.139, tags: { healthcare: 'clinic', name: 'Test Clinic', website: 'example.org' } },
    { type: 'node', id: 100, tags: { amenity: 'hospital', name: 'No coordinates' } },
    { type: 'node', id: 101, lat: 29.5, lon: 77.5, tags: { amenity: 'hospital', name: 'Far away' } },
  ],
};

export async function loadApp() {
  const { createApp } = await import('../app.js');
  const { connectDB, disconnectDB } = await import('../config/db.js');
  const { assertConfig } = await import('../config/env.js');
  assertConfig();
  return { createApp, connectDB, disconnectDB };
}
