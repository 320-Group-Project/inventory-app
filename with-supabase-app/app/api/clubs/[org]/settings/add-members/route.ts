import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

/**
 * POST /api/clubs/[org]/settings/add-members
 * Sends invite emails to new members for an existing club.
 * Body: { members: "email1,email2,..." }
 * Requires the caller to be an Admin.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const supabase = await createClient();
  const { org } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Admins can invite
  const { data: callerRole } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', org)
    .eq('UID', user.id)
    .single();

  if (!callerRole || callerRole.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden — Admins only' }, { status: 403 });
  }

  // Fetch club name for the email
  const { data: club } = await supabase
    .from('Club')
    .select('name')
    .eq('club_id', org)
    .single();

  const clubName = club?.name ?? 'your club';

  const body = await request.json();
  const membersRaw: string = body.members ?? '';
  const emailList = membersRaw
    .split(',')
    .map((e: string) => e.trim())
    .filter((e: string) => e.length > 0);

  if (emailList.length === 0) {
    return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  for (const email of emailList) {
    await resend.emails.send({
      from: 'Invites <invites@uinventory.xyz>',
      to: email,
      template: {
        id: 'club-invites',
        variables: {
          Club_Name: clubName,
          Inviter: user.email ?? 'Unknown User',
          Club_Link: `${baseUrl}/api/clubs/${org}/members/invite/accept`,
        },
      },
    });
  }

  return NextResponse.json({ success: true, invited: emailList.length });
}