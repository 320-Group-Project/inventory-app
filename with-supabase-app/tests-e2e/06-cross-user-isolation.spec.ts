/**
 * 06 — Cross-user data isolation
 *
 * Runs as the "other" user (storageState: other.json).
 * This user is authenticated but has NEVER been a member of the test club.
 *
 * Verifies that:
 *  - RLS hides the test club from a non-member (settings returns 404)
 *  - All admin-only mutations on the test club return 403
 *  - The test club does NOT appear in the other user's dashboard tiles
 *  - The other user can only see their own profile data
 */
import { test, expect } from '@playwright/test';
import { loadContext, type TestContext } from './test-context';

let ctx: TestContext;
test.beforeAll(() => { ctx = loadContext(); });

// ─── Test club is invisible / off-limits ───────────────────────────────────────

test.describe("Non-member user — cannot read the test club's data", () => {
  test('GET /api/clubs/{id}/settings → 404 (RLS hides the Club row)', async ({ request }) => {
    const res = await request.get(`/api/clubs/${ctx.clubId}/settings`);
    // The Club row is invisible to non-members via RLS — no data returned → 404
    expect(res.status()).toBe(404);
  });

  test('GET /api/clubs/{id}/members → empty list (RLS blocks Role rows)', async ({ request }) => {
    const res = await request.get(`/api/clubs/${ctx.clubId}/members`);
    // Either an empty members array (RLS hides the Role rows) or a 4xx
    expect([200, 403, 404].includes(res.status())).toBe(true);
    if (res.status() === 200) {
      const { members } = await res.json();
      expect(members).toHaveLength(0);
    }
  });

  test('GET /api/dashboard → 200 but the test club is absent from tiles', async ({ request }) => {
    const res = await request.get('/api/dashboard');
    expect(res.status()).toBe(200);

    const { tiles } = await res.json();
    const testTile = tiles.find((t: { club_id: number }) => t.club_id === ctx.clubId);
    expect(testTile).toBeUndefined();
  });
});

// ─── Admin-only mutations on the test club return 403 ─────────────────────────

test.describe('Non-member user — admin-only mutations return 403', () => {
  test('PATCH /api/clubs/{id}/settings → 403', async ({ request }) => {
    const res = await request.patch(`/api/clubs/${ctx.clubId}/settings`, {
      data: { name: 'Cross-user Rename Attempt' },
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

// ─── Own data is accessible and isolated ──────────────────────────────────────

test.describe('Non-member user — own data is accessible and isolated from other users', () => {
  test("GET /api/profile returns the other user's email only", async ({ request }) => {
    const res = await request.get('/api/profile');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.email).toBe(ctx.otherEmail);
    // Must NOT leak the admin's or member's email
    expect(body.email).not.toBe(ctx.adminEmail);
    expect(body.email).not.toBe(ctx.memberEmail);
  });

  test("profile page shows the other user's email (not another user's)", async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await expect(emailInput).toHaveValue(ctx.otherEmail);
  });
});
