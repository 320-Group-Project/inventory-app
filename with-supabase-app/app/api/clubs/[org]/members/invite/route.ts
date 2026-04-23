import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { org } = await params;
  const clubId = Number(org);

  const { data: roleData } = await supabase
    .from('ROLE')
    .select('role')
    .eq('club_id', clubId)
    .eq('name_id', user.id)
    .single();

  if (!roleData || roleData.role !== 'Admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: club } = await supabase
    .from('CLUB')
    .select('name')
    .eq('club_id', clubId)
    .single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const { emails } = body;

  if (!emails) {
    return NextResponse.json({ error: "No emails provided" }, { status: 400 });
  }

  const emailList: string[] = emails
    .split(',')
    .map((e: string) => e.trim())
    .filter((e: string) => e.length > 0);

  if (emailList.length === 0) {
    return NextResponse.json({ error: "No valid emails provided" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const email of emailList) {
    await resend.emails.send({
      from: "Invites <invites@uinventory.xyz>",
      to: email,
      template: {
        id: 'club-invites',
        variables: {
          Club_Name: club.name,
          Inviter: user.email || 'Unknown User',
          Club_Link: `http://localhost:3000/api/clubs/${clubId}/members/invite/accept`
        }
      }
    });
  }

  return NextResponse.json({ success: true });
}
