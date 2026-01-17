import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './dashboard-client';
import type { Profile, ModuleAccess } from '@/types/database';

export default async function DashboardPage() {
  const supabase = createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get module access
  const { data: modules } = await supabase
    .from('module_access')
    .select('*')
    .eq('user_id', user.id);

  return (
    <DashboardClient
      profile={profile as Profile}
      modules={(modules || []) as ModuleAccess[]}
    />
  );
}
