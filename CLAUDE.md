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
| `item` | `item_id`, `cat_id`, `name`, `description`, `condition`, `availability`, `item_image_url` | `condition` is enum stored as `"1"\|"2"\|"3"` (Damaged=`"1"`, Fair=`"2"`, New=`"3"`). `availability` is `boolean` (true=Available, false=Checked Out). The API translates labels ↔ storage at the boundary so the frontend always uses human labels — see [Items: Label/Code Translation](#items-labelcode-translation). |

**Critical:** The `Role` table is both the membership list and the source of dashboard tiles. A user's tiles are all their `Role` rows. Deleting a `Role` row removes both club membership and the dashboard tile simultaneously — so the dashboard tile-remove button and the "leave club" button both call the same endpoint: `DELETE /api/clubs/:org/members/me`.

**Owner rules:**
- Whoever creates a club via `POST /api/tiles` is automatically inserted as the `'Owner'`. **This is done by the Postgres trigger `on_club_created` → `add_owner_on_club_create()`** (defined in `supabase/migrations/20260411004213_remote_schema.sql`). It runs `AFTER INSERT ON Club` and inserts a `Role` row for `auth.uid()` with `role = 'Owner'`. **Do not insert the Role row from the application** — you'll hit a `Role_pkey` duplicate-key error.
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
  condition USER-DEFINED,  -- enum "1"|"2"|"3": Damaged="1", Fair="2", New="3"
  availability boolean,    -- true = Available, false = Checked Out
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

### Items: Label/Code Translation

The DB stores `item.condition` as enum `"1"|"2"|"3"` and `item.availability` as boolean, but the frontend works in human labels (`"New"`, `"Fair"`, `"Damaged"`, `"Available"`, `"Checked Out"`). Translation happens at the API boundary, so client code never deals with the codes.

Both items routes (`items/route.ts` and `items/[itemId]/route.ts`) define two small constants at the top:
```ts
const CONDITION_LABEL: Record<string, string> = { '1': 'Damaged', '2': 'Fair', '3': 'New' };
const CONDITION_CODE:  Record<string, string> = { Damaged: '1', Fair: '2', New: '3' };
```

- **Forward (label → storage)** on POST and PATCH: `condition: CONDITION_CODE[condition]`, `availability: availability === 'Available'`.
- **Reverse (storage → label)** on GET: `condition: CONDITION_LABEL[row.condition]`, `availability: row.availability ? 'Available' : 'Checked Out'`.
- **`available_count`** in `GET /api/clubs/:org/category` compares `availability === true` (boolean) — not the string label.

If you ever change the DB representation, update both maps in both routes and the boolean comparison in the category route.

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
| DELETE | `/api/clubs/:org` | `app/api/clubs/[org]/route.ts` | ✅ Done — Owner only; cascade-deletes items → categories → roles → club. Body must include `{ confirmation: <club name> }` matching the current name. |
| POST | `/api/clubs/:org/transfer-ownership` | `app/api/clubs/[org]/transfer-ownership/route.ts` | ✅ Done — Owner only. Body `{ userId }`. Target must currently be Admin. Promotes target to Owner first, then demotes the previous Owner to Admin (the previous Owner stays in the club). Order is intentional: promote-then-demote leaves recoverable state (two Owners) if step 2 fails, vs. demote-first which would leave no Owner. |
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

## Frontend Conventions

**Suspense boundary required for client-page param reads.** Pages that read `useParams<{...}>()` from a client component (or that import a client component which does) must be wrapped in `<Suspense>` at the server-component level. Without it, Next 16 emits the "blocking-route" warning and delays render. The pattern is: `page.tsx` is a small server component that returns `<Suspense><ClientComponent/></Suspense>`; the interactive logic lives in a sibling client file. See `app/clubs/[org]/category/[categoryId]/item/new/page.tsx` (wraps `components/new-item-form.tsx`) and `app/clubs/[org]/category/[categoryId]/item/[itemId]/edit/page.tsx` (wraps `edit/edit-content.tsx`) for examples.

**Uncontrolled UI stubs.** `components/ItemNameInput.tsx`, `components/Counter.tsx`, `components/ui/DescriptionBox.tsx`, `components/ui/BigButton.tsx`, and `components/ui/annotatedImage.tsx` manage their own internal state (or take no value props) and aren't wired to any API. They were used by the original edit-page UI stubs. When wiring an edit page, **prefer building controlled inputs in-place** rather than refactoring these sub-components — the existing `components/new-item-form.tsx`, `components/new-category.tsx`, and `app/clubs/[org]/category/[categoryId]/item/[itemId]/edit/edit-content.tsx` are the working pattern.

**Radio onChange — read from the event target, not the closure.** Use `onChange={(e) => setX(e.target.value as ...)}` rather than `onChange={() => setX(value)}`. The closure form causes a visible "filled-dot disappears" flicker during DaisyUI's CSS transition for the `:checked` state.

**Post-action navigation should use `router.replace`, not `router.push`.** After Save / Cancel / Delete on edit pages, replace the current history entry instead of pushing a new one. Otherwise the back button from the destination page lands on the edit page you just left.

**Reset transient submission state before navigating.** Set `submitting` (or equivalent) back to `false` *before* calling `router.replace`. Next's Router Cache may snapshot the client component instance, and a `setSubmitting(false)` in a `finally` block can be skipped over by the in-progress unmount, leaving "Saving..." stuck on the cached page.

**Cancel in-flight async work in `useEffect` cleanup.** Async data loads in `useEffect` should use a `cancelled` flag so React 19 StrictMode's dev-mode double-fire (or any later effect re-run) can't have a late-arriving fetch overwrite state the user has since edited. Pattern:
```ts
useEffect(() => {
  let cancelled = false;
  async function load() { /* ... */ if (cancelled) return; setX(...); }
  load();
  return () => { cancelled = true; };
}, [deps]);
```

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
| `/clubs/[org]/category/[categoryId]/item/[itemId]/edit` | ✅ Wired | Server-component `page.tsx` wraps client `EditItemContent` (`edit-content.tsx`) in `<Suspense>`. Loads via `GET`, saves via `PATCH`, deletes via `DELETE`. Image-upload from this page is not yet wired (display-only). |
| `/clubs/[org]/category/[categoryId]/item/[itemId]` | ❌ Not wired | Placeholder only — full page needed |

---

## TODO

### High Priority
- **Wire edit category page** (`/clubs/[org]/category/[categoryId]/edit`) — fetch current category data on load, wire Save to `PATCH /api/clubs/:org/category/:categoryId`, wire Delete to `DELETE /api/clubs/:org/category/:categoryId`. Note: the UI uses generic components (`ItemNameInput`, `Counter`, `AnnotatedImage`, `BigButton`, `DescriptionBox`) that need state passed into them. The edit-item page (`item/[itemId]/edit/edit-content.tsx`) is the reference pattern — replace those stub components with controlled inputs in-place.
- **Image upload on edit-item page** — currently the edit page only displays the existing image. Adding a file picker that POSTs the new image via `PATCH` is the next step (the API already accepts an `image` field).

### Lower Priority
- **Item detail page** (`/clubs/[org]/category/[categoryId]/item/[itemId]`) — currently a placeholder div. The category page popup already covers this use case, so low urgency.
- **Leave club for Owner** — Owner cannot leave their own club directly. They can either delete the club entirely (Owner-only red button on settings, `DELETE /api/clubs/:org`) or transfer ownership to an existing Admin via the member dropdown's "Make Owner" option (`POST /api/clubs/:org/transfer-ownership`), which promotes the Admin and demotes the previous Owner to Admin (they remain in the club). To then leave entirely after transfer, the demoted ex-Owner uses the standard "leave club" flow.

## Route Implementation Notes

- **GET `/api/tiles`** — Queries `Role` joined with `Club` for the current user. Returns `{ tiles: [{ club_id, name, role }] }`.
- **GET `/api/clubs/:org/category`** — Returns categories with `available_count` and `total_count` computed from the `item` table in a second query (2 queries total, not N+1).
- **POST `/api/tiles`** — Creates a new `Club` row, inserts the creator as `'Owner'` in `Role`, optionally sends invite emails. No `DELETE` endpoint — tile removal goes through `DELETE /api/clubs/:org/members/me`.
- **POST `/api/clubs/:org/category`** — Fields: `name` (required), `description` (optional), `quantity` (string, required), `image` (optional File). `club_id` comes from URL param.
- **PATCH `/api/clubs/:org/category/:categoryId`** — Empty-string `description` is allowed; empty-string `name`/`quantity` is silently ignored.
- **DELETE `/api/clubs/:org/category/:categoryId`** — Must delete all `item` rows with `cat_id = categoryId` first (foreign key constraint).
- **GET `/api/clubs/:org/category/:categoryId/items`** — Search uses `ILIKE` across `name` OR `description`. Verifies category belongs to the club before returning. Returns `condition` and `availability` translated to human labels (see [Items: Label/Code Translation](#items-labelcode-translation)).
- **GET `/api/clubs/:org/category/:categoryId/items/:itemId`** — Same translation applied to the single-item response. Requires club membership.
- **POST `/api/clubs/:org/category/:categoryId/items`** — Fields: `name` (required), `condition` (`"New"|"Fair"|"Damaged"`, required), `availability` (`"Available"|"Checked Out"`, defaults to `"Available"`), `description` (optional), `image` (optional File). The handler maps the labels to the DB enum codes / boolean before insert.
- **PATCH `/api/clubs/:org/category/:categoryId/items/:itemId`** — Same field set; only provided fields are updated. Empty-string `description` is allowed (clears the field). Empty-string `name`/`condition`/`availability` are silently ignored. Same label→code/boolean translation as POST.
- **GET `/api/clubs/:org/settings`** — Returns `{ name, role }` where role is the current user's role in the club.
- **POST `/api/clubs/:org/settings`** — Accepts `{ name?, roleChanges? }`. `roleChanges` is `[{ userId, role }]`. Cannot change Owner's role.
