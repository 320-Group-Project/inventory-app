import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard
 * Returns the clubs (and the caller's role in each) for the authenticated user.
 *
 * NOTE: We intentionally avoid a PostgREST foreign-key join on Role→Club because
 * the Role table has self-referential RLS policies that cause a 500 when PostgREST
 * tries to resolve the join inline. Two separate queries + a JS merge is the fix.
 */
export async function GET() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 1: get all Role rows for this user
    const { data: roles, error: roleError } = await supabase
        .from('Role')
        .select('role, club_id')
        .eq('UID', user.id);

    if (roleError) {
        return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    if (!roles || roles.length === 0) {
        return NextResponse.json({ tiles: [] });
    }

    // Step 2: fetch the Club details for those club_ids
    const clubIds = roles.map((r) => r.club_id);

    const { data: clubs, error: clubError } = await supabase
        .from('Club')
        .select('club_id, name')
        .in('club_id', clubIds);

    if (clubError) {
        return NextResponse.json({ error: clubError.message }, { status: 500 });
    }

    // Step 3: merge in JS
    const clubMap = new Map((clubs ?? []).map((c) => [String(c.club_id), c.name]));

    const tiles = roles.map((row) => ({
        club_id: row.club_id,
        name: clubMap.get(String(row.club_id)) ?? String(row.club_id),
        role: row.role ?? 'member',
    }));

    return NextResponse.json({ tiles });
}