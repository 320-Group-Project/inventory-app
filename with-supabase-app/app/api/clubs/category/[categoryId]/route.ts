import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getAdminClubId(supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>, categoryId: number, userId: string) {
  const { data: category } = await supabase
    .from('item_category')
    .select('club_id')
    .eq('item_cat_id', categoryId)
    .single();

  if (!category) return null;

  const { data: role } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', category.club_id)
    .eq('UID', userId)
    .single();

  if (!role || role.role !== 'Admin') return null;

  return category.club_id;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { categoryId } = await params;
  const catId = Number(categoryId);

  const clubId = await getAdminClubId(supabase, catId, user.id);
  if (!clubId) {
    return NextResponse.json({ error: 'Forbidden or category not found' }, { status: 403 });
  }

  const formData = await request.formData();
  const name = formData.get('name') as string | null;
  const description = formData.get('description') as string | null;
  const quantity = formData.get('quantity') as string | null;
  const imageFile = formData.get('image') as File | null;

  let item_cat_image_url: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const fileName = `category-${clubId}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from('category-images')
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: 'Image upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('category-images')
      .getPublicUrl(fileName);

    item_cat_image_url = publicUrl;
  }

  const updateData: { name?: string; description?: string; quantity?: string; item_cat_image_url?: string } = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (quantity) updateData.quantity = quantity;
  if (item_cat_image_url) updateData.item_cat_image_url = item_cat_image_url;

  const { error } = await supabase
    .from('item_category')
    .update(updateData)
    .eq('item_cat_id', catId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { categoryId } = await params;
  const catId = Number(categoryId);

  const clubId = await getAdminClubId(supabase, catId, user.id);
  if (!clubId) {
    return NextResponse.json({ error: 'Forbidden or category not found' }, { status: 403 });
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
    .eq('item_cat_id', catId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
