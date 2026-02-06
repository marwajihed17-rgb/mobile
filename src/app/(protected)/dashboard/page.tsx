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

  // 3-stage workflow:
  // Stage 1: User submits → sets جاري التفعيل → visible to user + operator
  // Stage 2: Operator confirms → sets تم التفعيل (activated) → still visible to user + operator (checkmark)
  // Stage 3: User final confirms → status='confirmed' → removed from user + operator, only admin sees it
  //
  // Admin: only see 'confirmed' entries (final archived)
  // Operator: see 'activating' + 'activated' from all users
  // User: see own entries where status is NOT 'confirmed'
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

  if (isAdmin) {
    // Admins only see fully confirmed entries
    salamQuery = salamQuery.eq('activation_status', 'confirmed');
    mobilyQuery = mobilyQuery.eq('activation_status', 'confirmed');
  } else if (isOperator) {
    // Operators see entries with activating or activated status from all users
    salamQuery = salamQuery.in('activation_status', ['activating', 'activated']);
    mobilyQuery = mobilyQuery.in('activation_status', ['activating', 'activated']);
  } else {
    // Regular users see their own entries that are not yet fully confirmed
    salamQuery = salamQuery.eq('user_id', user.id);
    mobilyQuery = mobilyQuery.eq('user_id', user.id);

    // Filter out confirmed entries
    salamQuery = salamQuery.or('activation_status.is.null,activation_status.neq.confirmed');
    mobilyQuery = mobilyQuery.or('activation_status.is.null,activation_status.neq.confirmed');
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
