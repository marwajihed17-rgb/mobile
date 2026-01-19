import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './admin-client';
import type { Profile } from '@/types/database';

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

  // Get all salam customers with profiles data
  const { data: salamCustomers } = await supabase
    .from('salam_customers')
    .select('*, profiles(username, full_name, email)')
    .order('created_at', { ascending: false });

  // Get all mobily customers with profiles data
  const { data: mobilyCustomers } = await supabase
    .from('mobily_customers')
    .select('*, profiles(username, full_name, email)')
    .order('created_at', { ascending: false });

  // Calculate stats
  const profilesList = (profiles || []) as Profile[];
  const salamCount = salamCustomers?.length || 0;
  const mobilyCount = mobilyCustomers?.length || 0;

  // Get daily counts using database functions for better performance
  const { data: salamDailyCountData } = await supabase.rpc('get_salam_daily_count');
  const { data: mobilyDailyCountData } = await supabase.rpc('get_mobily_daily_count');

  const salamDailyCount = salamDailyCountData || 0;
  const mobilyDailyCount = mobilyDailyCountData || 0;

  return (
    <AdminClient
      currentProfile={profileData}
      profiles={profilesList}
      salamCustomers={(salamCustomers || []) as any[]}
      mobilyCustomers={(mobilyCustomers || []) as any[]}
      stats={{
        salamCount,
        mobilyCount,
        salamDailyCount,
        mobilyDailyCount,
      }}
    />
  );
}
