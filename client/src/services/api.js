import axios from 'axios';

const baseURL = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 90000,
  headers: { Accept: 'application/json' },
});

/**
 * Normalises any axios error into { message, code, status, fields }.
 */
export function toApiError(error) {
  if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
    return { message: 'Request cancelled.', code: 'CANCELLED', status: 0, cancelled: true };
  }
  if (error?.response) {
    const body = error.response.data;
    return {
      message: body?.error?.message || `Request failed (HTTP ${error.response.status}).`,
      code: body?.error?.code || 'HTTP_ERROR',
      status: error.response.status,
      fields: body?.error?.details?.fields || null,
    };
  }
  if (error?.code === 'ECONNABORTED') {
    return { message: 'The request took too long. Please try again.', code: 'TIMEOUT', status: 0 };
  }
  return {
    message: 'Cannot reach the MedFinder Pro server. Check your internet connection or whether the API is running.',
    code: 'NETWORK_ERROR',
    status: 0,
  };
}

export async function request(config) {
  try {
    const response = await api.request(config);
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export default api;
