import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Transfers ownership of a club to a current Admin (Owner only).
// The target must already be an Admin of this club. The previous Owner is demoted to Admin and remains in the club.
// Body: `{ userId: <admin's UID> }`.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org } = await params;
  const clubId = Number(org);

  const { data: requesterRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!requesterRole || requesterRole.role !== 'Owner') {
    return NextResponse.json({ error: 'Only the Owner can transfer ownership' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const targetUserId = typeof body.userId === 'string' ? body.userId : '';

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'You are already the Owner' }, { status: 400 });
  }

  const { data: targetRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', targetUserId)
    .single();

  if (!targetRole) {
    return NextResponse.json({ error: 'Target user is not a member of this club' }, { status: 404 });
  }

  if (targetRole.role !== 'Admin') {
    return NextResponse.json({ error: 'Ownership can only be transferred to an Admin' }, { status: 400 });
  }

  const { error: promoteError } = await supabase
    .from('Role')
    .update({ role: 'Owner' })
    .eq('club_id', clubId)
    .eq('UID', targetUserId);

  if (promoteError) {
    return NextResponse.json({ error: `Failed to promote new owner: ${promoteError.message}` }, { status: 500 });
  }

  const { error: demoteError } = await supabase
    .from('Role')
    .update({ role: 'Admin' })
    .eq('club_id', clubId)
    .eq('UID', user.id);

  if (demoteError) {
    return NextResponse.json(
      { error: `Promoted new owner, but failed to demote previous owner: ${demoteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
