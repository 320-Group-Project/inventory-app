import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns all categories for a club, filtered by name search.
export async function GET(request: Request, { params }: { params: Promise<{ org: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org } = await params;
  const clubId = Number(org);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';

  const { data: membership } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = supabase
    .from('item_category')
    .select('item_cat_id, name, description, quantity, item_cat_image_url')
    .eq('club_id', clubId);

  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}

// Creates a new item category for a club (Admin or Owner only).
export async function POST(request: Request, { params }: { params: Promise<{ org: string }> }) {
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

  if (!roleData || !['Admin', 'Owner'].includes(roleData.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const name = formData.get('name') as string | null;
  const description = formData.get('description') as string | null;
  const quantity = formData.get('quantity') as string | null;
  const imageFile = formData.get('image') as File | null;

  if (!name || !quantity) {
    return NextResponse.json({ error: 'name and quantity are required' }, { status: 400 });
  }

  let item_cat_image_url: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const fileName = `category-${clubId}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from('Item Category Pictures')
      .upload(fileName, imageFile);

    if (uploadError) {
      return NextResponse.json({ error: 'Image upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('Item Category Pictures')
      .getPublicUrl(fileName);

    item_cat_image_url = publicUrl;
  }

  const { data, error } = await supabase
    .from('item_category')
    .insert({ name, description, quantity, club_id: clubId, item_cat_image_url })
    .select('item_cat_id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, item_cat_id: data.item_cat_id });
}
