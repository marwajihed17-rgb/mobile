import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './admin-client';
import type { Profile, SalamEntry, MobilyEntry } from '@/types/database';

export default async function AdminPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get current user's profile to check admin status
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!currentProfile) {
    redirect('/login');
  }

  const profileData = currentProfile as Profile;

  // Check if user is admin
  const isAdmin = profileData.role === 'admin' || profileData.role === 'super_admin';

  if (!isAdmin) {
    redirect('/dashboard');
  }

  // Get all profiles for user management
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Get all salam entries
  const { data: salamEntries } = await supabase
    .from('salam_entries')
    .select('*')
    .order('created_at', { ascending: false });

  // Get all mobily entries
  const { data: mobilyEntries } = await supabase
    .from('mobily_entries')
    .select('*')
    .order('created_at', { ascending: false });

  // Calculate stats
  const totalUsers = profiles?.length || 0;
  const profilesList = (profiles || []) as Profile[];
  const adminCount = profilesList.filter(p => p.role === 'admin' || p.role === 'super_admin').length || 0;
  const salamCount = salamEntries?.length || 0;
  const mobilyCount = mobilyEntries?.length || 0;

  return (
    <AdminClient
      currentProfile={profileData}
      profiles={profilesList}
      salamEntries={(salamEntries || []) as SalamEntry[]}
      mobilyEntries={(mobilyEntries || []) as MobilyEntry[]}
      stats={{
        totalUsers,
        adminCount,
        salamCount,
        mobilyCount,
      }}
    />
  );
}
