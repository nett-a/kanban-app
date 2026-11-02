import { defineConfig, devices } from '@playwright/test';

const API_PORT = 4100;
const WEB_PORT = 5180;

/**
 * E2E runs against an isolated stack: its own API port, its own JSON data file
 * (reset from seed on every run) and its own upload folder, so it never touches
 * your development data.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // tests share one JSON database
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: 'node src/server.js',
      cwd: '../backend',
      port: API_PORT,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
        DB_FILE: 'data/db.e2e.json',
        UPLOAD_DIR: 'uploads-e2e',
        RESET_DB: 'true',
        LOGIN_RATE_LIMIT: '1000',
      },
    },
    {
      command: `node ../node_modules/vite/bin/vite.js --port ${WEB_PORT} --strictPort`,
      cwd: '../frontend',
      port: WEB_PORT,
      reuseExistingServer: false,
      env: { VITE_API_PROXY: `http://localhost:${API_PORT}` },
    },
  ],
});
