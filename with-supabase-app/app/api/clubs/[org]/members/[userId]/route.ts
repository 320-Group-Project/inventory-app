import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Removes a member from the club by deleting their Role row (Admin or Owner only).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ org: string; userId: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, userId } = await params;
  const clubId = Number(org);

  const { data: requesterRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!requesterRole || !['Admin', 'Owner'].includes(requesterRole.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself — use the leave club endpoint instead' }, { status: 400 });
  }

  const { data: targetRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', userId)
    .single();

  if (targetRole?.role === 'Owner') {
    return NextResponse.json({ error: 'Cannot remove the club Owner' }, { status: 403 });
  }

  const { error } = await supabase
    .from('Role')
    .delete()
    .eq('club_id', clubId)
    .eq('UID', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
