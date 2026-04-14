import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const fname = formData.get('fname') as string | null;
  const lname = formData.get('lname') as string | null;
  const pictureFile = formData.get('picture') as File | null;

  let pictureUrl = null;

  if (pictureFile && pictureFile.size > 0) {
    if (!ALLOWED_TYPES.includes(pictureFile.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
    }

    if (pictureFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }


    const fileName = `profile-${user.id}`;

    const { error: uploadError } = await supabase.storage
      .from('profile_pictures')
      .upload(fileName, pictureFile, { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: "Image upload failed: " + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(fileName);

    pictureUrl = publicUrl;
  }

  const updateData: { fname?: string; lname?: string; picture?: string } = {};
  if (fname !== null && fname !== '') updateData.fname = fname;
  if (lname !== null && lname !== '') updateData.lname = lname;
  if (pictureUrl) updateData.picture = pictureUrl;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: true, picture: null });
  }

  const { error: updateError } = await supabase
    .from('User')
    .update(updateData)
    .eq('User_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: "Database update failed: " + updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, picture: pictureUrl });
}
