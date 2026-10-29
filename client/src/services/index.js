import { request } from './api.js';

export const hospitalService = {
  search: ({ location, lat, lon, radius, type }, signal) =>
    request({
      url: '/hospitals/search',
      method: 'GET',
      params: lat != null && lon != null ? { lat, lon, radius, type } : { location, radius, type },
      signal,
    }),
  get: (osmType, osmId, origin, signal) =>
    request({ url: `/hospitals/${osmType}/${osmId}`, method: 'GET', params: origin || undefined, signal }),
};

export const authService = {
  me: () => request({ url: '/auth/me', method: 'GET' }),
  login: (body) => request({ url: '/auth/login', method: 'POST', data: body }),
  register: (body) => request({ url: '/auth/register', method: 'POST', data: body }),
  logout: () => request({ url: '/auth/logout', method: 'POST' }),
};

export const userService = {
  getProfile: () => request({ url: '/users/profile', method: 'GET' }),
  updateProfile: (body) => request({ url: '/users/profile', method: 'PATCH', data: body }),
  changePassword: (body) => request({ url: '/users/password', method: 'PATCH', data: body }),
};

export const favouriteService = {
  list: () => request({ url: '/favourites', method: 'GET' }),
  add: (facility) =>
    request({
      url: '/favourites',
      method: 'POST',
      data: {
        osmType: facility.osmType,
        osmId: facility.osmId,
        lat: facility.lat,
        lon: facility.lon,
        name: facility.name,
        category: facility.category,
        categoryLabel: facility.categoryLabel,
        address: facility.address,
        phones: facility.phones?.slice(0, 5) || [],
      },
    }),
  remove: (osmType, osmId) => request({ url: `/favourites/${osmType}/${osmId}`, method: 'DELETE' }),
};

export const symptomService = {
  catalog: () => request({ url: '/symptoms/catalog', method: 'GET' }),
  check: (body) => request({ url: '/symptoms/check', method: 'POST', data: body }),
};
