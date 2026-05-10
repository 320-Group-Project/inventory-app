import { test, expect } from '@playwright/test';

// Smoke tests against a locally running dev server.
// Start the app first:  npm run dev   (in another terminal)

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

test('login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});

test('sign-up page loads and shows email field', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-up`);
    await expect(page.getByPlaceholder(/umass\.edu/i)).toBeVisible();
});

test('protected dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/auth\/login/);
});
