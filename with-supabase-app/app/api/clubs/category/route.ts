import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const name = formData.get('name') as string | null;
  const description = formData.get('description') as string | null;
  const quantity = formData.get('quantity') as string | null;
  const clubId = Number(formData.get('club_id'));
  const imageFile = formData.get('image') as File | null;

  if (!name || !clubId) {
    return NextResponse.json({ error: 'name and club_id are required' }, { status: 400 });
  }

  const { data: roleData } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', clubId)
    .eq('UID', user.id)
    .single();

  if (!roleData || roleData.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let item_cat_image_url: string | null = null;

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
