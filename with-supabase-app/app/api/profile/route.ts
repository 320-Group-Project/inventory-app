import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile
 * Returns the authenticated user's profile data from the User table + auth email.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('User')
    .select('fname, lname, user_image_url')
    .eq('UID', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    fname: data?.fname ?? '',
    lname: data?.lname ?? '',
    email: user.email ?? '',
    user_image_url: data?.user_image_url ?? null,
  });
}