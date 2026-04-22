import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/profile/save
 * Accepts multipart FormData: fname, lname, picture (file, optional).
 * Updates the User table and optionally uploads a new profile picture.
 */
export async function POST(request: Request) {
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

    // Upload picture if provided
    if (pictureFile && pictureFile.size > 0) {
        const fileName = `${user.id}/avatar`;

        const { error: uploadError } = await supabase.storage
            .from('profile_pictures')
            .upload(fileName, pictureFile, { upsert: true });

        if (uploadError) {
            return NextResponse.json(
                { error: 'Image upload failed: ' + uploadError.message },
                { status: 500 },
            );
        }

        const { data: { publicUrl } } = supabase.storage
            .from('profile_pictures')
            .getPublicUrl(fileName);

        user_image_url = publicUrl;
    }

    // Build update payload with correct column names
    const updateData: { fname?: string; lname?: string; user_image_url?: string } = {};
    if (fname) updateData.fname = fname;
    if (lname) updateData.lname = lname;
    if (user_image_url) updateData.user_image_url = user_image_url;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: true, message: 'Nothing to update' });
    }

    const { error: updateError } = await supabase
        .from('User')
        .update(updateData)
        .eq('UID', user.id);

    if (updateError) {
        return NextResponse.json(
            { error: 'Database update failed: ' + updateError.message },
            { status: 500 },
        );
    }

    return NextResponse.json({ success: true, user_image_url });
}
