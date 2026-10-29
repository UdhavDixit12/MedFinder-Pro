const toList = (value, fallback = []) =>
  value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : fallback;

const toBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const config = {
  nodeEnv,
  isProduction,
  isTest,
  port: Number(process.env.PORT) || 5000,
  clientOrigins: toList(process.env.CLIENT_ORIGIN, ['http://localhost:5173']),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medfinder_pro',
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cookie: {
    name: 'mf_token',
    sameSite: (process.env.COOKIE_SAMESITE || 'lax').toLowerCase(),
    secure: toBool(process.env.COOKIE_SECURE, isProduction),
  },
  osm: {
    userAgent: process.env.OSM_USER_AGENT || 'MedFinderPro/1.0 (self-hosted instance)',
    contactEmail: process.env.OSM_CONTACT_EMAIL || '',
    nominatimUrl: (process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org').replace(/\/+$/, ''),
    overpassUrls: toList(process.env.OVERPASS_URLS, [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.openstreetmap.fr/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.private.coffee/api/interpreter',
    ]),
    overpassTimeoutMs: Number(process.env.OVERPASS_TIMEOUT_MS) || 30000,
    overpassFailoverTimeoutMs: Number(process.env.OVERPASS_FAILOVER_TIMEOUT_MS) || 12000,
    geocodeTimeoutMs: Number(process.env.GEOCODE_TIMEOUT_MS) || 10000,
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 20000,
  },
  serveClient: toBool(process.env.SERVE_CLIENT, false),
  disableRateLimit: toBool(process.env.DISABLE_RATE_LIMIT, isTest),
};

export function assertConfig() {
  const problems = [];
  if (!config.jwt.secret) {
    if (config.isProduction) problems.push('JWT_SECRET must be set in production.');
    else {
      config.jwt.secret = 'dev-only-insecure-secret-change-me';
      console.warn('[config] JWT_SECRET is not set - using an insecure development secret.');
    }
  } else if (config.isProduction && config.jwt.secret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters in production.');
  }
  if (!['lax', 'strict', 'none'].includes(config.cookie.sameSite)) {
    problems.push('COOKIE_SAMESITE must be one of lax, strict, none.');
  }
  if (config.cookie.sameSite === 'none' && !config.cookie.secure) {
    problems.push('COOKIE_SAMESITE=none requires COOKIE_SECURE=true (HTTPS).');
  }
  if (problems.length) {
    throw new Error(`Invalid configuration:\n - ${problems.join('\n - ')}`);
  }
  return config;
}

export default config;
