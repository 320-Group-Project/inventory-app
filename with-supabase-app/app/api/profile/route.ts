import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns the current user's profile; auto-creates an empty User row on first load.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('User')
    .select('UID, fname, lname, user_image_url')
    .eq('UID', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'Could not fetch profile: ' + error.message },
      { status: 500 },
    );
  }

  if (profile) {
    return NextResponse.json({ profile });
  }

  const newProfile = {
    UID: user.id,
    fname: null,
    lname: null,
    user_image_url: null,
  };

  const { data: createdProfile, error: insertError } = await supabase
    .from('User')
    .insert(newProfile)
    .select('UID, fname, lname, user_image_url')
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: 'Could not create profile: ' + insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: createdProfile });
}

// Updates the current user's name and/or profile picture.
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const fname = formData.get('fname') as string | null;
  const lname = formData.get('lname') as string | null;
  const pictureFile = formData.get('picture') as File | null;

  let user_image_url: string | null = null;

  if (pictureFile && pictureFile.size > 0) {
    const fileName = `${user.id}/profile-${Date.now()}`;

    const buffer = Buffer.from(await pictureFile.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('profile_pictures')
      .upload(fileName, buffer, { contentType: pictureFile.type });

    if (uploadError) {
      return NextResponse.json({ error: 'Image upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(fileName);

    user_image_url = publicUrl;
  }

  const updateData: { fname?: string; lname?: string; user_image_url?: string } = {};
  if (fname) updateData.fname = fname;
  if (lname) updateData.lname = lname;
  if (user_image_url) updateData.user_image_url = user_image_url;

  const { error } = await supabase
    .from('User')
    .update(updateData)
    .eq('UID', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...(user_image_url ? { user_image_url } : {}) });
}
