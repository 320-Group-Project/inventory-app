-- Fix Role table so a club can have multiple members.
--
-- Problem: Role.club_id had a UNIQUE constraint (making it one-to-one with Club).
-- This caused "duplicate key value violates unique constraint Role_pkey" whenever
-- the upsert in POST /api/tiles tried to insert the admin role for a new club,
-- because the onConflict: 'club_id,UID' target had no matching DB constraint.
--
-- Fix:
--   1. Drop the single-column unique constraint on club_id.
--   2. Add a composite unique constraint on (club_id, UID) so the upsert works.
--   3. Ensure PK has an auto-increment default (SERIAL / IDENTITY).

DO $$
BEGIN
  -- 1. Drop unique constraint on club_id alone
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Role"'::regclass
      AND contype  = 'u'
      AND conname  = 'Role_club_id_key'
  ) THEN
    ALTER TABLE "Role" DROP CONSTRAINT "Role_club_id_key";
  END IF;

  -- 2. Add composite unique so upsert onConflict: 'club_id,UID' resolves correctly
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Role"'::regclass
      AND contype  = 'u'
      AND conname  = 'Role_club_id_UID_key'
  ) THEN
    ALTER TABLE "Role"
      ADD CONSTRAINT "Role_club_id_UID_key" UNIQUE (club_id, "UID");
  END IF;

  -- 3. Give PK a default sequence if it does not already have one
  IF (
    SELECT column_default IS NULL
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Role'
      AND column_name  = 'PK'
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS "Role_PK_seq";
    ALTER TABLE "Role" ALTER COLUMN "PK" SET DEFAULT nextval('"Role_PK_seq"');
    ALTER SEQUENCE "Role_PK_seq" OWNED BY "Role"."PK";
    PERFORM setval(
      '"Role_PK_seq"',
      COALESCE((SELECT MAX("PK") FROM "Role"), 0) + 1,
      false
    );
  END IF;
END $$;
