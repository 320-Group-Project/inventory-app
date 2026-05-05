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
| `item_category` | `item_cat_id`, `club_id`, `name`, `description`, `quantity`, `item_cat_image_url` | |
| `item` | `item_id`, `cat_id`, `name`, `description`, `condition`, `availability`, `item_image_url` | `condition` enum: `"New"` `"Fair"` `"Damaged"`. `availability` enum: `"Available"` `"Checked Out"` (defaults to `"Available"` on insert) |

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
  availability USER-DEFINED,  -- enum: 'Available', 'Checked Out' (pending team addition)
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
| `profile_pictures` | User profile images (5 MB limit, jpeg/png/gif/webp) |
| `Item Pictures` | Item images |
| `Item Category Pictures` | Item category images |
| `User Profiles` | (unused — prefer `profile_pictures`) |

### Email Invites

Invites are sent via Resend (`resend` package) using the `'club-invites'` template id (with template variables `Club_Name`, `Inviter`, `Club_Link`). Two routes send invites:
- `POST /api/clubs/[org]/members/invite/route.ts` — for adding new members to an existing club.
- `POST /api/tiles/route.ts` — sends invites to the optional `members` list provided when creating a new club.

Both call `resend.emails.send({ from, to, template: { id: 'club-invites', variables: { ... } } })`. The email contains a link to `GET /api/clubs/:org/members/invite/accept`.

**Accept route flow:**
- If user is logged in → inserts a `Role` row → redirects to `/dashboard/:clubId`
- If user is NOT logged in → redirects to `/auth/login?redirectTo=/api/clubs/:clubId/members/invite/accept`. The frontend login form must read the `redirectTo` query param and use it as the post-login destination so the accept route runs again after authentication.

### Profile Routes

- `GET /api/profile` — returns `{ profile: { fname, lname, user_image_url } }` for the logged-in user. No `email` field — email is not stored on the `User` table.
- `PATCH /api/profile` — accepts `FormData` with optional `fname`, `lname`, `picture` (File). Uploads image to `profile_pictures` bucket if provided, then updates the `User` table.


### Route Params

All dynamic API routes receive params as a `Promise` and must be awaited:
```ts
const { org } = await params;
const clubId = Number(org);  // org is always a numeric club_id
```

## Route Implementation Status

All routes are fully implemented.

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
| GET | `/api/clubs/:org/members/invite/accept` | `app/api/clubs/[org]/members/invite/accept/route.ts` | ✅ Done (redirectTo fix applied) |
| PATCH | `/api/clubs/:org/members/:userId/role` | `app/api/clubs/[org]/members/[userId]/role/route.ts` | ✅ Done |
| DELETE | `/api/clubs/:org/members/:userId` | `app/api/clubs/[org]/members/[userId]/route.ts` | ✅ Done |
| GET | `/api/clubs/:org/members/me` | `app/api/clubs/[org]/members/me/route.ts` | ✅ Done — returns `{ role }` for current user |
| DELETE | `/api/clubs/:org/members/me` | `app/api/clubs/[org]/members/me/route.ts` | ✅ Done |
| POST | `/api/clubs/:org/settings` | `app/api/clubs/[org]/settings/route.ts` | ✅ Done |

### Categories
| Method | Path | File | Status |
|---|---|---|---|
| GET | `/api/clubs/:org/category?search=` | `app/api/clubs/[org]/category/route.ts` | ✅ Done |
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

## Frontend Wiring TODOs

### Not yet wired to real data
- All major pages are now wired. No known remaining stubs.

## Route Implementation Notes

- **POST `/api/tiles`** — Creates a new `Club` row, inserts the creator as `'Owner'` in the `Role` table, and (if a comma-separated `members` field is provided in the JSON body) sends invite emails via Resend. There is intentionally no `DELETE /api/tiles/:tileId` — tile removal goes through `DELETE /api/clubs/:org/members/me` so the Owner-leave guard applies.
- **GET `/api/clubs/:org/category`** — Returns `item_category` rows where `club_id = org`. Search uses Postgres `ILIKE` on `name` (case-insensitive substring).
- **POST `/api/clubs/:org/category`** — Creates a new `item_category` row. Fields: `name` (required), `description` (optional), `quantity` (string, required by schema), `image` (optional File). `club_id` comes from URL param.
- **PATCH `/api/clubs/:org/category/:categoryId`** — Updates `item_category` fields. Empty-string `description` is allowed (clears the field); empty-string `name`/`quantity` is silently ignored to prevent accidental blanking. Image upload goes to `Item Category Pictures` bucket.
- **DELETE `/api/clubs/:org/category/:categoryId`** — Must delete all `item` rows with `cat_id = categoryId` first, then delete the `item_category` row (foreign key constraint).
- **GET `/api/clubs/:org/category/:categoryId/items`** — Returns `item` rows where `cat_id = categoryId`. Search uses Postgres `ILIKE` across `name` OR `description` via Supabase `.or()`. Verifies the category belongs to the URL-supplied club before returning items.
- **POST `/api/clubs/:org/category/:categoryId/items`** — Creates a new `item` row. Fields: `name` (required), `description` (optional), `condition` (enum `"New"|"Fair"|"Damaged"`, required), `availability` (enum `"Available"|"Checked Out"`, defaults to `"Available"`), `image` (optional File).
- **GET `/api/clubs/:org/category/:categoryId/items/:itemId`** — Returns single `item` row by `item_id`. Requires club membership.
- **PATCH `/api/clubs/:org/category/:categoryId/items/:itemId`** — Updates `item` editable fields. Empty-string `description` is allowed (clears the field); empty-string `name`/`condition`/`availability` is silently ignored.
- **DELETE `/api/clubs/:org/category/:categoryId/items/:itemId`** — Deletes single `item` row by `item_id`. Verifies the category belongs to the URL-supplied club first.
