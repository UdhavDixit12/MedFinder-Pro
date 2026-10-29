import AppError from './AppError.js';

/**
 * fetch() with an AbortController timeout. Converts network failures and
 * timeouts into AppErrors so callers can handle them uniformly.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000, serviceName = 'External service') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError(`${serviceName} did not respond within ${Math.round(timeoutMs / 1000)}s.`, 504, 'UPSTREAM_TIMEOUT');
    }
    throw new AppError(`${serviceName} could not be reached.`, 502, 'UPSTREAM_UNREACHABLE');
  } finally {
    clearTimeout(timer);
  }
}

export async function readJson(response, serviceName = 'External service') {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(`${serviceName} returned a malformed response.`, 502, 'UPSTREAM_BAD_RESPONSE');
  }
}

export const sendSuccess = (res, data, statusCode = 200, meta) =>
  res.status(statusCode).json(meta ? { success: true, data, meta } : { success: true, data });
