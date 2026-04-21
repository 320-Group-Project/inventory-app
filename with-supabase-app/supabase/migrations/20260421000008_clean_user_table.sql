-- Remove dead columns from public."User".
--
-- email   → comes from auth.users; duplicating it here causes drift and is misleading
-- password → entirely managed by Supabase Auth; storing it here serves no purpose
--
-- The on_auth_user_created trigger is updated to stop inserting email as well.

ALTER TABLE public."User" DROP COLUMN IF EXISTS email;
ALTER TABLE public."User" DROP COLUMN IF EXISTS password;

-- Update the signup trigger so it no longer tries to insert the dropped email column.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" ("UID")
  VALUES (NEW.id)
  ON CONFLICT ("UID") DO NOTHING;
  RETURN NEW;
END;
$$;
