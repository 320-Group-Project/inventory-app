import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ org: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org } = await params;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() ?? '';

  type MemberRow = {
    role: string | null;
    UID: string | null;
    User: { fname: string | null; lname: string | null; email: string | null; user_image_url: string | null } | null;
  };

  const { data, error } = await supabase
    .from('Role')
    .select('role, UID, User(fname, lname, email, user_image_url)')
    .eq('club_id', parseInt(org)) as { data: MemberRow[] | null; error: { message: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const members = search ? (data ?? []).filter(({ User: u }) => {
        const full = `${u?.fname ?? ''} ${u?.lname ?? ''} ${u?.email ?? ''}`.toLowerCase();
        return full.includes(search);
      }) : (data ?? []);

  return NextResponse.json({ members });
}