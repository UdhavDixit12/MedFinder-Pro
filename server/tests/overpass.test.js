import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { BHIWANI, jsonResponse, mockFetch, overpassSample, restoreFetch } from './helpers.js';

const svc = await import('../services/overpassService.js');
const { categorize } = await import('../services/facilityCategories.js');

describe('Overpass query + normalization', () => {
  test('builds an around query for hospitals covering nodes, ways and relations', () => {
    const q = svc.buildAroundQuery({ ...BHIWANI, radius: 10000, type: 'hospital' });
    assert.match(q, /\[out:json\]/);
    assert.match(q, /nwr\["amenity"="hospital"\]\(around:10000,28\.793170,76\.139128\);/);
    assert.match(q, /nwr\["healthcare"="hospital"\]/);
    assert.match(q, /out center tags;/);
  });

  test('"all" includes pharmacies, clinics and doctors', () => {
    const q = svc.buildAroundQuery({ ...BHIWANI, radius: 2000, type: 'all' });
    for (const v of ['pharmacy', 'clinic', 'doctors', 'dentist']) assert.ok(q.includes(`"amenity"="${v}"`), v);
  });

  test('categorizes by OSM tags', () => {
    assert.equal(categorize({ amenity: 'hospital' }), 'hospital');
    assert.equal(categorize({ healthcare: 'pharmacy' }), 'pharmacy');
    assert.equal(categorize({ healthcare: 'centre' }), 'clinic');
    assert.equal(categorize({ shop: 'bakery' }), 'other');
  });

  test('normalizes elements without inventing missing data', () => {
    const [hospital, pharmacy] = overpassSample.elements.map((el) => svc.normalizeElement(el, BHIWANI));
    assert.equal(hospital.id, 'node/6991544406');
    assert.equal(hospital.name, 'Ishwar Children Hospital');
    assert.equal(hospital.address, 'Rohtak Gate, Bhiwani, Haryana, 127021');
    assert.deepEqual(hospital.phones, []);
    assert.equal(hospital.openingHours, null);
    assert.ok(hospital.distanceMeters > 0 && hospital.distanceMeters < 1000);
    assert.equal(hospital.osmUrl, 'https://www.openstreetmap.org/node/6991544406');

    assert.equal(pharmacy.osmType, 'way');
    assert.equal(pharmacy.lat, 28.8);
    assert.equal(pharmacy.name, null, 'unnamed facilities stay unnamed');
    assert.equal(pharmacy.address, null);
    assert.deepEqual(pharmacy.phones, ['+91 98765 43210', '01664-123456']);
  });

  test('drops elements without coordinates and only allows http(s) websites', () => {
    assert.equal(svc.normalizeElement(overpassSample.elements[3], BHIWANI), null);
    assert.equal(svc.normalizeElement(overpassSample.elements[2]).website, 'https://example.org/');
    assert.equal(svc.normalizeElement({ type: 'node', id: 1, lat: 1, lon: 1, tags: { website: 'javascript:alert(1)' } }).website, null);
  });
});

describe('Overpass transport', () => {
  beforeEach(() => svc._clearOverpassCaches());
  after(restoreFetch);

  test('fails over to the next endpoint on 502 and sorts by distance within radius', async () => {
    const calls = mockFetch((url) =>
      url.includes('overpass-a') ? new Response('busy', { status: 502 }) : jsonResponse(overpassSample),
    );
    const result = await svc.searchFacilities({ ...BHIWANI, radius: 5000, type: 'all' });
    assert.equal(calls.length, 2);
    assert.equal(result.source.endpoint, 'overpass-b.test');
    assert.equal(result.facilities.length, 3, 'far-away and coordinate-less elements are excluded');
    const d = result.facilities.map((f) => f.distanceMeters);
    assert.deepEqual(d, [...d].sort((a, b) => a - b));
    assert.equal(calls[1].init.method, 'POST');
    assert.match(decodeURIComponent(calls[1].init.body), /around:5000/);
  });

  test('a hanging first endpoint fails over after the short failover timeout', async () => {
    mockFetch((url, init) => {
      if (url.includes('overpass-a')) {
        return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
      }
      return jsonResponse(overpassSample);
    });
    const started = Date.now();
    const result = await svc.searchFacilities({ ...BHIWANI, radius: 4000, type: 'all' });
    assert.equal(result.source.endpoint, 'overpass-b.test');
    assert.ok(Date.now() - started < 2000, 'failover happens quickly');
  });

  test('caches identical searches', async () => {
    const calls = mockFetch(() => jsonResponse(overpassSample));
    await svc.searchFacilities({ ...BHIWANI, radius: 3000, type: 'hospital' });
    const second = await svc.searchFacilities({ ...BHIWANI, radius: 3000, type: 'hospital' });
    assert.equal(calls.length, 1);
    assert.equal(second.source.cached, true);
  });

  test('reports rate limiting when every endpoint returns 429', async () => {
    mockFetch(() => new Response('slow down', { status: 429 }));
    await assert.rejects(svc.searchFacilities({ ...BHIWANI, radius: 3000, type: 'hospital' }), (err) => {
      assert.equal(err.statusCode, 503);
      assert.equal(err.code, 'UPSTREAM_RATE_LIMITED');
      return true;
    });
  });

  test('treats malformed JSON and runtime-error remarks as failures', async () => {
    mockFetch((url) =>
      url.includes('overpass-a') ? new Response('<html>oops</html>', { status: 200 }) : jsonResponse({ elements: [], remark: 'runtime error: Query timed out' }),
    );
    await assert.rejects(svc.searchFacilities({ ...BHIWANI, radius: 3000, type: 'clinic' }), (err) => {
      assert.equal(err.code, 'UPSTREAM_TIMEOUT');
      return true;
    });
  });

  test('converts network errors into an upstream error', async () => {
    mockFetch(() => {
      throw new TypeError('fetch failed');
    });
    await assert.rejects(svc.searchFacilities({ ...BHIWANI, radius: 3000, type: 'dentist' }), (err) => {
      assert.equal(err.code, 'UPSTREAM_UNREACHABLE');
      assert.equal(err.details.endpointsTried, 2);
      return true;
    });
  });

  test('returns an empty list (not sample data) when nothing is found', async () => {
    mockFetch(() => jsonResponse({ elements: [] }));
    const result = await svc.searchFacilities({ ...BHIWANI, radius: 1000, type: 'laboratory' });
    assert.deepEqual(result.facilities, []);
    assert.equal(result.total, 0);
  });

  test('getFacility returns 404 when the element does not exist', async () => {
    mockFetch(() => jsonResponse({ elements: [] }));
    await assert.rejects(svc.getFacility('node', 42), (err) => err.statusCode === 404);
  });
});
