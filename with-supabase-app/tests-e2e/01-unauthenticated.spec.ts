/**
 * 01 — Unauthenticated user flows
 *
 * Verifies that:
 *  - Public auth pages (/auth/login, /auth/sign-up, …) are accessible
 *  - Every protected API route returns HTTP 401
 *  - Protected page routes render with empty/unauthenticated state (no redirect,
 *    but no real data either — the app relies on API 401s rather than middleware)
 */
import { test, expect } from '@playwright/test';

// ─── Public routes ────────────────────────────────────────────────────────────

test.describe('Public auth pages are accessible', () => {
    test('/auth/login renders the login form', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
    });

    test('/auth/sign-up renders the sign-up form', async ({ page }) => {
        await page.goto('/auth/sign-up');
        await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
    });

    test('/auth/forgot-password is reachable', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await expect(page).toHaveURL('/auth/forgot-password');
    });
});

// ─── Protected API endpoints ───────────────────────────────────────────────────

test.describe('Protected API routes return 401 for unauthenticated requests', () => {
    test('GET /api/dashboard → 401', async ({ request }) => {
        const res = await request.get('/api/dashboard');
        expect(res.status()).toBe(401);
        expect((await res.json()).error).toMatch(/unauthorized/i);
    });

    test('GET /api/profile → 401', async ({ request }) => {
        const res = await request.get('/api/profile');
        expect(res.status()).toBe(401);
    });

    test('POST /api/profile/save → 401', async ({ request }) => {
        const res = await request.post('/api/profile/save', {
            multipart: { fname: 'Test', lname: 'User' },
        });
        expect(res.status()).toBe(401);
    });

    test('POST /api/tiles → 401', async ({ request }) => {
        const res = await request.post('/api/tiles', {
            data: { title: 'Unauthorized Club Attempt' },
        });
        expect(res.status()).toBe(401);
    });

    test('DELETE /api/tiles/1 → 401', async ({ request }) => {
        const res = await request.delete('/api/tiles/1');
        expect(res.status()).toBe(401);
    });

    test('GET /api/clubs/1/settings → 401', async ({ request }) => {
        const res = await request.get('/api/clubs/1/settings');
        expect(res.status()).toBe(401);
    });

    test('PATCH /api/clubs/1/settings → 401', async ({ request }) => {
        const res = await request.patch('/api/clubs/1/settings', {
            data: { name: 'Unauthorized Rename' },
        });
        expect(res.status()).toBe(401);
    });

    test('GET /api/clubs/1/members → 401', async ({ request }) => {
        const res = await request.get('/api/clubs/1/members');
        expect(res.status()).toBe(401);
    });

    test('DELETE /api/clubs/1/members/some-uid → 401', async ({ request }) => {
        const res = await request.delete('/api/clubs/1/members/some-uid');
        expect(res.status()).toBe(401);
    });

    test('PATCH /api/clubs/1/members/some-uid/role → 401', async ({ request }) => {
        const res = await request.patch('/api/clubs/1/members/some-uid/role', {
            data: { role: 'Admin' },
        });
        expect(res.status()).toBe(401);
    });
});

// ─── Protected page routes ────────────────────────────────────────────────────

test.describe('Protected page routes render without real data for unauthenticated users', () => {
    test('/dashboard loads but shows the empty-clubs message', async ({ page }) => {
        await page.goto('/dashboard');
        // Wait for the API call to settle (returns 401 silently; tiles stays empty)
        await page.waitForLoadState('networkidle');
        // The "New Tile" FAB is always rendered regardless of auth state
        await expect(page.getByRole('link', { name: /New Tile/i })).toBeVisible({ timeout: 8000 });
        // The empty state message should be visible (no tiles were loaded)
        await expect(
            page.getByText(/haven't joined any clubs/i),
        ).toBeVisible({ timeout: 8000 });
    });

    test('/profile loads but the email field is empty (no auth data returned)', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        // The email input is rendered once the loading spinner goes away
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible({ timeout: 8000 });
        await expect(emailInput).toHaveValue('');
    });
});
