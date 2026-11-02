import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './database/jsonDb.js';
import { buildSeedData } from './database/seed.js';

await db.init(env.dbFile, { reset: env.resetDb, seedFactory: buildSeedData });

const server = createApp().listen(env.port, () => {
  console.log(`[api] Kanban API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  console.log(`[api] Data file: ${env.dbFile}`);
});

async function shutdown(signal) {
  console.log(`[api] ${signal} received, flushing data and shutting down...`);
  server.close();
  await db.flush();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
