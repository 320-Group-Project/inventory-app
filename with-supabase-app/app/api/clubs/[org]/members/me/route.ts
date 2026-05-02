import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Removes the current user from a club (leave club).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org } = await params;
  const clubId = Number(org);

  const { data: roleData } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (roleData?.role === 'Owner') {
    return NextResponse.json({ error: 'Club Owner cannot leave — transfer ownership first' }, { status: 403 });
  }

  const { error } = await supabase
    .from('Role')
    .delete()
    .eq('club_id', clubId)
    .eq('UID', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
