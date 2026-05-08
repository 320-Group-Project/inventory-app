import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns a single category by ID for club members.
export async function GET(_request: Request, { params }: { params: Promise<{ org: string; categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId } = await params;
  const clubId = Number(org);

  const { data: membership } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('item_category')
    .select('item_cat_id, name, description, quantity, item_cat_image_url')
    .eq('item_cat_id', Number(categoryId))
    .eq('club_id', clubId)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ category: data });
}

// Updates a category's name, description, quantity, or image (Admin or Owner only).
export async function PATCH(request: Request, { params }: { params: Promise<{ org: string; categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId } = await params;
  const clubId = Number(org);
  const catId = Number(categoryId);

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

  let item_cat_image_url: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const fileName = `category-${catId}-${Date.now()}`;

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

  const updateData: { name?: string; description?: string; quantity?: string; item_cat_image_url?: string } = {};
  if (name) updateData.name = name;
  if (description !== null) updateData.description = description;
  if (quantity) updateData.quantity = quantity;
  if (item_cat_image_url) updateData.item_cat_image_url = item_cat_image_url;

  const { error } = await supabase
    .from('item_category')
    .update(updateData)
    .eq('item_cat_id', catId)
    .eq('club_id', clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Deletes a category and all its items from the club (Admin or Owner only).
export async function DELETE(_request: Request, { params }: { params: Promise<{ org: string; categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId } = await params;
  const clubId = Number(org);
  const catId = Number(categoryId);

  const { data: roleData } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!roleData || !['Admin', 'Owner'].includes(roleData.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: itemsError } = await supabase
    .from('item')
    .delete()
    .eq('cat_id', catId);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const { error } = await supabase
    .from('item_category')
    .delete()
    .eq('item_cat_id', catId)
    .eq('club_id', clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
