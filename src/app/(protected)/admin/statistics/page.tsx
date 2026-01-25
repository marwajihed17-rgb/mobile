import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatisticsClient } from './statistics-client';
import type { Profile } from '@/types/database';

/**
 * Statistics Page
 *
 * This page displays summary statistics tables for supervisors and users.
 * It requires the user to have admin or super_admin role.
 *
 * Tables displayed:
 * - Supervisor Daily Summary (ملخص المشرف اليومي)
 * - Users Daily Summary (ملخص المستخدمين اليومي)
 */
export default async function StatisticsPage() {
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

  // Get all profiles for supervisor and user data
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Get Salam customers with user info
  const { data: salamCustomers } = await supabase
    .from('salam_customers')
    .select('*, profiles(username, full_name, supervisor_name)')
    .order('created_at', { ascending: false });

  // Get Mobily customers with user info
  const { data: mobilyCustomers } = await supabase
    .from('mobily_customers')
    .select('*, profiles(username, full_name, supervisor_name)')
    .order('created_at', { ascending: false });

  return (
    <StatisticsClient
      currentProfile={profileData}
      profiles={profiles || []}
      salamCustomers={salamCustomers || []}
      mobilyCustomers={mobilyCustomers || []}
    />
  );
}
