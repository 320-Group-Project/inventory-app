import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// Returns all clubs the current user belongs to, with their role in each.
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('Role')
    .select('role, club_id, Club(name)')
    .eq('UID', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tiles = (data ?? []).map((row) => ({
    club_id: row.club_id,
    name: (row.Club as { name: string | null } | null)?.name ?? String(row.club_id),
    role: row.role as string,
  }));

  return NextResponse.json({ tiles });
}

// Creates a new club and assigns the current user as Owner, sending invite emails if provided.
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: newClub, error: clubError } = await supabase.from('Club')
    .insert({ name: body.title })
    .select('club_id, name')
    .single();

  if (clubError || !newClub) {
    return NextResponse.json({ error: clubError?.message || "Failed to create club" }, { status: 400 });
  }

  await supabase.from('Role').insert({ club_id: newClub.club_id, UID: user.id, role: 'Owner' });

  if (body.members) {
    const emailList = body.members.split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    const nonUmass = emailList.filter((e: string) => !e.toLowerCase().endsWith("@umass.edu"));
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
          variables : {
            Club_Name : newClub.name,
            Inviter : user.email || 'Unknown User', 
            Club_Link : `${new URL(request.url).origin}/api/clubs/${newClub.club_id}/members/invite/accept`
          }
        }
      });
    }
  }

  return NextResponse.json({ success: true, club_id: newClub.club_id });
}