import config, { assertConfig } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  try {
    assertConfig();
  } catch (err) {
    console.error(`[startup] ${err.message}`);
    process.exit(1);
  }

  try {
    await connectDB(config.mongoUri);
  } catch (err) {
    console.error(`[startup] Could not connect to MongoDB at the configured MONGODB_URI: ${err.message}`);
    console.error('[startup] Hospital search will still work; accounts and favourites require the database.');
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[server] MedFinder Pro API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`[startup] Port ${config.port} is already in use. Set PORT in server/.env.`);
    else console.error('[server]', err);
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => console.error('[server] Unhandled rejection:', reason));
}

start();
