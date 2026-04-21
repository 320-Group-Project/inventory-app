-- Remove the broken PK column from Role and replace with a composite primary key.
--
-- Root cause: PK smallint had DEFAULT '3' (hardcoded, not a sequence), so every
-- INSERT without an explicit PK received the value 3, causing an immediate
-- "duplicate key value violates unique constraint Role_pkey" on the second club.
--
-- Correct design: Role is a join table. (club_id, UID) is the natural PK —
-- a user has exactly one role per club.

-- 1. Delete any orphan rows where UID is NULL (can't be part of a PK)
DELETE FROM public."Role" WHERE "UID" IS NULL;

-- 2. Drop the old surrogate PK and its broken sequence (if we created one)
ALTER TABLE public."Role" DROP CONSTRAINT "Role_pkey";
ALTER TABLE public."Role" DROP COLUMN "PK";
DROP SEQUENCE IF EXISTS "Role_PK_seq";

-- 3. Drop the unique constraint we added earlier (superseded by the new PK)
ALTER TABLE public."Role" DROP CONSTRAINT IF EXISTS "Role_club_id_UID_key";

-- 4. Make UID NOT NULL — it is now part of the primary key
ALTER TABLE public."Role" ALTER COLUMN "UID" SET NOT NULL;

-- 5. Add composite primary key
ALTER TABLE public."Role" ADD CONSTRAINT "Role_pkey" PRIMARY KEY (club_id, "UID");
