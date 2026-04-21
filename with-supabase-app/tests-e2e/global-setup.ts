import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const BASE_URL =
    process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const AUTH_DIR = path.join(__dirname, ".auth");
const CONTEXT_FILE = path.join(__dirname, "test-context.json");

async function signInAndSaveState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    browser: any,
    email: string,
    password: string,
    authFile: string,
) {
    const page = await browser.newPage();
    try {
        await page.goto(`${BASE_URL}/auth/login`);
        await page.locator("#email").fill(email);
        await page.locator("#password").fill(password);
        await page.getByRole("button", { name: "Login" }).click();
        await page
            .waitForURL(`${BASE_URL}/dashboard`, { timeout: 20_000 })
            .catch(() => {
                throw new Error(
                    `Login redirect did not occur for ${email}.\n` +
                        "Check: (1) the dev server is running, (2) the user was created successfully.",
                );
            });
        await page.context().storageState({ path: authFile });
    } finally {
        await page.close();
    }
}

export default async function globalSetup() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
            "Missing env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.\n" +
                "Make sure .env.local is present and correctly configured.",
        );
    }
    if (!SERVICE_ROLE_KEY) {
        throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY is required for E2E tests.\n" +
                "Add it to .env.local (Supabase project settings → API → service_role).",
        );
    }

    const suffix = Date.now().toString();
    const testClubName = `E2E Club ${suffix}`;

    const users = {
        admin: {
            email: `e2e.admin.${suffix}@example.com`,
            password: "E2eTest123!",
        },
        member: {
            email: `e2e.member.${suffix}@example.com`,
            password: "E2eTest123!",
        },
        other: {
            email: `e2e.other.${suffix}@example.com`,
            password: "E2eTest123!",
        },
    };

    // Service-role client — used ONLY for auth user creation and the member Role insert.
    // We deliberately avoid using it for Club creation because the hosted Supabase has a
    // trigger on the Club table that calls auth.uid(), which is null for the service role.
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Step 1: create the three test auth users (email_confirm skips email verification)
    const userIds: Record<string, string> = {};
    for (const [role, creds] of Object.entries(users)) {
        const { data, error } = await svc.auth.admin.createUser({
            email: creds.email,
            password: creds.password,
            email_confirm: true,
        });
        if (error)
            throw new Error(`Failed to create ${role} user: ${error.message}`);
        userIds[role] = data.user!.id;
    }

    // Give the handle_new_user DB trigger time to create public."User" rows
    await new Promise((r) => setTimeout(r, 2000));

    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const browser = await chromium.launch();

    try {
        // Step 2: sign admin in and capture their auth cookies
        await signInAndSaveState(
            browser,
            users.admin.email,
            users.admin.password,
            path.join(AUTH_DIR, "admin.json"),
        );

        // Step 3: create the test club via the app API using admin's real session.
        // This avoids the auth.uid() = null problem that occurs when the service-role
        // client calls create_club_with_admin() or inserts into Club directly.
        let clubId: number;
        const adminCtx = await browser.newContext({
            storageState: path.join(AUTH_DIR, "admin.json"),
        });
        try {
            const adminPage = await adminCtx.newPage();
            const clubRes = await adminPage.request.post(
                `${BASE_URL}/api/tiles`,
                { data: { title: testClubName } },
            );
            if (!clubRes.ok()) {
                const body = await clubRes.json().catch(() => ({}));
                throw new Error(
                    `POST /api/tiles failed (${clubRes.status()}): ${(body as { error?: string }).error ?? "unknown"}`,
                );
            }
            const clubBody = (await clubRes.json()) as { club_id: number };
            clubId = clubBody.club_id;
        } finally {
            await adminCtx.close();
        }

        // Step 4: add the member user to the club via service role.
        // The Role table does NOT have the auth.uid() trigger issue — the service-role
        // client can insert here freely (RLS is bypassed).
        const { error: roleErr } = await svc.from("Role").insert({
            club_id: clubId,
            UID: userIds.member,
            role: "Member",
        });
        if (roleErr)
            throw new Error(`Failed to insert member role: ${roleErr.message}`);

        // Step 5: sign in member and other, capture their auth cookies
        await signInAndSaveState(
            browser,
            users.member.email,
            users.member.password,
            path.join(AUTH_DIR, "member.json"),
        );
        await signInAndSaveState(
            browser,
            users.other.email,
            users.other.password,
            path.join(AUTH_DIR, "other.json"),
        );

        // Step 6: write shared test context for spec files to consume
        fs.writeFileSync(
            CONTEXT_FILE,
            JSON.stringify(
                {
                    suffix,
                    clubId,
                    testClubName,
                    adminUserId: userIds.admin,
                    memberUserId: userIds.member,
                    otherUserId: userIds.other,
                    adminEmail: users.admin.email,
                    memberEmail: users.member.email,
                    otherEmail: users.other.email,
                },
                null,
                2,
            ),
        );

        console.log(
            `\n✓ E2E setup done — clubId: ${clubId}, suffix: ${suffix}\n`,
        );
    } finally {
        await browser.close();
    }
}
