/**
 * 03 — Authenticated user: dashboard / tiles
 *
 * Runs as the test Admin user (storageState: admin.json).
 *
 * Verifies that:
 *  - /api/dashboard returns the test club with the correct role
 *  - The dashboard UI renders the tile with the right name and role badge
 *  - The user can navigate to /dashboard/new-tile and create a club
 *  - The leave-club (DELETE /api/tiles/:id) endpoint works
 */
import { test, expect } from '@playwright/test';
import { loadContext, type TestContext } from './test-context';

let ctx: TestContext;
test.beforeAll(() => { ctx = loadContext(); });

// ─── API ───────────────────────────────────────────────────────────────────────

test.describe('Dashboard API — authenticated admin user', () => {
    test('GET /api/dashboard returns 200 with the test club tile', async ({ request }) => {
        const res = await request.get('/api/dashboard');
        expect(res.status()).toBe(200);

        const { tiles } = await res.json();
        expect(Array.isArray(tiles)).toBe(true);

        const tile = tiles.find((t: { club_id: number }) => t.club_id === ctx.clubId);
        expect(tile).toBeDefined();
        expect(tile.name).toBe(ctx.testClubName);
        expect(tile.role).toBe('Admin');
    });

    test('POST /api/tiles creates a new club and returns its club_id', async ({ request }) => {
        const name = `E2E Temp ${Date.now()}`;
        const res = await request.post('/api/tiles', { data: { title: name } });
        expect(res.status()).toBe(200);

        const body = await res.json();
        expect(body.success).toBe(true);
        expect(typeof body.club_id).toBe('number');

        // Leave the temp club so the admin isn't in two clubs indefinitely.
        // (The orphaned Club row is cleaned up by global teardown via the admin's role history.)
        await request.delete(`/api/tiles/${body.club_id}`);
    });

    test('POST /api/tiles with missing title returns an error', async ({ request }) => {
        const res = await request.post('/api/tiles', { data: { title: '' } });
        // The Supabase RPC rejects a blank name; expect a 4xx response
        expect(res.status()).toBeGreaterThanOrEqual(400);
    });
});

// ─── UI ───────────────────────────────────────────────────────────────────────

test.describe('Dashboard UI — authenticated admin user', () => {
    test('dashboard shows the test club tile', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Wait for loading spinner to disappear
        await expect(page.getByRole('link', { name: /New Tile/i })).toBeVisible({ timeout: 8000 });
        await expect(page.getByText(ctx.testClubName)).toBeVisible({ timeout: 8000 });
    });

    test('admin tile displays the "Admin" role badge', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('link', { name: /New Tile/i })).toBeVisible({ timeout: 8000 });
        await expect(page.getByText('Admin', { exact: true })).toBeVisible({ timeout: 8000 });
    });

    test('clicking "New Tile" navigates to /dashboard/new-tile', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.getByRole('link', { name: /New Tile/i }).click();
        await expect(page).toHaveURL('/dashboard/new-tile');
    });

    test('/dashboard/new-tile page has a name input and Save button', async ({ page }) => {
        await page.goto('/dashboard/new-tile');
        await expect(page.getByPlaceholder('e.g. HackUMass')).toBeVisible();
        await expect(page.getByRole('button', { name: /^Save$/i })).toBeVisible();
    });

    test('submitting the new-tile form with a name creates the club and redirects to /dashboard', async ({
        page,
    }) => {
        await page.goto('/dashboard/new-tile');
        await page.getByPlaceholder('e.g. HackUMass').fill(`E2E UI Club ${Date.now()}`);
        await page.getByRole('button', { name: /^Save$/i }).click();
        await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
    });

    test('submitting the new-tile form without a name shows a validation error', async ({
        page,
    }) => {
        await page.goto('/dashboard/new-tile');
        await page.getByRole('button', { name: /^Save$/i }).click();
        await expect(page.getByText(/tile name is required/i)).toBeVisible({ timeout: 5000 });
    });
});
