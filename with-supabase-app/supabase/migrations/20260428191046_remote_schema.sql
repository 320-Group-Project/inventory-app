create sequence "public"."Club_club_id_seq";

create sequence "public"."item_category_item_cat_id_seq";

drop policy "Owners can insert roles" on "public"."Role";

alter table "public"."Role" drop constraint "Role_club_id_key";

drop index if exists "public"."Role_club_id_key";

alter table "public"."Club" alter column "club_id" set default nextval('public."Club_club_id_seq"'::regclass);

alter table "public"."Role" alter column "UID" set not null;

alter table "public"."User" drop column "email";

alter table "public"."User" drop column "password";

alter table "public"."item_category" alter column "item_cat_id" set default nextval('public.item_category_item_cat_id_seq'::regclass);

alter sequence "public"."item_category_item_cat_id_seq" owned by "public"."item_category"."item_cat_id";

CREATE UNIQUE INDEX "Club_name_key" ON public."Club" USING btree (name);

CREATE UNIQUE INDEX "Role_pkey" ON public."Role" USING btree (club_id, "UID");

alter table "public"."Role" add constraint "Role_pkey" PRIMARY KEY using index "Role_pkey";

alter table "public"."Club" add constraint "Club_name_key" UNIQUE using index "Club_name_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_club_with_admin(p_name text, p_uid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public."User" ("UID")
  VALUES (NEW.id)
  ON CONFLICT ("UID") DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public."Role"
    WHERE club_id = p_club_id
      AND "UID"   = auth.uid()
      AND role    = 'Admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id numeric)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public."Role"
    WHERE club_id = p_club_id
      AND "UID"   = auth.uid()
      AND role    = 'Admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public."Role"
    WHERE club_id = p_club_id
      AND "UID"   = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id numeric)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public."Role"
    WHERE club_id = p_club_id
      AND "UID"   = auth.uid()
  );
$function$
;


  create policy "Authenticated users can create clubs"
  on "public"."Club"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Club admins can update their club"
  on "public"."Club"
  as permissive
  for update
  to public
using (public.is_club_admin(club_id));



  create policy "Club members can view their club"
  on "public"."Club"
  as permissive
  for select
  to public
using (public.is_club_member(club_id));



  create policy "Admins can delete roles in their clubs"
  on "public"."Role"
  as permissive
  for delete
  to public
using (public.is_club_admin(club_id));



  create policy "Admins can insert roles in their clubs"
  on "public"."Role"
  as permissive
  for insert
  to public
with check (public.is_club_admin(club_id));



  create policy "Admins can update roles in their clubs"
  on "public"."Role"
  as permissive
  for update
  to public
using (public.is_club_admin(club_id));



  create policy "Creator can insert own admin role"
  on "public"."Role"
  as permissive
  for insert
  to public
with check (("UID" = auth.uid()));



  create policy "Members can delete their own role"
  on "public"."Role"
  as permissive
  for delete
  to public
using (("UID" = auth.uid()));



  create policy "Members can view roles in their clubs"
  on "public"."Role"
  as permissive
  for select
  to public
using (public.is_club_member(club_id));



  create policy "Club members can view co-member profiles"
  on "public"."User"
  as permissive
  for select
  to public
using ((("UID" = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public."Role" r1
     JOIN public."Role" r2 ON ((r1.club_id = r2.club_id)))
  WHERE ((r1."UID" = auth.uid()) AND (r2."UID" = "User"."UID"))))));



  create policy "Service role can insert users"
  on "public"."User"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update their own profile"
  on "public"."User"
  as permissive
  for update
  to public
using ((auth.uid() = "UID"));



  create policy "Users can view their own profile"
  on "public"."User"
  as permissive
  for select
  to public
using ((auth.uid() = "UID"));



  create policy "Club admins can manage items"
  on "public"."item"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.item_category ic
  WHERE ((ic.item_cat_id = item.cat_id) AND public.is_club_admin(ic.club_id)))));



  create policy "Club members can view items"
  on "public"."item"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.item_category ic
  WHERE ((ic.item_cat_id = item.cat_id) AND public.is_club_member(ic.club_id)))));



  create policy "Club admins can manage categories"
  on "public"."item_category"
  as permissive
  for all
  to public
using (public.is_club_admin(club_id));



  create policy "Club members can view categories"
  on "public"."item_category"
  as permissive
  for select
  to public
using (public.is_club_member(club_id));



