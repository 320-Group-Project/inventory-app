import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


export async function DELETE(_request: Request, { params }: { params: Promise<{ tileId: string }> }) {
    const supabase = await createClient();
    const { tileId } = await params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {error: RoleError} = await supabase.from('ROLE').delete().match({ club_id: tileId, name_id: user.id})
    if (RoleError) {
        return NextResponse.json({ error: "Could not delete from Role" }, { status: 500 });
    }

    return NextResponse.json({ success: true});

}