import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './dashboard-client';
import type { Profile, SalamEntry, MobilyEntry } from '@/types/database';

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

  // Redirect admin to admin dashboard
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    redirect('/admin');
  }

  // Get recent salam entries (last 10)
  const { data: salamEntries } = await supabase
    .from('salam_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recent mobily entries (last 10)
  const { data: mobilyEntries } = await supabase
    .from('mobily_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <DashboardClient
      profile={profile as Profile}
      recentSalamEntries={(salamEntries || []) as SalamEntry[]}
      recentMobilyEntries={(mobilyEntries || []) as MobilyEntry[]}
    />
  );
}
