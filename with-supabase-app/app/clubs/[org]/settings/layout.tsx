import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Loader from '@/components/loader';

function SettingsFallback() {
  return <Loader />;
}

async function SettingsGuard({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  await connection();
  const { org } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: roleRow } = await supabase
    .from('Role')
    .select('role')
    .eq('club_id', org)
    .eq('UID', user.id)
    .single();

  if (!roleRow || roleRow.role !== 'Admin') {
    redirect(`/dashboard`);
  }

  return <>{children}</>;
}

export default function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsGuard params={params}>{children}</SettingsGuard>
    </Suspense>
  );
}
