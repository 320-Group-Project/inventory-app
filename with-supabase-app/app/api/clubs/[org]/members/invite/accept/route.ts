import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', 'http://localhost:3000'));
  }

  const { org } = await params;
  const clubId = Number(org);

  const { data: existing } = await supabase
    .from('ROLE')
    .select('role')
    .eq('club_id', clubId)
    .eq('name_id', user.id)
    .single();

  if (!existing) {
    await supabase.from('ROLE').insert({
      club_id: clubId,
      name_id: user.id,
      role: 'Member',
    });
  }

  return NextResponse.redirect(new URL(`/clubs/${clubId}`, 'http://localhost:3000'));
}
