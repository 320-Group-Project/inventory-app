/**
 * 04 — Admin role: permitted operations
 *
 * Runs as the test Admin user (storageState: admin.json).
 *
 * Verifies that:
 *  - Admin can read club settings and member list
 *  - Admin can rename the club
 *  - Admin can promote / demote a member's role
 *  - Admin cannot remove themselves (safety guard → 400)
 *  - The settings page UI is accessible and shows expected controls
 */
import { test, expect } from '@playwright/test';
import { loadContext, type TestContext } from './test-context';

let ctx: TestContext;
test.beforeAll(() => { ctx = loadContext(); });

// ─── Club settings API ─────────────────────────────────────────────────────────

test.describe('Admin — club settings API', () => {
    test('GET /api/clubs/{id}/settings returns the club name', async ({ request }) => {
        const res = await request.get(`/api/clubs/${ctx.clubId}/settings`);
        expect(res.status()).toBe(200);

        const body = await res.json();
        expect(body.club_id).toBe(ctx.clubId);
        expect(body.name).toBe(ctx.testClubName);
    });

    test('PATCH /api/clubs/{id}/settings renames the club', async ({ request }) => {
        const renamed = `${ctx.testClubName} Renamed`;

        const patchRes = await request.patch(`/api/clubs/${ctx.clubId}/settings`, {
            data: { name: renamed },
        });
        expect(patchRes.status()).toBe(200);
        expect((await patchRes.json()).success).toBe(true);

        // Confirm the new name is persisted
        const getRes = await request.get(`/api/clubs/${ctx.clubId}/settings`);
        expect((await getRes.json()).name).toBe(renamed);

        // Restore original name so other tests aren't affected
        await request.patch(`/api/clubs/${ctx.clubId}/settings`, {
            data: { name: ctx.testClubName },
        });
    });

    test('PATCH with a blank name returns 400', async ({ request }) => {
        const res = await request.patch(`/api/clubs/${ctx.clubId}/settings`, {
            data: { name: '   ' },
        });
        expect(res.status()).toBe(400);
    });
});

// ─── Members API ───────────────────────────────────────────────────────────────

test.describe('Admin — members API', () => {
    test('GET /api/clubs/{id}/members returns a list that includes both test users', async ({
        request,
    }) => {
        const res = await request.get(`/api/clubs/${ctx.clubId}/members`);
        expect(res.status()).toBe(200);

        const { members } = await res.json();
        expect(Array.isArray(members)).toBe(true);
        expect(members.length).toBeGreaterThanOrEqual(2);

        const adminEntry = members.find((m: { uid: string }) => m.uid === ctx.adminUserId);
        const memberEntry = members.find((m: { uid: string }) => m.uid === ctx.memberUserId);

        expect(adminEntry).toBeDefined();
        expect(adminEntry.role).toBe('Admin');

        expect(memberEntry).toBeDefined();
        expect(memberEntry.role).toBe('Member');
    });

    test('PATCH …/role promotes a Member to Admin and back', async ({ request }) => {
        const promote = await request.patch(
            `/api/clubs/${ctx.clubId}/members/${ctx.memberUserId}/role`,
            { data: { role: 'Admin' } },
        );
        expect(promote.status()).toBe(200);

        // Verify the role change was applied
        const afterPromote = await request.get(`/api/clubs/${ctx.clubId}/members`);
        const { members: afterMembers } = await afterPromote.json();
        expect(
            afterMembers.find((m: { uid: string }) => m.uid === ctx.memberUserId).role,
        ).toBe('Admin');

        // Demote back to Member (so test 05 still has a Member-role user to test)
        const demote = await request.patch(
            `/api/clubs/${ctx.clubId}/members/${ctx.memberUserId}/role`,
            { data: { role: 'Member' } },
        );
        expect(demote.status()).toBe(200);
    });

    test('PATCH …/role with an invalid role value returns 400', async ({ request }) => {
        const res = await request.patch(
            `/api/clubs/${ctx.clubId}/members/${ctx.memberUserId}/role`,
            { data: { role: 'Superuser' } },
        );
        expect(res.status()).toBe(400);
    });

    test('DELETE self returns 400 "Cannot remove yourself"', async ({ request }) => {
        const res = await request.delete(
            `/api/clubs/${ctx.clubId}/members/${ctx.adminUserId}`,
        );
        expect(res.status()).toBe(400);
        expect((await res.json()).error).toMatch(/cannot remove yourself/i);
    });

    test('DELETE another member removes them from the club', async ({ request }) => {
        // Remove the member user
        const delRes = await request.delete(
            `/api/clubs/${ctx.clubId}/members/${ctx.memberUserId}`,
        );
        expect(delRes.status()).toBe(200);
        expect((await delRes.json()).success).toBe(true);

        // Confirm they no longer appear in the member list
        const listRes = await request.get(`/api/clubs/${ctx.clubId}/members`);
        const { members } = await listRes.json();
        expect(members.find((m: { uid: string }) => m.uid === ctx.memberUserId)).toBeUndefined();

        // NOTE: The member user is now removed from the test club.
        // Test 05 (as-member) will verify that a non-admin / ex-member still receives 403
        // on admin-only endpoints, which remains the correct behaviour.
    });
});

// ─── Settings page UI ──────────────────────────────────────────────────────────

test.describe('Admin — club settings page UI', () => {
    test('/clubs/{id}/settings is reachable and shows the club name', async ({ page }) => {
        await page.goto(`/clubs/${ctx.clubId}/settings`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(ctx.testClubName)).toBeVisible({ timeout: 8000 });
    });

    test('settings page shows an Edit button for the club name', async ({ page }) => {
        await page.goto(`/clubs/${ctx.clubId}/settings`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('button', { name: /^Edit$/i })).toBeVisible({ timeout: 8000 });
    });

    test('settings page shows the Members section with an + Add Member link', async ({ page }) => {
        await page.goto(`/clubs/${ctx.clubId}/settings`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('Members')).toBeVisible({ timeout: 8000 });
        await expect(page.getByRole('link', { name: /Add Member/i })).toBeVisible({ timeout: 8000 });
    });

    test('clicking Edit reveals an input and Save/Cancel buttons', async ({ page }) => {
        await page.goto(`/clubs/${ctx.clubId}/settings`);
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /^Edit$/i }).click();
        await expect(page.getByRole('button', { name: /^Save$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /^Cancel$/i })).toBeVisible();
    });
});
