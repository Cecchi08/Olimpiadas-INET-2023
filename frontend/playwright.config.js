import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5179', browserName: 'chromium', channel: 'msedge', viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5179 --strictPort',
    url: 'http://127.0.0.1:5179',
    reuseExistingServer: false,
    env: { VITE_API_URL: 'http://127.0.0.1:3099', VITE_SOCKET_URL: 'http://127.0.0.1:3099' },
  },
});
