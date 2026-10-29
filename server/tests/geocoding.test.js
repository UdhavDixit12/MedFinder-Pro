import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.js';

const { pickBestMatch } = await import('../services/geocodingService.js');

describe('geocoding best-match selection', () => {
  const district = { name: 'Hisar', category: 'boundary', type: 'administrative', place_rank: 10, lat: '29.2396', lon: '75.8174' };
  const city = { name: 'Hisar', category: 'place', type: 'city', place_rank: 16, lat: '29.1562', lon: '75.7292' };

  test('prefers the same-named town over a district boundary ranked above it', () => {
    assert.equal(pickBestMatch([district, city]), city);
  });

  test('keeps the top result when it is already specific', () => {
    const hospital = { name: 'Civil Hospital', category: 'amenity', type: 'hospital', place_rank: 30 };
    assert.equal(pickBestMatch([hospital, city]), hospital);
  });

  test('keeps a broad top result when no same-named settlement exists', () => {
    const other = { name: 'Hansi', category: 'place', type: 'town', place_rank: 16 };
    assert.equal(pickBestMatch([district, other]), district);
  });
});
