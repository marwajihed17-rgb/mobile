import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './dashboard-client';
import type { Profile, SalamCustomer, MobilyCustomer } from '@/types/database';

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

  // Get recent customers from Salam project (last 5)
  const { data: salamCustomers } = await supabase
    .from('salam_customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get recent customers from Mobily project (last 5)
  const { data: mobilyCustomers } = await supabase
    .from('mobily_customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get total counts using database functions (bypasses RLS to show all users' data)
  const { data: salamTotalCountData } = await supabase.rpc('get_salam_total_count');
  const { data: mobilyTotalCountData } = await supabase.rpc('get_mobily_total_count');

  const salamCount = salamTotalCountData || 0;
  const mobilyCount = mobilyTotalCountData || 0;

  // Get daily counts using database functions
  const { data: salamDailyCountData } = await supabase.rpc('get_salam_daily_count');
  const { data: mobilyDailyCountData } = await supabase.rpc('get_mobily_daily_count');

  const salamDailyCount = salamDailyCountData || 0;
  const mobilyDailyCount = mobilyDailyCountData || 0;

  return (
    <DashboardClient
      profile={profile as Profile}
      recentSalamCustomers={(salamCustomers || []) as SalamCustomer[]}
      recentMobilyCustomers={(mobilyCustomers || []) as MobilyCustomer[]}
      stats={{
        salamCount,
        mobilyCount,
        salamDailyCount,
        mobilyDailyCount,
      }}
    />
  );
}
