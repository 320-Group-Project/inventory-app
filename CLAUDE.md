# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # eslint
npm test             # jest
npm run db:generate  # regenerate lib/types/database.ts from Supabase schema
```

## Environment Variables

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

## Architecture

Next.js 16 App Router project. Pages are server components under `app/`; all data mutations go through API route handlers under `app/api/`. Styling is Tailwind CSS + DaisyUI + Radix UI.

### Supabase Clients

Two clients — always pick the right one:
- `lib/supabase/server.ts` — async, used in API routes and server components. Create a new instance per request (never cache globally).
- `lib/supabase/client.ts` — browser-side, used in client components.

Auth is Supabase SSR (session in cookies). Get the current user with `supabase.auth.getUser()`.

### Database Schema

| Table | Key columns | Notes |
|---|---|---|
| `User` | `UID`, `fname`, `lname`, `user_image_url` | UID matches Supabase auth user id. **No `email` column** — email comes from `supabase.auth.getUser()` |
| `Club` | `club_id`, `name` | |
| `Role` | `club_id`, `UID`, `role` | Join table; role is `'Owner'`, `'Admin'`, or `'Member'`. Owner has all Admin permissions. |
| `item_category` | `item_cat_id`, `club_id`, `name`, `description`, `quantity`, `item_cat_image_url` | `quantity` is a varchar string set manually, not a computed count |
| `item` | `item_id`, `cat_id`, `name`, `description`, `condition`, `availability`, `item_image_url` | `condition` and `availability` are USER-DEFINED enum types. **Known issue:** PostgREST schema cache sometimes drops these columns — fix by running `NOTIFY pgrst, 'reload schema';` in the SQL editor. Permanent fix: convert to varchar with CHECK constraint. |

**Critical:** The `Role` table is both the membership list and the source of dashboard tiles. A user's tiles are all their `Role` rows. Deleting a `Role` row removes both club membership and the dashboard tile simultaneously — so the dashboard tile-remove button and the "leave club" button both call the same endpoint: `DELETE /api/clubs/:org/members/me`.

**Owner rules:**
- Whoever creates a club via `POST /api/tiles` is automatically inserted as the `'Owner'`.
- Each club has exactly one Owner. Owner cannot be demoted, removed, or leave the club; ownership transfer is not yet implemented.
- Owner protections are enforced in `members/me`, `members/[userId]`, `members/[userId]/role`, and `settings` routes.

#### Full SQL Schema (source of truth)

```sql
CREATE TABLE public.Club (
  club_id numeric NOT NULL DEFAULT nextval('"Club_club_id_seq"'::regclass),
  name character varying UNIQUE,
  CONSTRAINT Club_pkey PRIMARY KEY (club_id)
);
CREATE TABLE public.User (
  fname character varying,
  lname character varying,
  user_image_url text,
  UID uuid NOT NULL,
  CONSTRAINT User_pkey PRIMARY KEY (UID)
);
CREATE TABLE public.Role (
  role character varying,
  club_id numeric NOT NULL,
  UID uuid NOT NULL,
  CONSTRAINT Role_pkey PRIMARY KEY (club_id, UID),
  CONSTRAINT Role_UID_fkey FOREIGN KEY (UID) REFERENCES public.User(UID),
  CONSTRAINT Role_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.Club(club_id)
);
CREATE TABLE public.item_category (
  item_cat_id numeric NOT NULL DEFAULT nextval('item_category_item_cat_id_seq'::regclass),
  name character varying NOT NULL,
  quantity character varying NOT NULL,
  description text,
  club_id numeric NOT NULL,
  item_cat_image_url text,
  CONSTRAINT item_category_pkey PRIMARY KEY (item_cat_id),
  CONSTRAINT item_category_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.Club(club_id)
);
CREATE TABLE public.item (
  item_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying,
  condition USER-DEFINED,  -- enum: 'New', 'Fair', 'Damaged'
  availability USER-DEFINED,  -- enum: 'Available', 'Checked Out'
  description text,
  cat_id numeric,
  item_image_url text,
  CONSTRAINT item_pkey PRIMARY KEY (item_id),
  CONSTRAINT item_cat_id_fkey FOREIGN KEY (cat_id) REFERENCES public.item_category(item_cat_id)
);
```

### Admin Check Pattern

Every admin-gated API route does this before any mutation:

```ts
const { data: roleData } = await supabase
  .from('Role')
  .select('role')
  .eq('club_id', clubId)
  .eq('UID', user.id)
  .single();

if (!roleData || !['Admin', 'Owner'].includes(roleData.role ?? '')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Supabase Storage Buckets

All buckets are public. Use the exact names below (spaces and capitalization matter):

| Bucket name | Used for |
|---|---|
| `profile_pictures` | User profile images — files stored under `{userId}/filename` to satisfy RLS |
| `Item Pictures` | Item images — flat filename `item-{categoryId}-{timestamp}` |
| `Item Category Pictures` | Item category images — flat filename `category-{clubId}-{timestamp}` |

**Image upload pattern** — always convert `File` to `Buffer` before uploading or Supabase storage will throw "fetch failed" in Next.js API routes:
```ts
const buffer = Buffer.from(await file.arrayBuffer());
await supabase.storage.from('bucket-name').upload(fileName, buffer, { contentType: file.type });
```

### Required Supabase RLS Policies

These must exist or features will break:

| Table/Bucket | Operation | Policy expression |
|---|---|---|
| `Role` | INSERT | `"UID" = auth.uid() AND role = 'Member'` — allows invite accept |
| `item` | SELECT | `EXISTS (SELECT 1 FROM item_category ic JOIN "Role" r ON r.club_id = ic.club_id WHERE ic.item_cat_id = item.cat_id AND r."UID" = auth.uid())` |
| `Item Pictures` | INSERT | `bucket_id = 'Item Pictures'` |
| `Item Pictures` | UPDATE | `bucket_id = 'Item Pictures'` |
| `Item Pictures` | SELECT | `bucket_id = 'Item Pictures'` |
| `Item Category Pictures` | INSERT | `bucket_id = 'Item Category Pictures'` |
| `Item Category Pictures` | UPDATE | `bucket_id = 'Item Category Pictures'` |
| `Item Category Pictures` | SELECT | `bucket_id = 'Item Category Pictures'` |
| `profile_pictures` | INSERT | `(auth.uid())::text = (storage.foldername(name))[1]` |
| `profile_pictures` | UPDATE | `(auth.uid())::text = (storage.foldername(name))[1]` |

### Email Invites

Invites are sent via Resend (`resend` package) using the `'club-invites'` template id (with template variables `Club_Name`, `Inviter`, `Club_Link`). All invited emails must end in `@umass.edu` — enforced in both invite routes.

**Accept route flow:**
- If user is logged in → inserts a `Role` row → redirects to `/dashboard`
- If user is NOT logged in → redirects to `/auth/login?redirectTo=<accept-url>`. Login and sign-up forms both read `redirectTo` and use it as the post-auth destination.

### Profile

- `GET /api/profile` — returns `{ profile: { fname, lname, user_image_url } }`. Auto-creates an empty `User` row on first load if none exists.
- `PATCH /api/profile` — accepts `FormData` with optional `fname`, `lname`, `picture` (File). Uploads to `profile_pictures` bucket under `{userId}/` folder.

### Route Params

All dynamic API routes receive params as a `Promise` and must be awaited:
```ts
const { org } = await params;
const clubId = Number(org);  // org is always a numeric club_id
```

### UMass Email Enforcement

`@umass.edu` is required in three places:
- **Sign-up form** (`components/sign-up-form.tsx`) — client-side check before Supabase auth call
- **Invite members** (`app/api/clubs/[org]/members/invite/route.ts`) — server rejects non-`@umass.edu` with 400
- **New tile members** (`app/api/tiles/route.ts`) — same check on optional members list

---

## Route Implementation Status

### Profile
| Method | Path | File | Status |
|---|---|---|---|
| GET | `/api/profile` | `app/api/profile/route.ts` | ✅ Done |
| PATCH | `/api/profile` | `app/api/profile/route.ts` | ✅ Done |

### Tiles / Club Creation
| Method | Path | File | Status |
|---|---|---|---|
| GET | `/api/tiles` | `app/api/tiles/route.ts` | ✅ Done — returns all clubs for current user with role |
| POST | `/api/tiles` | `app/api/tiles/route.ts` | ✅ Done |

### Clubs & Members
| Method | Path | File | Status |
|---|---|---|---|
| GET | `/api/clubs/:org/members?search=` | `app/api/clubs/[org]/members/route.ts` | ✅ Done |
| POST | `/api/clubs/:org/members/invite` | `app/api/clubs/[org]/members/invite/route.ts` | ✅ Done |
| GET | `/api/clubs/:org/members/invite/accept` | `app/api/clubs/[org]/members/invite/accept/route.ts` | ✅ Done |
| GET | `/api/clubs/:org/members/me` | `app/api/clubs/[org]/members/me/route.ts` | ✅ Done — returns `{ role }` for current user |
| DELETE | `/api/clubs/:org/members/me` | `app/api/clubs/[org]/members/me/route.ts` | ✅ Done |
| PATCH | `/api/clubs/:org/members/:userId/role` | `app/api/clubs/[org]/members/[userId]/role/route.ts` | ✅ Done |
| DELETE | `/api/clubs/:org/members/:userId` | `app/api/clubs/[org]/members/[userId]/route.ts` | ✅ Done |
| GET | `/api/clubs/:org/settings` | `app/api/clubs/[org]/settings/route.ts` | ✅ Done — returns `{ name, role }` |
| POST | `/api/clubs/:org/settings` | `app/api/clubs/[org]/settings/route.ts` | ✅ Done |

### Categories
| Method | Path | File | Status |
|---|---|---|---|
| GET | `/api/clubs/:org/category?search=` | `app/api/clubs/[org]/category/route.ts` | ✅ Done — includes `available_count` and `total_count` |
| POST | `/api/clubs/:org/category` | `app/api/clubs/[org]/category/route.ts` | ✅ Done |
| PATCH | `/api/clubs/:org/category/:categoryId` | `app/api/clubs/[org]/category/[categoryId]/route.ts` | ✅ Done |
| DELETE | `/api/clubs/:org/category/:categoryId` | `app/api/clubs/[org]/category/[categoryId]/route.ts` | ✅ Done |

### Items
| Method | Path | File | Status |
|---|---|---|---|
| GET | `/api/clubs/:org/category/:categoryId/items?search=` | `app/api/clubs/[org]/category/[categoryId]/items/route.ts` | ✅ Done |
| POST | `/api/clubs/:org/category/:categoryId/items` | `app/api/clubs/[org]/category/[categoryId]/items/route.ts` | ✅ Done |
| GET | `/api/clubs/:org/category/:categoryId/items/:itemId` | `app/api/clubs/[org]/category/[categoryId]/items/[itemId]/route.ts` | ✅ Done |
| PATCH | `/api/clubs/:org/category/:categoryId/items/:itemId` | `app/api/clubs/[org]/category/[categoryId]/items/[itemId]/route.ts` | ✅ Done |
| DELETE | `/api/clubs/:org/category/:categoryId/items/:itemId` | `app/api/clubs/[org]/category/[categoryId]/items/[itemId]/route.ts` | ✅ Done |

---

## Frontend Page Status

| Page | Status | Notes |
|---|---|---|
| `/auth/login` | ✅ Wired | Reads `redirectTo` param for invite flow |
| `/auth/sign-up` | ✅ Wired | Enforces `@umass.edu`, preserves `redirectTo` |
| `/profile` | ✅ Wired | Fetches + updates profile, image upload with preview |
| `/dashboard` | ✅ Wired | Loads real clubs via `GET /api/tiles` |
| `/dashboard/new-tile` | ✅ Wired | Calls `POST /api/tiles` |
| `/dashboard/[org]` | ✅ Wired | Loads real categories with available/total counts |
| `/clubs/[org]/category/new` | ✅ Wired | Calls `POST /api/clubs/:org/category` |
| `/clubs/[org]/category/[categoryId]` | ✅ Wired | Loads real items, popup detail view |
| `/clubs/[org]/category/[categoryId]/item/new` | ✅ Wired | Calls `POST /api/clubs/:org/category/:categoryId/items` |
| `/clubs/[org]/settings` | ✅ Wired | Real members, save name, change role, remove member |
| `/clubs/[org]/settings/add-members` | ✅ Wired | Calls `POST /api/clubs/:org/members/invite` |
| `/clubs/[org]/category/[categoryId]/edit` | ❌ Not wired | UI built, needs `GET` to load + `PATCH`/`DELETE` on save |
| `/clubs/[org]/category/[categoryId]/item/[itemId]/edit` | ❌ Not wired | UI built, needs `GET` to load + `PATCH`/`DELETE` on save |
| `/clubs/[org]/category/[categoryId]/item/[itemId]` | ❌ Not wired | Placeholder only — full page needed |

---

## TODO

### High Priority
- **Wire edit category page** (`/clubs/[org]/category/[categoryId]/edit`) — fetch current category data on load, wire Save to `PATCH /api/clubs/:org/category/:categoryId`, wire Delete to `DELETE /api/clubs/:org/category/:categoryId`. Note: the UI uses generic components (`ItemNameInput`, `Counter`, `AnnotatedImage`, `BigButton`, `DescriptionBox`) that need state passed into them.
- **Wire edit item page** (`/clubs/[org]/category/[categoryId]/item/[itemId]/edit`) — fetch item on load via `GET /api/clubs/:org/category/:categoryId/items/:itemId`, wire Save to `PATCH`, wire Delete to `DELETE`. Condition and availability are radio buttons already in the UI.

### Known Issues
- **`condition` and `availability` enum columns** — PostgREST schema cache periodically drops these columns causing 500 errors. Workaround: run `NOTIFY pgrst, 'reload schema';` in Supabase SQL editor. Permanent fix: convert both columns from USER-DEFINED enum to `varchar` with CHECK constraints using this SQL:
  ```sql
  ALTER TABLE public.item ALTER COLUMN condition TYPE varchar USING condition::text;
  ALTER TABLE public.item ADD CONSTRAINT item_condition_check CHECK (condition IN ('New', 'Fair', 'Damaged'));
  ALTER TABLE public.item ALTER COLUMN availability TYPE varchar USING availability::text;
  ALTER TABLE public.item ADD CONSTRAINT item_availability_check CHECK (availability IN ('Available', 'Checked Out'));
  NOTIFY pgrst, 'reload schema';
  ```

### Lower Priority
- **Item detail page** (`/clubs/[org]/category/[categoryId]/item/[itemId]`) — currently a placeholder div. The category page popup already covers this use case, so low urgency.
- **Ownership transfer** — no mechanism to transfer Owner role. Currently an Owner is stuck forever.
- **Leave club for Owner** — Owner cannot leave; only option is deleting the club entirely (no endpoint for this yet).

## Route Implementation Notes

- **GET `/api/tiles`** — Queries `Role` joined with `Club` for the current user. Returns `{ tiles: [{ club_id, name, role }] }`.
- **GET `/api/clubs/:org/category`** — Returns categories with `available_count` and `total_count` computed from the `item` table in a second query (2 queries total, not N+1).
- **POST `/api/tiles`** — Creates a new `Club` row, inserts the creator as `'Owner'` in `Role`, optionally sends invite emails. No `DELETE` endpoint — tile removal goes through `DELETE /api/clubs/:org/members/me`.
- **POST `/api/clubs/:org/category`** — Fields: `name` (required), `description` (optional), `quantity` (string, required), `image` (optional File). `club_id` comes from URL param.
- **PATCH `/api/clubs/:org/category/:categoryId`** — Empty-string `description` is allowed; empty-string `name`/`quantity` is silently ignored.
- **DELETE `/api/clubs/:org/category/:categoryId`** — Must delete all `item` rows with `cat_id = categoryId` first (foreign key constraint).
- **GET `/api/clubs/:org/category/:categoryId/items`** — Search uses `ILIKE` across `name` OR `description`. Verifies category belongs to the club before returning.
- **POST `/api/clubs/:org/category/:categoryId/items`** — Fields: `name` (required), `condition` (required), `availability` (defaults to `'Available'`), `description` (optional), `image` (optional File).
- **GET `/api/clubs/:org/settings`** — Returns `{ name, role }` where role is the current user's role in the club.
- **POST `/api/clubs/:org/settings`** — Accepts `{ name?, roleChanges? }`. `roleChanges` is `[{ userId, role }]`. Cannot change Owner's role.
