-- Fix infinite recursion in Role RLS policies.
--
-- The previous migration created Role SELECT policies that contained a subquery
-- against "Role" itself, which PostgreSQL detects as infinite recursion.
-- Same issue propagates to Club / item_category / item policies that check Role.
--
-- Fix: a SECURITY DEFINER helper function bypasses RLS when it queries "Role",
-- so all membership checks go through it instead of re-entering the policy.

-- ─── Helper: check club membership without triggering Role RLS ────────────────
CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id numeric)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."Role"
    WHERE club_id = p_club_id
      AND "UID"   = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id numeric)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."Role"
    WHERE club_id = p_club_id
      AND "UID"   = auth.uid()
      AND role    = 'Admin'
  );
$$;

-- ─── Role: drop old recursive policies, add clean ones ────────────────────────
DROP POLICY IF EXISTS "Members can view roles in their clubs"  ON public."Role";
DROP POLICY IF EXISTS "Admins can insert roles in their clubs" ON public."Role";
DROP POLICY IF EXISTS "Creator can insert own admin role"      ON public."Role";
DROP POLICY IF EXISTS "Admins can update roles in their clubs" ON public."Role";
DROP POLICY IF EXISTS "Admins can delete roles in their clubs" ON public."Role";
DROP POLICY IF EXISTS "Members can delete their own role"      ON public."Role";

-- Any club member may see all Role rows for that club (needed by members list).
CREATE POLICY "Members can view roles in their clubs"
  ON public."Role" FOR SELECT
  USING (
    "UID" = auth.uid()
    OR is_club_member(club_id)
  );

-- A user may insert their own role (used when creating a club as Admin).
CREATE POLICY "Creator can insert own admin role"
  ON public."Role" FOR INSERT
  WITH CHECK ("UID" = auth.uid());

-- An Admin may insert roles for other users (invite-accept flow).
CREATE POLICY "Admins can insert roles in their clubs"
  ON public."Role" FOR INSERT
  WITH CHECK (is_club_admin(club_id));

CREATE POLICY "Admins can update roles in their clubs"
  ON public."Role" FOR UPDATE
  USING (is_club_admin(club_id));

CREATE POLICY "Admins can delete roles in their clubs"
  ON public."Role" FOR DELETE
  USING (is_club_admin(club_id));

CREATE POLICY "Members can delete their own role"
  ON public."Role" FOR DELETE
  USING ("UID" = auth.uid());

-- ─── Club: swap subquery for helper ───────────────────────────────────────────
DROP POLICY IF EXISTS "Club members can view their club"    ON public."Club";
DROP POLICY IF EXISTS "Club admins can update their club"   ON public."Club";

CREATE POLICY "Club members can view their club"
  ON public."Club" FOR SELECT
  USING (is_club_member(club_id));

CREATE POLICY "Club admins can update their club"
  ON public."Club" FOR UPDATE
  USING (is_club_admin(club_id));

-- ─── item_category: swap subquery for helper ──────────────────────────────────
DROP POLICY IF EXISTS "Club members can view categories"  ON public."item_category";
DROP POLICY IF EXISTS "Club admins can manage categories" ON public."item_category";

CREATE POLICY "Club members can view categories"
  ON public."item_category" FOR SELECT
  USING (is_club_member(club_id));

CREATE POLICY "Club admins can manage categories"
  ON public."item_category" FOR ALL
  USING (is_club_admin(club_id));

-- ─── item: swap subquery for helper ───────────────────────────────────────────
DROP POLICY IF EXISTS "Club members can view items"  ON public."item";
DROP POLICY IF EXISTS "Club admins can manage items" ON public."item";

CREATE POLICY "Club members can view items"
  ON public."item" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."item_category" ic
      WHERE ic.item_cat_id = item.cat_id
        AND is_club_member(ic.club_id)
    )
  );

CREATE POLICY "Club admins can manage items"
  ON public."item" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."item_category" ic
      WHERE ic.item_cat_id = item.cat_id
        AND is_club_admin(ic.club_id)
    )
  );
