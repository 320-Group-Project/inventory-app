import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/clubs/[org]/members/[userId]
 * Removes a member from the club. Only an Admin of the club may do this.
 *
 * PATCH /api/clubs/[org]/members/[userId]/role is handled in the /role sub-route.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ org: string; userId: string }> },
) {
  const supabase = await createClient();
  const { org, userId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check caller is an Admin of this club
  const { data: callerRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', org)
    .eq('UID', user.id)
    .single();

  if (!callerRole || callerRole.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden — Admins only' }, { status: 403 });
  }

  // Prevent removing yourself
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  }

  const { error } = await supabase
    .from('Role')
    .delete()
    .eq('club_id', org)
    .eq('UID', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
