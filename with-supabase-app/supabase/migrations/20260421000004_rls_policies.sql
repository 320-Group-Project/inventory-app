-- Enable Row Level Security on all tables and add appropriate policies.
-- Without RLS, any authenticated user can read/write all data.

-- ─── User ────────────────────────────────────────────────────────────────────
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile"   ON public."User";
DROP POLICY IF EXISTS "Users can update their own profile" ON public."User";
DROP POLICY IF EXISTS "Service role can insert users"      ON public."User";

CREATE POLICY "Users can view their own profile"
  ON public."User" FOR SELECT
  USING (auth.uid() = "UID");

CREATE POLICY "Users can update their own profile"
  ON public."User" FOR UPDATE
  USING (auth.uid() = "UID");

-- Allow the trigger function (SECURITY DEFINER) to insert on sign-up
CREATE POLICY "Service role can insert users"
  ON public."User" FOR INSERT
  WITH CHECK (true);

-- ─── Club ─────────────────────────────────────────────────────────────────────
ALTER TABLE public."Club" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club members can view their club"   ON public."Club";
DROP POLICY IF EXISTS "Club admins can update their club"  ON public."Club";
DROP POLICY IF EXISTS "Authenticated users can create clubs" ON public."Club";

CREATE POLICY "Club members can view their club"
  ON public."Club" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Role"
      WHERE "Role".club_id = "Club".club_id
        AND "Role"."UID" = auth.uid()
    )
  );

CREATE POLICY "Club admins can update their club"
  ON public."Club" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public."Role"
      WHERE "Role".club_id = "Club".club_id
        AND "Role"."UID" = auth.uid()
        AND "Role".role = 'Admin'
    )
  );

CREATE POLICY "Authenticated users can create clubs"
  ON public."Club" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─── Role ─────────────────────────────────────────────────────────────────────
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view roles in their clubs"  ON public."Role";
DROP POLICY IF EXISTS "Admins can insert roles in their clubs" ON public."Role";
DROP POLICY IF EXISTS "Creator can insert own admin role"      ON public."Role";
DROP POLICY IF EXISTS "Admins can update roles in their clubs" ON public."Role";
DROP POLICY IF EXISTS "Admins can delete roles in their clubs" ON public."Role";
DROP POLICY IF EXISTS "Members can delete their own role"      ON public."Role";

CREATE POLICY "Members can view roles in their clubs"
  ON public."Role" FOR SELECT
  USING (
    "UID" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public."Role" r2
      WHERE r2.club_id = "Role".club_id
        AND r2."UID" = auth.uid()
    )
  );

-- Allow a user to insert their own admin role when creating a club
CREATE POLICY "Creator can insert own admin role"
  ON public."Role" FOR INSERT
  WITH CHECK ("UID" = auth.uid());

-- Admins can insert roles for others (invite acceptance flow)
CREATE POLICY "Admins can insert roles in their clubs"
  ON public."Role" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Role" r2
      WHERE r2.club_id = "Role".club_id
        AND r2."UID" = auth.uid()
        AND r2.role = 'Admin'
    )
  );

CREATE POLICY "Admins can update roles in their clubs"
  ON public."Role" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public."Role" r2
      WHERE r2.club_id = "Role".club_id
        AND r2."UID" = auth.uid()
        AND r2.role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete roles in their clubs"
  ON public."Role" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public."Role" r2
      WHERE r2.club_id = "Role".club_id
        AND r2."UID" = auth.uid()
        AND r2.role = 'Admin'
    )
  );

CREATE POLICY "Members can delete their own role"
  ON public."Role" FOR DELETE
  USING ("UID" = auth.uid());

-- ─── item_category ────────────────────────────────────────────────────────────
ALTER TABLE public."item_category" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club members can view categories"  ON public."item_category";
DROP POLICY IF EXISTS "Club admins can manage categories" ON public."item_category";

CREATE POLICY "Club members can view categories"
  ON public."item_category" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Role"
      WHERE "Role".club_id = item_category.club_id
        AND "Role"."UID" = auth.uid()
    )
  );

CREATE POLICY "Club admins can manage categories"
  ON public."item_category" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."Role"
      WHERE "Role".club_id = item_category.club_id
        AND "Role"."UID" = auth.uid()
        AND "Role".role = 'Admin'
    )
  );

-- ─── item ─────────────────────────────────────────────────────────────────────
ALTER TABLE public."item" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club members can view items"  ON public."item";
DROP POLICY IF EXISTS "Club admins can manage items" ON public."item";

CREATE POLICY "Club members can view items"
  ON public."item" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."item_category" ic
      JOIN public."Role" r ON r.club_id = ic.club_id
      WHERE ic.item_cat_id = item.cat_id
        AND r."UID" = auth.uid()
    )
  );

CREATE POLICY "Club admins can manage items"
  ON public."item" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."item_category" ic
      JOIN public."Role" r ON r.club_id = ic.club_id
      WHERE ic.item_cat_id = item.cat_id
        AND r."UID" = auth.uid()
        AND r.role = 'Admin'
    )
  );
