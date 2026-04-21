-- Automatically create a row in public."User" when a new Supabase auth user signs up.
-- Without this trigger, GET /api/profile returns a 500 (no row found) for any new user.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" ("UID", email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT ("UID") DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
