import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/clubs/[org]/settings
 * Returns the club's name. Requires the caller to be a member.
 *
 * PATCH /api/clubs/[org]/settings
 * Updates the club's name. Requires the caller to be an Admin.
 * Body: { name: string }
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

  // Verify the caller is a member of this club (also enforces RLS on Role)
  const { data: callerRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', org)
    .eq('UID', user.id)
    .single();

  if (!callerRole) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('Club')
    .select('club_id, name')
    .eq('club_id', org)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Club not found' }, { status: 404 });
  }

  return NextResponse.json({ club_id: data.club_id, name: data.name });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const supabase = await createClient();
  const { org } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Admins can rename the club
  const { data: callerRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', org)
    .eq('UID', user.id)
    .single();

  if (!callerRole || callerRole.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden — Admins only' }, { status: 403 });
  }

  const body = await request.json();
  const name: string = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('Club')
    .update({ name })
    .eq('club_id', org);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}