-- Single SECURITY DEFINER function for club creation.
--
-- Why: POST /api/tiles does two sequential writes:
--   1. INSERT into Club (with .select() → triggers SELECT USING on the new row)
--   2. UPSERT into Role  (triggers SELECT USING on the new row)
--
-- Both checks call is_club_member / is_club_admin which return FALSE for a
-- brand-new club that has no Role rows yet.  PostgreSQL raises
-- "new row violates row-level security policy (USING expression)" even though
-- the INSERT succeeded, because the inserted row is not yet visible through
-- the SELECT policy.
--
-- Running both writes inside a SECURITY DEFINER function bypasses RLS entirely,
-- which is safe here because the caller's identity has already been verified by
-- supabase.auth.getUser() before the RPC is called.

CREATE OR REPLACE FUNCTION public.create_club_with_admin(
  p_name text,
  p_uid  uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id numeric;
BEGIN
  -- Insert club, capture the generated club_id
  INSERT INTO public."Club" (name)
  VALUES (p_name)
  RETURNING club_id INTO v_club_id;

  -- Assign caller as Admin (idempotent on double-submit)
  INSERT INTO public."Role" (club_id, "UID", role)
  VALUES (v_club_id, p_uid, 'Admin')
  ON CONFLICT (club_id, "UID") DO UPDATE SET role = 'Admin';

  RETURN json_build_object('club_id', v_club_id, 'name', p_name);
END;
$$;
