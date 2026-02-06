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

  // Workflow: user submits → جاري التفعيل (activating) → تم التفعيل (activated) → admin sees it
  // - Admins: only see entries where activation_status is 'activated' (تم التفعيل)
  // - Non-admins (users/operators): see their own incomplete entries (not yet activated)
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';

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

  if (isAdmin) {
    // Admins only see completed entries (activation_status = 'activated')
    salamQuery = salamQuery.eq('activation_status', 'activated');
    mobilyQuery = mobilyQuery.eq('activation_status', 'activated');
  } else {
    // Non-admin users only see their own entries that are not yet fully activated
    salamQuery = salamQuery.eq('user_id', user.id);
    mobilyQuery = mobilyQuery.eq('user_id', user.id);

    // Filter out completed entries for non-admins
    // For Salam: show entries where operator_id is null OR activation_status is not 'activated'
    salamQuery = salamQuery.or('operator_id.is.null,activation_status.is.null,activation_status.neq.activated');

    // For Mobily: show entries where operator_id is null OR activation_status is not 'activated' OR price is null
    mobilyQuery = mobilyQuery.or('operator_id.is.null,activation_status.is.null,activation_status.neq.activated,price.is.null');
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
