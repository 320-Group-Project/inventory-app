import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Accepts a club invite by adding the user as a Member; redirects to login if unauthenticated.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const supabase = await createClient();
  const { org } = await params;
  const clubId = Number(org);
  const { origin } = new URL(request.url);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const acceptPath = `/api/clubs/${clubId}/members/invite/accept`;
    return NextResponse.redirect(
      new URL(`/auth/login?redirectTo=${encodeURIComponent(acceptPath)}`, origin)
    );
  }

  const { data: existing } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!existing) {
    const { error: insertError } = await supabase.from('Role').insert({
      club_id: clubId,
      UID: user.id,
      role: 'Member',
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.redirect(new URL(`/dashboard/${clubId}`, origin));
}
