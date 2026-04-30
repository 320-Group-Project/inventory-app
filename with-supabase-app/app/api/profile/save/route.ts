import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let fname = "";
  let lname = "";
  let pictureFile: File | null = null;

  try {
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      fname = formData.get("fname")?.toString() ?? "";
      lname = formData.get("lname")?.toString() ?? "";
      const picture = formData.get("picture");
      pictureFile = picture instanceof File ? picture : null;
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      fname = typeof body.fname === "string" ? body.fname : "";
      lname = typeof body.lname === "string" ? body.lname : "";
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }

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
  const updateData: {
    UID: string;
    fname?: string;
    lname?: string;
    user_image_url?: string;
  } = {
    UID: user.id
  };
  if (fname) updateData.fname = fname;
  if (lname) updateData.lname = lname;
  if (pictureUrl) updateData.user_image_url = pictureUrl;

  // 3. Update the User table based on your schema
  const { data: profile, error: updateError } = await supabase
    .from('User')
    .upsert(updateData, { onConflict: 'UID' })
    .select("UID, fname, lname, user_image_url")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Database update failed: " + updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile });
}
