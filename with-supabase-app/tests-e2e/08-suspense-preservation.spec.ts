/**
 * 08 — Preservation Property Tests: Auth/Role Redirect and No Console Errors
 *
 * Property 2: Preservation — Auth and Role Redirect Behavior Unchanged
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * IMPORTANT: These tests MUST PASS on unfixed code — they establish the baseline
 * behavior to preserve. They will also pass after the fix is applied (regression guard).
 *
 * Runs under the `as-admin` project (storageState: admin.json).
 * Unauthenticated and member tests create their own browser contexts internally.
 */
import { test, expect } from '@playwright/test';
import { loadContext, type TestContext } from './test-context';
import { MEMBER_AUTH_FILE } from '../playwright.config';

let ctx: TestContext;
test.beforeAll(() => { ctx = loadContext(); });

const SUSPENSE_ERROR = 'Uncached data was accessed outside of <Suspense>';
const BLOCKING_ROUTE = 'blocking-route';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Collect all browser console messages after navigating to a URL.
 */
async function collectConsoleMessages(
  page: import('@playwright/test').Page,
  url: string,
): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (msg) => messages.push(msg.text()));
  page.on('pageerror', (err) => messages.push(err.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  return messages;
}

// ─── 3.1 Unauthenticated redirect preservation ────────────────────────────────

test.describe('Redirect preservation — unauthenticated user', () => {
  /**
   * Validates: Requirement 3.1
   * Navigate to /clubs/{org}/settings/add-members WITHOUT auth state.
   * Assert final URL is /auth/login.
   *
   * NOTE: On unfixed code, the Suspense error in the settings layout may prevent
   * the redirect from executing for unauthenticated users (no cached auth data →
   * Suspense error thrown before redirect). This test will pass after the fix is
   * applied (task 3), serving as a fix verification test for requirement 3.1.
   */
  test('unauthenticated request to add-members redirects to /auth/login', async ({ browser }) => {
    // Create a fresh context with NO storage state (no auth cookies)
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/clubs/${ctx.clubId}/settings/add-members`);
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/auth/login');
    } finally {
      await context.close();
    }
  });
});

// ─── 3.2 Non-Admin redirect preservation ─────────────────────────────────────

test.describe('Redirect preservation — Member-role user', () => {
  /**
   * Validates: Requirement 3.2
   * Navigate to /clubs/{org}/settings/add-members as a Member-role user.
   * Assert final URL is /dashboard.
   */
  test('member-role request to add-members redirects to /dashboard', async ({ browser }) => {
    const context = await browser.newContext({ storageState: MEMBER_AUTH_FILE });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/clubs/${ctx.clubId}/settings/add-members`, {
        waitUntil: 'networkidle',
      });
      expect(page.url()).toContain('/dashboard');
    } finally {
      await context.close();
    }
  });
});

// ─── 3.3 Admin page content preservation ─────────────────────────────────────

test.describe('Admin page content preservation', () => {
  /**
   * Validates: Requirement 3.3
   * Navigate to /clubs/{org}/settings as admin.
   * Assert the page renders with expected content:
   *   - club name visible
   *   - Edit button visible
   *   - Members section visible
   *   - Add Member link visible
   */
  test('admin can access settings page and sees expected content', async ({ page }) => {
    await page.goto(`/clubs/${ctx.clubId}/settings`);
    await page.waitForLoadState('networkidle');

    // Club name is rendered as a <p> with text-2xl font-bold
    await expect(page.getByText(ctx.testClubName)).toBeVisible({ timeout: 8000 });

    // Edit button for the club name
    await expect(page.getByRole('button', { name: /^Edit$/i })).toBeVisible({ timeout: 8000 });

    // Members section heading
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 8000 });

    // Add Member link
    await expect(page.getByRole('link', { name: /Add Member/i })).toBeVisible({ timeout: 8000 });
  });
});

// ─── 3.4 All-routes console sweep ────────────────────────────────────────────

test.describe('All-routes console sweep — no Suspense errors on non-settings routes', () => {
  /**
   * Validates: Requirement 3.4
   * As admin, iterate all known app routes (excluding settings routes which are
   * known to have the bug on unfixed code). Assert browser console contains NO
   * "Uncached data was accessed outside of <Suspense>" or "blocking-route" strings.
   */
  const NON_SETTINGS_ROUTES = [
    '/dashboard',
    '/profile',
    '/auth/login',
    '/auth/sign-up',
    '/auth/forgot-password',
    '/clubs/category',
  ];

  for (const route of NON_SETTINGS_ROUTES) {
    test(`no Suspense/blocking errors on ${route}`, async ({ page }) => {
      const messages = await collectConsoleMessages(page, route);
      const combined = messages.join('\n');

      const hasSuspenseError = combined.includes(SUSPENSE_ERROR);
      const hasBlockingRoute = combined.includes(BLOCKING_ROUTE);

      expect(hasSuspenseError).toBe(false);
      expect(hasBlockingRoute).toBe(false);
    });
  }
});
