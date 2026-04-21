import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONTEXT_FILE = path.join(__dirname, 'test-context.json');

export default async function globalTeardown() {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return;
  if (!fs.existsSync(CONTEXT_FILE)) return;

  const ctx = JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf-8'));
  const userIds: string[] = [ctx.adminUserId, ctx.memberUserId, ctx.otherUserId].filter(Boolean);

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find all clubs the test users belong to (catches any clubs created during tests)
  const { data: roles } = await svc
    .from('Role')
    .select('club_id')
    .in('UID', userIds);

  const clubIds = [...new Set((roles ?? []).map((r: { club_id: number }) => r.club_id))];

  if (clubIds.length > 0) {
    await svc.from('Role').delete().in('club_id', clubIds);
    await svc.from('Club').delete().in('club_id', clubIds);
  }

  // Delete the auth users (the handle_new_user trigger's inverse deletes the User rows too,
  // or they'll be cleaned up by the ON DELETE CASCADE / trigger if configured)
  for (const uid of userIds) {
    const { error } = await svc.auth.admin.deleteUser(uid);
    if (error) console.warn(`Could not delete user ${uid}: ${error.message}`);
  }

  try {
    fs.unlinkSync(CONTEXT_FILE);
  } catch {
    // File may have already been removed
  }

  console.log('\n✓ E2E teardown done\n');
}
