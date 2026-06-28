import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: 'crm.spec.mjs',
  timeout: 30000,
  use: { headless: true },
  reporter: [['list']],
});
