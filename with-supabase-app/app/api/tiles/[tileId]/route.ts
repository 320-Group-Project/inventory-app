import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/tiles/[tileId]
 * Removes the calling user's membership (Role row) from the club identified by tileId.
 * Used when a non-admin member clicks "Leave club".
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tileId: string }> },
) {
  const supabase = await createClient();
  const { tileId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('Role')
    .delete()
    .eq('club_id', tileId)
    .eq('UID', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}