import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: newClub, error: clubError } = await supabase.from('CLUB').insert({ name: body.title }).select('club_id, name').single();

  if (clubError) {
    return NextResponse.json({ error: clubError.message }, { status: 400 });
  }

  await supabase.from('ROLE').insert({ club_id: newClub.club_id, name_id: user.id, role: 'Admin' });

  if (body.members) {
    const emailList = body.members.split(',')
    .map((email: string) => email.trim())
    .filter((email: string) => email.length > 0);
    
    const resend = new Resend("re_Qw2YH26J_3HKkBZCLE34RG1hkQhygs7EC");
    
    for (const email of emailList) {
      await resend.emails.send({
        from: "Invites <invites@uinventory.xyz>",
        to: email,
        template: {
          id: 'club-invites',
          variables : {
            Club_Name : newClub.name,
            Inviter : user.email,
            Club_Link : `http://localhost:3000/api/clubs/${newClub.club_id}/members/invite/accept`
          }
        }
      })
    }
  }

  return NextResponse.json({ success: true, club_id: newClub.club_id });
}