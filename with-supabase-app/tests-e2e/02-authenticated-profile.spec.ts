/**
 * 02 — Authenticated user: profile access and editing
 *
 * Runs as the test Admin user (storageState: admin.json).
 *
 * Verifies that:
 *  - /api/profile returns THIS user's data, not someone else's
 *  - /api/profile/save persists name changes
 *  - The profile page UI shows the correct email and allows editing
 *  - The email field is read-only (cannot be changed via the UI)
 */
import { test, expect } from '@playwright/test';
import { loadContext, type TestContext } from './test-context';

let ctx: TestContext;
test.beforeAll(() => { ctx = loadContext(); });

// ─── API ───────────────────────────────────────────────────────────────────────

test.describe('Profile API — authenticated admin user', () => {
    test("GET /api/profile returns the admin user's own data", async ({ request }) => {
        const res = await request.get('/api/profile');
        expect(res.status()).toBe(200);

        const body = await res.json();
        expect(body.email).toBe(ctx.adminEmail);
        expect(body).toHaveProperty('fname');
        expect(body).toHaveProperty('lname');
        expect(body).toHaveProperty('user_image_url');
    });

    test('POST /api/profile/save updates first and last name', async ({ request }) => {
        const res = await request.post('/api/profile/save', {
            multipart: { fname: 'E2E', lname: 'Admin' },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);

        // Confirm the change persisted
        const profile = await (await request.get('/api/profile')).json();
        expect(profile.fname).toBe('E2E');
        expect(profile.lname).toBe('Admin');
    });

    test('POST /api/profile/save with no fields returns 200 (nothing to update)', async ({
        request,
    }) => {
        // Sending an empty multipart body — the API returns success with a message
        const res = await request.post('/api/profile/save', {
            multipart: {},
        });
        expect(res.status()).toBe(200);
    });
});

// ─── UI ───────────────────────────────────────────────────────────────────────

test.describe('Profile page UI — authenticated admin user', () => {
    test("profile page displays the authenticated user's email", async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible({ timeout: 8000 });
        await expect(emailInput).toHaveValue(ctx.adminEmail);
    });

    test('email field is read-only', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('input[type="email"]')).toHaveAttribute('readonly');
    });

    test('can update first and last name via the profile form', async ({ page }) => {
        await page.goto('/profile');

        const firstNameInput = page.locator('input[placeholder="First Name"]');
        await expect(firstNameInput).toBeVisible({ timeout: 8000 });

        await firstNameInput.fill('UpdatedFirst');
        await page.locator('input[placeholder="Last Name"]').fill('UpdatedLast');

        await page.getByRole('button', { name: /^Save$/i }).click();

        await expect(page.getByText('Profile saved!')).toBeVisible({ timeout: 6000 });
    });

    test('profile page has a Logout button', async ({ page }) => {
        await page.goto('/profile');
        await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({ timeout: 8000 });
    });
});
