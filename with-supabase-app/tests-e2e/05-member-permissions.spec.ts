/**
 * 05 — Member / non-admin restrictions
 *
 * Runs as the test Member user (storageState: member.json).
 *
 * After test 04's delete-member step, the member user is no longer in the test
 * club.  That means the role-check queries return null → the API correctly
 * returns 403 for every admin-only operation.  This is the intended behaviour:
 * both "Member role" and "not in club" users must be blocked from admin endpoints.
 *
 * Verifies that:
 *  - All admin-only mutations return 403 with "Admins only"
 *  - The user's OWN profile is still accessible and returns their own data
 *  - GET /api/dashboard does NOT include the test club (they were removed)
 */
import { test, expect } from '@playwright/test';
import { loadContext, type TestContext } from './test-context';

let ctx: TestContext;
test.beforeAll(() => { ctx = loadContext(); });

// ─── Own data remains accessible ──────────────────────────────────────────────

test.describe('Member user — own data is always accessible', () => {
  test("GET /api/profile returns the member's own email (not the admin's)", async ({
    request,
  }) => {
    const res = await request.get('/api/profile');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.email).toBe(ctx.memberEmail);
    expect(body.email).not.toBe(ctx.adminEmail);
  });

  test('GET /api/dashboard returns 200 (member has their own session)', async ({ request }) => {
    const res = await request.get('/api/dashboard');
    expect(res.status()).toBe(200);
    // The test club was removed in test 04 — it should NOT appear in their tiles
    const { tiles } = await res.json();
    const testTile = tiles.find((t: { club_id: number }) => t.club_id === ctx.clubId);
    expect(testTile).toBeUndefined();
  });

  test("profile page displays the member's email", async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await expect(emailInput).toHaveValue(ctx.memberEmail);
  });
});

// ─── Admin-only API endpoints return 403 ──────────────────────────────────────

test.describe('Member user — admin-only operations are forbidden (403)', () => {
  test('PATCH /api/clubs/{id}/settings → 403', async ({ request }) => {
    const res = await request.patch(`/api/clubs/${ctx.clubId}/settings`, {
      data: { name: 'Forbidden Rename' },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toMatch(/admins only/i);
  });

  test('DELETE /api/clubs/{id}/members/{uid} → 403', async ({ request }) => {
    const res = await request.delete(
      `/api/clubs/${ctx.clubId}/members/${ctx.adminUserId}`,
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toMatch(/admins only/i);
  });

  test('PATCH /api/clubs/{id}/members/{uid}/role → 403', async ({ request }) => {
    const res = await request.patch(
      `/api/clubs/${ctx.clubId}/members/${ctx.adminUserId}/role`,
      { data: { role: 'Member' } },
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toMatch(/admins only/i);
  });
});
