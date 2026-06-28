import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: 'https://esperancar.f5rg2q.easypanel.host',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  reporter: [['list']],
});
