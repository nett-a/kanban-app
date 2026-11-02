import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const jwtSecret = process.env.JWT_SECRET || (isProd ? null : 'dev-only-insecure-secret-do-not-use-in-prod');
if (!jwtSecret || (isProd && jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be set (min. 32 chars) when NODE_ENV=production');
}

export const env = Object.freeze({
  nodeEnv,
  isProd,
  isTest,
  backendRoot,
  port: Number(process.env.PORT) || 4000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim()),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: 'kanban_token',
  dbFile: path.resolve(backendRoot, process.env.DB_FILE || 'data/db.json'),
  uploadDir: path.resolve(backendRoot, process.env.UPLOAD_DIR || 'uploads'),
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024,
  resetDb: process.env.RESET_DB === 'true',
  loginRateLimit: Number(process.env.LOGIN_RATE_LIMIT) || 20,
});
