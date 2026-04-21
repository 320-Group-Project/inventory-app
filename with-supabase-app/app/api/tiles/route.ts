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
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the club
    const { data: newClub, error: clubError } = await supabase
        .from('Club')
        .insert({ name: body.title })
        .select('club_id, name')
        .single();

    if (clubError || !newClub) {
        return NextResponse.json(
            { error: clubError?.message ?? 'Failed to create club' },
            { status: 400 },
        );
    }

    // Assign the creator as Admin. Use upsert so a duplicate key (double-submit /
    // React StrictMode re-render) is silently ignored instead of throwing.
    const { error: roleError } = await supabase
        .from('Role')
        .upsert(
            { club_id: newClub.club_id, UID: user.id, role: 'Admin' },
            { onConflict: 'club_id,UID' },
        );

    if (roleError) {
        return NextResponse.json(
            { error: roleError.message ?? 'Failed to assign Admin role' },
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