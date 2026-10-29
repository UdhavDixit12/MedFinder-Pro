import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config/env.js';
import { isDbConnected } from './config/db.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import originCheck from './middleware/originCheck.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import symptomRoutes from './routes/symptomRoutes.js';
import { isAiConfigured } from './services/symptomService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Extra image origins for a custom tile server (CSP_TILE_ORIGINS, comma-separated). */
const tileOrigins = () =>
  (process.env.CSP_TILE_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.isProduction) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://tile.openstreetmap.org', 'https://*.tile.openstreetmap.org', ...tileOrigins()],
          connectSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.cookie.secure ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.clientOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());
  if (!config.isTest) app.use(morgan(config.isProduction ? 'combined' : 'dev'));

  app.use('/api', apiLimiter, originCheck);

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: isDbConnected() ? 'connected' : 'disconnected',
        aiSymptomChecker: isAiConfigured() ? 'configured' : 'not_configured',
        time: new Date().toISOString(),
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/hospitals', hospitalRoutes);
  app.use('/api/favourites', favouriteRoutes);
  app.use('/api/symptoms', symptomRoutes);
  app.use('/api', notFound);

  const clientDist = path.resolve(__dirname, '../client/dist');
  if (config.serveClient && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;
