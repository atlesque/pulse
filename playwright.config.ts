import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:8788',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run db:reset:local && npm run dev:test',
    url: 'http://127.0.0.1:8788',
    reuseExistingServer: false,
    timeout: 180000
  }
})
