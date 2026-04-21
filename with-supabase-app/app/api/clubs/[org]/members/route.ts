import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/clubs/[org]/members
 * Returns all members (and their roles) for the club identified by `org` (club_id).
 *
 * NOTE: Avoids PostgREST Role→User join to prevent RLS recursion 500s.
 * Two separate queries are merged in JS instead.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const supabase = await createClient();
  const { org } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 1: get all Role rows for this club
  const { data: roles, error: roleError } = await supabase
    .from('Role')
    .select('role, UID')
    .eq('club_id', org);

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  if (!roles || roles.length === 0) {
    return NextResponse.json({ members: [] });
  }

  // Step 2: fetch User details for those UIDs
  const uids = roles.map((r) => r.UID).filter(Boolean);

  const { data: users, error: userError } = await supabase
    .from('User')
    .select('UID, fname, lname, email, user_image_url')
    .in('UID', uids);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Step 3: merge in JS
  const userMap = new Map((users ?? []).map((u) => [u.UID, u]));

  const members = roles.map((row) => {
    const u = userMap.get(row.UID);
    return {
      uid: row.UID,
      role: row.role ?? 'member',
      fname: u?.fname ?? '',
      lname: u?.lname ?? '',
      email: u?.email ?? '',
      user_image_url: u?.user_image_url ?? null,
    };
  });

  return NextResponse.json({ members });
}