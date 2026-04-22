import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

// Playwright doesn't auto-load .env.local (that's a Next.js feature).
// Parse it manually so NEXT_PUBLIC_* vars and the service role key are available.
function loadEnvLocal() {
  try {
    const content = readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // .env.local absent in CI — env vars must be set externally
  }
}
loadEnvLocal();

export const ADMIN_AUTH_FILE = path.join(__dirname, 'tests-e2e/.auth/admin.json');
export const MEMBER_AUTH_FILE = path.join(__dirname, 'tests-e2e/.auth/member.json');
export const OTHER_AUTH_FILE = path.join(__dirname, 'tests-e2e/.auth/other.json');

export default defineConfig({
  testDir: './tests-e2e',
  // Serial execution keeps tests isolated — avoids DB race conditions
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html'], ['list']],
  globalSetup: './tests-e2e/global-setup.ts',
  globalTeardown: './tests-e2e/global-teardown.ts',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // No auth cookie — fresh browser context
    {
      name: 'unauthenticated',
      testMatch: '**/01-unauthenticated.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    // Logged in as the test Admin user
    {
      name: 'as-admin',
      testMatch: ['**/02-*.spec.ts', '**/03-*.spec.ts', '**/04-*.spec.ts', '**/07-*.spec.ts', '**/08-*.spec.ts'],
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
    },
    // Logged in as the test Member user (Member role in test club)
    {
      name: 'as-member',
      testMatch: '**/05-member-permissions.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: MEMBER_AUTH_FILE },
    },
    // Logged in as a user who is NOT in the test club
    {
      name: 'cross-user',
      testMatch: '**/06-cross-user-isolation.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: OTHER_AUTH_FILE },
    },
  ],
});
