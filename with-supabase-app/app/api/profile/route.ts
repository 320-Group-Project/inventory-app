import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("User")
    .select("UID, fname, lname, user_image_url")
    .eq("UID", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not fetch profile: " + error.message },
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
    .from("User")
    .insert(newProfile)
    .select("UID, fname, lname, user_image_url")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Could not create profile: " + insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: createdProfile });
}
