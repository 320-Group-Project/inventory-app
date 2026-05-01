import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ org: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { org } = await params;
  const clubId = Number(org);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() ?? '';

  const { data, error } = await supabase
    .from('item_category')
    .select('item_cat_id, name, description, quantity, item_cat_image_url')
    .eq('club_id', clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories = search
    ? (data ?? []).filter(c => c.name?.toLowerCase().includes(search))
    : (data ?? []);

  return NextResponse.json({ categories });
}
