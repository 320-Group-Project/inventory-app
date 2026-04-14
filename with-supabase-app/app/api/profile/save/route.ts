import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Verify user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse FormData
  const formData = await request.formData();
  const fname = formData.get('fname') as string;
  const lname = formData.get('lname') as string;
  const pictureFile = formData.get('picture') as File | null;

  let pictureUrl = null;

  // 1. Upload image to Supabase Storage (if a new file is provided)
  if (pictureFile && pictureFile.size > 0) {
    const fileName = `profile-${user.id}-${Date.now()}`;
    
    // NOTE: Replace 'profile_pictures' with your actual Supabase bucket name
    const { error: uploadError } = await supabase.storage
      .from('profile_pictures') 
      .upload(fileName, pictureFile, { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: "Image upload failed: " + uploadError.message }, { status: 500 });
    }
    
    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(fileName);
      
    pictureUrl = publicUrl;
  }

  // 2. Prepare data for the User table update
  const updateData: { fname?: string; lname?: string; picture?: string } = {};
  if (fname) updateData.fname = fname;
  if (lname) updateData.lname = lname;
  if (pictureUrl) updateData.picture = pictureUrl;

  // 3. Update the User table based on your schema
  const { error: updateError } = await supabase
    .from('User')
    .update(updateData)
    .eq('User_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: "Database update failed: " + updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, picture: pictureUrl });
}