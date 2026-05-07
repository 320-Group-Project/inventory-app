import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DB stores condition as enum "1"|"2"|"3" and availability as boolean.
// Frontend uses human-readable labels, so translate at the API boundary.
const CONDITION_LABEL: Record<string, string> = { '1': 'Damaged', '2': 'Fair', '3': 'New' };
const CONDITION_CODE: Record<string, string> = { Damaged: '1', Fair: '2', New: '3' };

// Returns all items in a category, filtered by name or description search.
export async function GET(request: Request, { params }: { params: Promise<{ org: string; categoryId: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org, categoryId } = await params;
  const clubId = Number(org);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';

  const { data: catData } = await supabase
    .from('item_category')
    .select('item_cat_id')
    .eq('item_cat_id', Number(categoryId))
    .eq('club_id', clubId)
    .single();

  if (!catData) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  let query = supabase
    .from('item')
    .select('item_id, name, description, condition, availability, item_image_url')
    .eq('cat_id', Number(categoryId));

  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row) => ({
    ...row,
    condition: row.condition ? (CONDITION_LABEL[row.condition] ?? null) : null,
    availability: row.availability ? 'Available' : 'Checked Out',
  }));

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

  const conditionCode = CONDITION_CODE[condition];
  if (!conditionCode) {
    return NextResponse.json({ error: 'condition must be "New", "Fair", or "Damaged"' }, { status: 400 });
  }

  if (availability && !['Available', 'Checked Out'].includes(availability)) {
    return NextResponse.json({ error: 'availability must be "Available" or "Checked Out"' }, { status: 400 });
  }

  // DB column is boolean: true = Available, false = Checked Out. Default true.
  const availabilityBool = availability !== 'Checked Out';

  let item_image_url: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const fileName = `item-${categoryId}-${Date.now()}`;
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('Item Pictures')
      .upload(fileName, buffer, { contentType: imageFile.type });

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
    .insert({ name, description, condition: conditionCode, availability: availabilityBool, item_image_url, cat_id: Number(categoryId) })
    .select('item_id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, item_id: data.item_id });
}
