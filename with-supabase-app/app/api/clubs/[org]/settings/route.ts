import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns the club name (any member).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { org } = await params;
  const clubId = Number(org);

  const { data: membership } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: club, error } = await supabase
    .from('Club')
    .select('name')
    .eq('club_id', clubId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ name: club.name, role: membership.role });
}

// Updates the club name and/or bulk changes member roles (Admin or Owner only).
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

  if (!requesterRole || !['Admin', 'Owner'].includes(requesterRole.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, roleChanges } = await request.json() as {
    name?: string;
    roleChanges?: { userId: string; role: string }[];
  };

  if (name !== undefined) {
    const { error } = await supabase
      .from('Club')
      .update({ name })
      .eq('club_id', clubId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (roleChanges && roleChanges.length > 0) {
    for (const { userId, role } of roleChanges) {
      if (!['Admin', 'Member'].includes(role)) {
        return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
      }

      const { data: targetRole } = await supabase
        .from('Role')
        .select('role')
        .eq('club_id', clubId)
        .eq('UID', userId)
        .single();

      if (targetRole?.role === 'Owner') {
        return NextResponse.json({ error: "Cannot change the Owner's role" }, { status: 403 });
      }

      const { error } = await supabase
        .from('Role')
        .update({ role })
        .eq('club_id', clubId)
        .eq('UID', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
