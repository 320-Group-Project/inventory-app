import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns a single item by ID with all its fields.
export async function GET(_request: Request, { params }: { params: Promise<{ org: string; categoryId: string; itemId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId, itemId } = await params;
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
    .from('item')
    .select('item_id, name, description, condition, availability, item_image_url, cat_id')
    .eq('item_id', Number(itemId))
    .eq('cat_id', Number(categoryId))
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ item: data });
}

// Deletes a single item by ID (Admin or Owner only).
export async function DELETE(_request: Request, { params }: { params: Promise<{ org: string; categoryId: string; itemId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId, itemId } = await params;
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

  const { data: catCheck } = await supabase
    .from('item_category')
    .select('item_cat_id')
    .eq('item_cat_id', Number(categoryId))
    .eq('club_id', clubId)
    .single();

  if (!catCheck) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('item')
    .delete()
    .eq('item_id', Number(itemId))
    .eq('cat_id', Number(categoryId));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Updates an item's editable fields; only provided fields are changed, the rest remain as-is (Admin or Owner only).
export async function PATCH(request: Request, { params }: { params: Promise<{ org: string; categoryId: string; itemId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId, itemId } = await params;
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

  const { data: catCheck } = await supabase
    .from('item_category')
    .select('item_cat_id')
    .eq('item_cat_id', Number(categoryId))
    .eq('club_id', clubId)
    .single();

  if (!catCheck) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const name = formData.get('name') as string | null;
  const description = formData.get('description') as string | null;
  const condition = formData.get('condition') as string | null;
  const availability = formData.get('availability') as string | null;
  const imageFile = formData.get('image') as File | null;

  if (condition && !['New', 'Fair', 'Damaged'].includes(condition)) {
    return NextResponse.json({ error: 'condition must be "New", "Fair", or "Damaged"' }, { status: 400 });
  }

  if (availability && !['Available', 'Checked Out'].includes(availability)) {
    return NextResponse.json({ error: 'availability must be "Available" or "Checked Out"' }, { status: 400 });
  }

  const updateData: { name?: string; description?: string; condition?: string; availability?: string; item_image_url?: string } = {};
  if (name) updateData.name = name;
  if (description !== null) updateData.description = description;
  if (condition) updateData.condition = condition;
  if (availability) updateData.availability = availability;

  if (imageFile && imageFile.size > 0) {
    const fileName = `item-${itemId}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from('Item Pictures')
      .upload(fileName, imageFile);

    if (uploadError) {
      return NextResponse.json({ error: 'Image upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('Item Pictures')
      .getPublicUrl(fileName);

    updateData.item_image_url = publicUrl;
  }

  const { error } = await supabase
    .from('item')
    .update(updateData)
    .eq('item_id', Number(itemId))
    .eq('cat_id', Number(categoryId));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
