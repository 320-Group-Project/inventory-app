import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

/**
 * POST /api/tiles
 * Creates a new club and assigns the caller as Admin via a single SECURITY DEFINER
 * RPC call, then optionally sends invite emails to the provided member list.
 * Body JSON: { title: string, members?: string }  (members = comma-separated emails)
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data: newClub, error: clubError } = await supabase
    .rpc('create_club_with_admin', { p_name: body.title, p_uid: user.id });

  if (clubError || !newClub) {
    return NextResponse.json(
      { error: clubError?.message ?? 'Failed to create club' },
      { status: 400 },
    );
  }

  // Send invite emails if members were provided
  if (body.members) {
    const emailList: string[] = (body.members as string)
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emailList.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      for (const email of emailList) {
        await resend.emails.send({
          from: 'Invites <invites@uinventory.xyz>',
          to: email,
          template: {
            id: 'club-invites',
            variables: {
              Club_Name: newClub.name,
              Inviter: user.email ?? 'Unknown User',
              Club_Link: `${baseUrl}/api/clubs/${newClub.club_id}/members/invite/accept`,
            },
          },
        });
      }
    }
  }

  return NextResponse.json({ success: true, club_id: newClub.club_id });
}
