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

  // Get recent customers from Salam project (last 5 for current user)
  const { data: salamCustomers } = await supabase
    .from('salam_customers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get recent customers from Mobily project (last 5 for current user)
  const { data: mobilyCustomers } = await supabase
    .from('mobily_customers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <DashboardClient
      profile={profile as Profile}
      recentSalamCustomers={(salamCustomers || []) as SalamCustomer[]}
      recentMobilyCustomers={(mobilyCustomers || []) as MobilyCustomer[]}
    />
  );
}
