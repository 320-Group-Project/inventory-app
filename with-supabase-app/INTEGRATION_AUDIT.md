# Supabase Integration Audit Plan

Current status of each key user flow and what still needs to be verified or implemented.

---

## ✅ Already Fixed (this session)

| # | Issue | Migration |
|---|-------|-----------|
| 1 | `Role.club_id` had a UNIQUE constraint — only one member per club allowed | `20260421000001` |
| 2 | No composite unique on `(club_id, UID)` — upsert in POST /api/tiles was broken | `20260421000001` |
| 3 | `Role.PK` had no auto-increment default | `20260421000001` |
| 4 | `item_category.item_cat_id` had no auto-increment default | `20260421000002` |
| 5 | No trigger to create a `User` row on signup | `20260421000003` |
| 6 | No RLS policies — all data was unprotected | `20260421000004` |
| 7 | `database.ts` type: `isOneToOne: true` on `Role_club_id_fkey` | Fixed in code |
| 8 | `database.ts` type: `item_cat_id` was required in Insert | Fixed in code |

---

## Key User Flows — Status

### 1. Sign Up / Sign In
- **Route:** Supabase Auth (handled by Supabase client)
- **Status:** ✅ Auth works. Trigger `on_auth_user_created` now auto-creates a `User` row.
- **Verify:** Sign up a new user → check `public.User` table for the new row.
- **Gap:** Existing auth users created before migration 3 have no `User` row. Run a backfill:
  ```sql
  INSERT INTO public."User" ("UID", email)
  SELECT id, email FROM auth.users
  ON CONFLICT ("UID") DO NOTHING;
  ```

### 2. Profile (GET /api/profile)
- **Route:** `app/api/profile/route.ts`
- **Status:** ✅ Query is correct. Now protected by RLS.
- **Verify:** Logged-in user can fetch their own profile; another user's UID is blocked by RLS.

### 3. Profile Save (POST /api/profile/save)
- **Route:** `app/api/profile/save/route.ts`
- **Status:** ⚠️ Needs `profile_pictures` storage bucket to exist in Supabase Storage.
- **Action:** Create the bucket in Supabase Dashboard → Storage → New bucket → `profile_pictures` (public).
- **Verify:** Upload a profile picture and confirm `user_image_url` is set in the `User` row.

### 4. Create Club / Tile (POST /api/tiles)
- **Route:** `app/api/tiles/route.ts`
- **Status:** ✅ Fixed — upsert now resolves on `(club_id, UID)` unique constraint.
- **Verify:** POST `{ title: "hackumass", members: "hello@umass.edu" }` → should return `{ success: true, club_id: N }`.

### 5. Dashboard (GET /api/dashboard)
- **Route:** `app/api/dashboard/route.ts`
- **Status:** ✅ Two-query pattern avoids RLS recursion. Correct.
- **Verify:** After creating a club, the dashboard lists it with `role: "Admin"`.

### 6. Club Settings — Read/Rename (GET/PATCH /api/clubs/[org]/settings)
- **Route:** `app/api/clubs/[org]/settings/route.ts`
- **Status:** ✅ Admin gate is in place.
- **Verify:** Non-admin user gets 403 on PATCH; Admin can rename successfully.

### 7. Club Members List (GET /api/clubs/[org]/members)
- **Route:** `app/api/clubs/[org]/members/route.ts`
- **Status:** ✅ Two-query pattern. Correct.
- **Verify:** Members list returns correct `fname`, `lname`, `email` after sign-up trigger populates `User` rows.

### 8. Add Members / Invite (POST /api/clubs/[org]/settings/add-members)
- **Route:** `app/api/clubs/[org]/settings/add-members/route.ts`
- **Status:** ⚠️ Sends invite emails via Resend but does NOT add the member to the `Role` table. The invite link `/api/clubs/[org]/members/invite/accept` does not exist yet.
- **Action:** Implement `app/api/clubs/[org]/members/invite/accept/route.ts` — on click, insert a `Role` row with `role: 'Member'` for the invited user's UID.
- **Verify:** End-to-end invite flow: send → click link → user appears in members list.

### 9. Change Member Role (PATCH /api/clubs/[org]/members/[userId]/role)
- **Route:** `app/api/clubs/[org]/members/[userId]/role/route.ts`
- **Status:** ✅ Admin gate in place. Correct.
- **Verify:** Admin can change a Member to Admin; non-admin gets 403.

### 10. Remove Member (DELETE /api/clubs/[org]/members/[userId])
- **Route:** `app/api/clubs/[org]/members/[userId]/route.ts`
- **Status:** ✅ Admin gate, self-removal blocked. Correct.
- **Verify:** Admin can remove a Member; trying to remove self returns 400.

### 11. Leave Club (DELETE /api/tiles/[tileId])
- **Route:** `app/api/tiles/[tileId]/route.ts`
- **Status:** ⚠️ Missing guard: an Admin can leave, orphaning the club with no Admin. Add a check that at least one other Admin exists before allowing the leave.
- **Verify:** Last Admin leave → should return an error; Member leave → succeeds.

### 12. Items & Categories
- **Routes:** None yet.
- **Status:** ❌ No API routes for `item` or `item_category` exist. The tables and RLS are set up.
- **Action:** Implement CRUD routes:
  - `GET/POST /api/clubs/[org]/categories`
  - `GET/POST/PATCH/DELETE /api/clubs/[org]/categories/[catId]/items`

---

## Outstanding Schema / Config Items

| Item | Priority | Notes |
|------|----------|-------|
| `profile_pictures` storage bucket | High | Required for profile photo upload |
| Invite accept route | High | Without it invite links 404 |
| Backfill existing auth users → `User` table | High | Pre-migration users have no profile row |
| `User.password` column removal | Medium | Password is managed by Supabase Auth; column is a dead field and a misleading security signal |
| Item/category routes | Medium | Core inventory feature is missing |
| Last-admin guard on leave club | Medium | Data integrity — clubs would become inaccessible |
| `item_category.quantity` type | Low | Currently `string`; consider changing to `integer` if it represents numeric quantity |
