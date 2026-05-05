import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// Sends club invite emails to a comma-separated list of addresses (Admin or Owner only).
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
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!roleData || !['Admin', 'Owner'].includes(roleData.role ?? '')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: club } = await supabase
    .from('Club')
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

  const nonUmass = emailList.filter((e) => !e.toLowerCase().endsWith("@umass.edu"));
  if (nonUmass.length > 0) {
    return NextResponse.json(
      { error: `Only @umass.edu addresses can be invited: ${nonUmass.join(", ")}` },
      { status: 400 }
    );
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
          Club_Link: `${new URL(request.url).origin}/api/clubs/${clubId}/members/invite/accept`
        }
      }
    });
  }

  return NextResponse.json({ success: true });
}
