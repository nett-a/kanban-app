import { env } from '../config/env.js';
import { db } from './jsonDb.js';
import { buildSeedData, DEMO_PASSWORD } from './seed.js';

await db.init(env.dbFile, { reset: true, seedFactory: buildSeedData });
await db.flush();
console.log(`[seed] Database reset at ${env.dbFile}`);
console.log(`[seed] Demo users: alice, bob, charlie, diana, evan — password "${DEMO_PASSWORD}"`);
