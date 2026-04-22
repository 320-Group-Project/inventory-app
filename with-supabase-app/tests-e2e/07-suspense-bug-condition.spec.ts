/**
 * 07 — Bug Condition Exploration: Settings Layout Uncached Data Error
 *
 * Property 1: Expected Behavior — Settings Layout Renders Without Suspense Error
 * Validates: Requirements 2.1, 2.2, 2.3
 *
 * After the fix is applied (task 3), these assertions confirm the bug is resolved:
 * - Assert that the console does NOT contain "Uncached data was accessed outside of <Suspense>"
 * - Assert that the console does NOT contain "blocking-route"
 */
import { test, expect } from '@playwright/test';
import { loadContext, type TestContext } from './test-context';

let ctx: TestContext;
test.beforeAll(() => { ctx = loadContext(); });

const SUSPENSE_ERROR = 'Uncached data was accessed outside of <Suspense>';
const BLOCKING_ROUTE = 'blocking-route';

/**
 * Collect all browser console messages (errors + warnings) after navigating to a URL.
 * Returns the combined text of all console messages.
 */
async function collectConsoleMessages(page: import('@playwright/test').Page, url: string): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (msg) => {
    messages.push(msg.text());
  });
  page.on('pageerror', (err) => {
    messages.push(err.message);
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  return messages;
}

test.describe('Bug Condition — Settings Layout Uncached Data Error', () => {
  test('settings index page console does NOT contain Suspense error (fix verified)', async ({ page }) => {
    const url = `/clubs/${ctx.clubId}/settings`;
    const messages = await collectConsoleMessages(page, url);
    const combined = messages.join('\n');

    // After the fix, these errors must NOT appear.
    expect(combined).not.toContain(SUSPENSE_ERROR);
    expect(combined).not.toContain(BLOCKING_ROUTE);
  });

  test('add-members page console does NOT contain Suspense error (fix verified)', async ({ page }) => {
    const url = `/clubs/${ctx.clubId}/settings/add-members`;
    const messages = await collectConsoleMessages(page, url);
    const combined = messages.join('\n');

    // After the fix, these errors must NOT appear.
    expect(combined).not.toContain(SUSPENSE_ERROR);
    expect(combined).not.toContain(BLOCKING_ROUTE);
  });
});
