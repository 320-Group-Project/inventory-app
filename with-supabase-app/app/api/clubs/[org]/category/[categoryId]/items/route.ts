import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns all items in a category, filtered by name or description search.
export async function GET(request: Request, { params }: { params: Promise<{ org: string; categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { categoryId } = await params;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() ?? '';

  const { data, error } = await supabase
    .from('item')
    .select('item_id, name, description, condition, availability, item_image_url')
    .eq('cat_id', Number(categoryId));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = search
    ? (data ?? []).filter(i =>
        i.name?.toLowerCase().includes(search) ||
        i.description?.toLowerCase().includes(search)
      )
    : (data ?? []);

  return NextResponse.json({ items });
}

// Creates a new item in a category (Admin or Owner only).
export async function POST(request: Request, { params }: { params: Promise<{ org: string; categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId } = await params;
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
  const condition = formData.get('condition') as string | null;
  const availability = formData.get('availability') as string | null;
  const imageFile = formData.get('image') as File | null;

  if (!name || !condition) {
    return NextResponse.json({ error: 'name and condition are required' }, { status: 400 });
  }

  if (!['New', 'Fair', 'Damaged'].includes(condition)) {
    return NextResponse.json({ error: 'condition must be "New", "Fair", or "Damaged"' }, { status: 400 });
  }

  if (availability && !['Available', 'Checked Out'].includes(availability)) {
    return NextResponse.json({ error: 'availability must be "Available" or "Checked Out"' }, { status: 400 });
  }

  let item_image_url: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const fileName = `item-${categoryId}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from('Item Pictures')
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: 'Image upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('Item Pictures')
      .getPublicUrl(fileName);

    item_image_url = publicUrl;
  }

  const { data, error } = await supabase
    .from('item')
    .insert({ name, description, condition, availability: availability ?? 'Available', item_image_url, cat_id: Number(categoryId) })
    .select('item_id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, item_id: data.item_id });
}
