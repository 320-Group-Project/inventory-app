import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Deletes a club and all data associated with it (Owner only).
// Caller must include `{ confirmation: <club name> }` in the body, matching the current club name exactly.
// Cascade order: items -> item_category -> Role -> Club (to satisfy foreign keys).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org } = await params;
  const clubId = Number(org);

  const { data: roleData } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!roleData || roleData.role !== 'Owner') {
    return NextResponse.json({ error: 'Only the Owner can delete this club' }, { status: 403 });
  }

  const { data: club, error: clubFetchError } = await supabase
    .from('Club')
    .select('name')
    .eq('club_id', clubId)
    .single();

  if (clubFetchError || !club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const confirmation = typeof body.confirmation === 'string' ? body.confirmation : '';

  if (confirmation !== club.name) {
    return NextResponse.json(
      { error: 'Confirmation does not match the club name' },
      { status: 400 }
    );
  }

  const { data: categories, error: catFetchError } = await supabase
    .from('item_category')
    .select('item_cat_id')
    .eq('club_id', clubId);

  if (catFetchError) {
    return NextResponse.json({ error: catFetchError.message }, { status: 500 });
  }

  const catIds = (categories ?? []).map((c) => c.item_cat_id);

  if (catIds.length > 0) {
    const { error: itemsError } = await supabase
      .from('item')
      .delete()
      .in('cat_id', catIds);

    if (itemsError) {
      return NextResponse.json({ error: `Failed to delete items: ${itemsError.message}` }, { status: 500 });
    }

    const { error: catsError } = await supabase
      .from('item_category')
      .delete()
      .eq('club_id', clubId);

    if (catsError) {
      return NextResponse.json({ error: `Failed to delete categories: ${catsError.message}` }, { status: 500 });
    }
  }

  const { error: rolesError } = await supabase
    .from('Role')
    .delete()
    .eq('club_id', clubId);

  if (rolesError) {
    return NextResponse.json({ error: `Failed to delete members: ${rolesError.message}` }, { status: 500 });
  }

  const { error: clubError } = await supabase
    .from('Club')
    .delete()
    .eq('club_id', clubId);

  if (clubError) {
    return NextResponse.json({ error: `Failed to delete club: ${clubError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
