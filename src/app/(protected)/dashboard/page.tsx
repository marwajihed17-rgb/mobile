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

  // Note: All users (including admins and operators) can access this dashboard
  // to view and use the المشغل dropdown

  // Admins and operators see all recent entries
  // Regular users see only their own entries
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
  const isOperator = profile.role === 'operator';

  let salamQuery = supabase
    .from('salam_customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  let mobilyQuery = supabase
    .from('mobily_customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (isOperator) {
    // Operators see only entries assigned to them
    salamQuery = salamQuery.eq('operator_id', user.id);
    mobilyQuery = mobilyQuery.eq('operator_id', user.id);
  } else if (!isAdmin) {
    // Regular users see only their own entries
    salamQuery = salamQuery.eq('user_id', user.id);
    mobilyQuery = mobilyQuery.eq('user_id', user.id);
  }

  const { data: salamCustomers } = await salamQuery;
  const { data: mobilyCustomers } = await mobilyQuery;

  return (
    <DashboardClient
      profile={profile as Profile}
      recentSalamCustomers={(salamCustomers || []) as SalamCustomer[]}
      recentMobilyCustomers={(mobilyCustomers || []) as MobilyCustomer[]}
    />
  );
}
