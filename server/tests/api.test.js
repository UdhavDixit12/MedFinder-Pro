import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { jsonResponse, loadApp, mockFetch, nominatimBhiwani, overpassSample, restoreFetch } from './helpers.js';

const request = (await import('supertest')).default;
const { createApp, connectDB, disconnectDB } = await loadApp();
const mongoose = (await import('mongoose')).default;
const { _clearOverpassCaches } = await import('../services/overpassService.js');
const { _clearGeocodeCache } = await import('../services/geocodingService.js');

const app = createApp();
let dbAvailable = true;

before(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    await mongoose.connection.dropDatabase();
  } catch (err) {
    dbAvailable = false;
    console.warn(`MongoDB not available (${err.message}); database tests will be skipped.`);
  }
});

after(async () => {
  restoreFetch();
  if (dbAvailable) {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
  }
});

function mockOsm({ geocode = nominatimBhiwani, overpass = overpassSample } = {}) {
  return mockFetch((url) => {
    if (url.startsWith('https://nominatim.test/search')) return jsonResponse(geocode);
    if (url.startsWith('https://nominatim.test/reverse')) return jsonResponse({ display_name: 'Near Bhiwani, Haryana' });
    if (url.includes('overpass')) return typeof overpass === 'function' ? overpass(url) : jsonResponse(overpass);
    throw new Error(`Unexpected fetch ${url}`);
  });
}

describe('GET /api/health', () => {
  test('reports status', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.aiSymptomChecker, 'not_configured');
  });
});

describe('GET /api/hospitals/search', () => {
  beforeEach(() => {
    _clearOverpassCaches();
    _clearGeocodeCache();
  });

  test('defaults to Bhiwani, geocodes and returns normalized facilities', async () => {
    const calls = mockOsm();
    const res = await request(app).get('/api/hospitals/search').expect(200);
    const { data } = res.body;
    assert.equal(data.location.label, 'Bhiwani, Haryana, 125021, India');
    assert.equal(data.location.query, 'Bhiwani, Haryana, India');
    assert.equal(data.query.radius, 5000);
    assert.equal(data.query.type, 'all');
    assert.equal(data.facilities[0].source, 'openstreetmap');
    assert.ok(data.facilities.every((f) => f.id === `${f.osmType}/${f.osmId}`));
    assert.match(calls[0].url, /q=Bhiwani/);
    assert.ok(calls[0].init.headers['User-Agent'], 'a User-Agent is sent to Nominatim');
  });

  test('accepts coordinates and reverse-geocodes the label', async () => {
    mockOsm();
    const res = await request(app).get('/api/hospitals/search?lat=28.79&lon=76.13&radius=2000&type=hospital').expect(200);
    assert.equal(res.body.data.location.source, 'coordinates');
    assert.equal(res.body.data.location.label, 'Near Bhiwani, Haryana');
  });

  test('validates parameters', async () => {
    let res = await request(app).get('/api/hospitals/search?radius=50').expect(400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    res = await request(app).get('/api/hospitals/search?type=zoo').expect(400);
    assert.ok(res.body.error.details.fields.type);
    res = await request(app).get('/api/hospitals/search?lat=28.7').expect(400);
    assert.match(res.body.error.message, /both lat and lon/);
    await request(app).get('/api/hospitals/search?lat=200&lon=10').expect(400);
    await request(app).get(`/api/hospitals/search?location=${'a'.repeat(201)}`).expect(400);
  });

  test('returns 404 when the location cannot be geocoded', async () => {
    mockOsm({ geocode: [] });
    const res = await request(app).get('/api/hospitals/search?location=Nowhereville').expect(404);
    assert.equal(res.body.error.code, 'LOCATION_NOT_FOUND');
  });

  test('returns 503 (not sample data) when Overpass is unavailable', async () => {
    mockOsm({ overpass: () => new Response('busy', { status: 504 }) });
    const res = await request(app).get('/api/hospitals/search?location=Bhiwani').expect(503);
    assert.equal(res.body.success, false);
    assert.equal(res.body.data, undefined);
  });

  test('geocoder rate limit surfaces as 503', async () => {
    mockFetch(() => new Response('', { status: 429 }));
    const res = await request(app).get('/api/hospitals/search?location=Rohtak').expect(503);
    assert.equal(res.body.error.code, 'UPSTREAM_RATE_LIMITED');
  });

  test('GET /api/hospitals/:osmType/:osmId validates and fetches a single element', async () => {
    await request(app).get('/api/hospitals/planet/1').expect(400);
    await request(app).get('/api/hospitals/node/abc').expect(400);
    mockOsm({ overpass: { elements: [overpassSample.elements[0]] } });
    const res = await request(app).get('/api/hospitals/node/6991544406?lat=28.7931703&lon=76.1391283').expect(200);
    assert.equal(res.body.data.facility.name, 'Ishwar Children Hospital');
    assert.ok(res.body.data.facility.distanceMeters > 0);
  });
});

describe('Auth, profile and favourites', { skip: false }, () => {
  const agent = () => request.agent(app);
  const user = { name: 'Test User', email: 'Test.User@Example.com', password: 'Password123' };
  let a;

  before(() => {
    a = agent();
  });

  test('register validates input', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    const res = await request(app).post('/api/auth/register').send({ name: 'X', email: 'bad', password: 'short' }).expect(400);
    assert.ok(res.body.error.details.fields.name);
    assert.ok(res.body.error.details.fields.email);
    assert.ok(res.body.error.details.fields.password);
  });

  test('register creates a user, sets an httpOnly cookie and never returns the hash', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    const res = await a.post('/api/auth/register').send(user).expect(201);
    assert.equal(res.body.data.user.email, 'test.user@example.com');
    assert.equal(res.body.data.user.passwordHash, undefined);
    const cookie = res.headers['set-cookie'].join(';');
    assert.match(cookie, /mf_token=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    const maxAge = Number(cookie.match(/Max-Age=(\d+)/)[1]);
    assert.ok(maxAge > 7100 && maxAge <= 7200, 'cookie lifetime follows JWT_EXPIRES_IN (2h)');

    const stored = await mongoose.connection.collection('users').findOne({ email: 'test.user@example.com' });
    assert.match(stored.passwordHash, /^\$2[aby]\$12\$/);
    assert.notEqual(stored.passwordHash, user.password);
  });

  test('duplicate email is rejected', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    const res = await request(app).post('/api/auth/register').send(user).expect(409);
    assert.equal(res.body.error.code, 'EMAIL_TAKEN');
  });

  test('login rejects bad credentials with a generic message', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Wrong12345' }).expect(401);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong12345' }).expect(401);
    assert.equal(wrong.body.error.message, unknown.body.error.message);
  });

  test('login + /me works with the cookie; protected routes require auth', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/favourites').expect(401);
    await request(app).get('/api/users/profile').expect(401);
    await request(app).get('/api/auth/me').set('Cookie', 'mf_token=not-a-jwt').expect(401);

    const b = agent();
    await b.post('/api/auth/login').send({ email: user.email, password: user.password }).expect(200);
    const me = await b.get('/api/auth/me').expect(200);
    assert.equal(me.body.data.user.name, 'Test User');
  });

  test('profile can be read and updated', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    await a.patch('/api/users/profile').send({ name: '<' }).expect(400);
    const res = await a.patch('/api/users/profile').send({ name: 'Renamed User', homeLocation: 'Bhiwani, Haryana' }).expect(200);
    assert.equal(res.body.data.user.name, 'Renamed User');
    const profile = await a.get('/api/users/profile').expect(200);
    assert.equal(profile.body.data.user.homeLocation, 'Bhiwani, Haryana');
    assert.equal(profile.body.data.stats.favouriteCount, 0);
  });

  test('favourites: add, de-duplicate, list, remove', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    const fav = { osmType: 'node', osmId: 6991544406, lat: 28.7975922, lon: 76.1454906, name: 'Ishwar Children Hospital', category: 'hospital', address: 'Rohtak Gate', phones: [] };
    await a.post('/api/favourites').send({ ...fav, osmType: 'planet' }).expect(400);
    await a.post('/api/favourites').send({ ...fav, lat: 500 }).expect(400);

    const first = await a.post('/api/favourites').send(fav).expect(201);
    assert.equal(first.body.data.favourite.id, 'node/6991544406');
    const again = await a.post('/api/favourites').send(fav).expect(200);
    assert.equal(again.body.data.created, false);

    const list = await a.get('/api/favourites').expect(200);
    assert.equal(list.body.data.favourites.length, 1);
    assert.equal(list.body.data.favourites[0].snapshot.name, 'Ishwar Children Hospital');
    assert.equal(list.body.data.favourites[0].user, undefined);

    await a.delete('/api/favourites/node/6991544406').expect(200);
    await a.delete('/api/favourites/node/6991544406').expect(404);
    const empty = await a.get('/api/favourites').expect(200);
    assert.equal(empty.body.data.favourites.length, 0);
  });

  test('favourites are isolated per user', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    await a.post('/api/favourites').send({ osmType: 'way', osmId: 5, lat: 1, lon: 1 }).expect(201);
    const other = agent();
    await other.post('/api/auth/register').send({ name: 'Other Person', email: 'other@example.com', password: 'Password123' }).expect(201);
    const list = await other.get('/api/favourites').expect(200);
    assert.equal(list.body.data.favourites.length, 0);
    await other.delete('/api/favourites/way/5').expect(404);
  });

  test('password change requires the current password', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    await a.patch('/api/users/password').send({ currentPassword: 'nope', newPassword: 'NewPassword1' }).expect(400);
    await a.patch('/api/users/password').send({ currentPassword: user.password, newPassword: 'NewPassword1' }).expect(200);
    await request(app).post('/api/auth/login').send({ email: user.email, password: 'NewPassword1' }).expect(200);
  });

  test('state-changing requests from foreign origins are rejected', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    const res = await a.post('/api/favourites').set('Origin', 'https://evil.example').send({ osmType: 'node', osmId: 1, lat: 1, lon: 1 }).expect(403);
    assert.equal(res.body.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('logout clears the cookie', async (t) => {
    if (!dbAvailable) return t.skip('MongoDB unavailable');
    const res = await a.post('/api/auth/logout').expect(200);
    assert.match(res.headers['set-cookie'].join(';'), /mf_token=;/);
  });
});

describe('POST /api/symptoms/check', () => {
  test('requires some input and validates ids', async () => {
    await request(app).post('/api/symptoms/check').send({}).expect(400);
    await request(app).post('/api/symptoms/check').send({ symptoms: ['made_up'] }).expect(400);
    await request(app).post('/api/symptoms/check').send({ description: 'x'.repeat(1001) }).expect(400);
  });

  test('returns rule-based guidance with a disclaimer when no AI is configured', async () => {
    const res = await request(app).post('/api/symptoms/check').send({ symptoms: ['fever', 'cough'], duration: '1_3_days' }).expect(200);
    const d = res.body.data;
    assert.equal(d.mode, 'rules');
    assert.equal(d.ai, null);
    assert.match(d.disclaimer, /not a medical diagnosis/);
    assert.deepEqual(d.matchedSymptoms.map((s) => s.id).sort(), ['cough', 'fever']);
    assert.equal(d.urgency, 'monitor');
  });

  test('flags emergencies from free text', async () => {
    const res = await request(app).post('/api/symptoms/check').send({ description: 'My father has chest pain and slurred speech' }).expect(200);
    assert.equal(res.body.data.urgency, 'emergency');
    const ids = res.body.data.emergencyFlags.map((f) => f.id);
    assert.ok(ids.includes('chest_pain') && ids.includes('stroke'));
    assert.match(res.body.data.emergencyMessage, /112/);
    assert.equal(res.body.data.suggestedFacilityType, 'hospital');
  });

  test('keyword matching respects word boundaries', async () => {
    const res = await request(app).post('/api/symptoms/check').send({ description: 'I heard my heart beating near my year-end exam' }).expect(200);
    assert.equal(res.body.data.matchedSymptoms.length, 0);
  });

  test('includes mental-health support for self-harm mentions', async () => {
    const res = await request(app).post('/api/symptoms/check').send({ redFlags: ['self_harm'] }).expect(200);
    assert.match(res.body.data.mentalHealthMessage, /14416/);
  });
});

describe('Errors', () => {
  test('unknown API routes return JSON 404', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  test('malformed JSON returns 400', async () => {
    const res = await request(app).post('/api/symptoms/check').set('Content-Type', 'application/json').send('{bad').expect(400);
    assert.equal(res.body.error.code, 'INVALID_JSON');
  });

  test('security headers are set', async () => {
    const res = await request(app).get('/api/health');
    assert.ok(res.headers['content-security-policy']);
    assert.equal(res.headers['x-powered-by'], undefined);
  });
});
