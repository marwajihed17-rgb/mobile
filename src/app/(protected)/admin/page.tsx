import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './admin-client';
import type { Profile, SalamCustomer, MobilyCustomer } from '@/types/database';

/**
 * Admin Dashboard Page
 *
 * This page fetches all customer data from the database and displays it in the admin dashboard.
 * It requires the user to have admin or super_admin role.
 *
 * Data fetched:
 * - All profiles (for user management)
 * - All salam_customers (with user info joined via profiles table)
 * - All mobily_customers (with user info joined via profiles table)
 * - Daily counts for both projects
 *
 * RLS (Row Level Security) ensures:
 * - Regular users can only see their own customer records
 * - Admins can see ALL customer records from all users
 */
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
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }

  // Get all salam customers with profiles data (including supervisor_name)
  const { data: salamCustomers, error: salamError } = await supabase
    .from('salam_customers')
    .select('*, profiles(username, full_name, email, supervisor_name)')
    .order('created_at', { ascending: false });

  if (salamError) {
    console.error('Error fetching salam customers:', salamError);
  }

  // Get all mobily customers with profiles data (including supervisor_name)
  const { data: mobilyCustomers, error: mobilyError } = await supabase
    .from('mobily_customers')
    .select('*, profiles(username, full_name, email, supervisor_name)')
    .order('created_at', { ascending: false });

  if (mobilyError) {
    console.error('Error fetching mobily customers:', mobilyError);
  }

  // Debug logging
  console.log('Admin Dashboard Data:', {
    profilesCount: profiles?.length || 0,
    salamCount: salamCustomers?.length || 0,
    mobilyCount: mobilyCustomers?.length || 0,
    currentUserRole: profileData.role,
  });

  // Calculate stats
  const profilesList = (profiles || []) as Profile[];
  const salamCount = salamCustomers?.length || 0;
  const mobilyCount = mobilyCustomers?.length || 0;

  // Get daily counts using database functions for better performance
  const { data: salamDailyCountData, error: salamDailyError } = await supabase.rpc('get_salam_daily_count');
  const { data: mobilyDailyCountData, error: mobilyDailyError } = await supabase.rpc('get_mobily_daily_count');

  if (salamDailyError) {
    console.error('Error fetching salam daily count:', salamDailyError);
  }
  if (mobilyDailyError) {
    console.error('Error fetching mobily daily count:', mobilyDailyError);
  }

  const salamDailyCount = salamDailyCountData || 0;
  const mobilyDailyCount = mobilyDailyCountData || 0;

  // Type assertion for customers with joined profiles
  type CustomerWithProfile = SalamCustomer & {
    profiles?: {
      username: string | null;
      full_name: string | null;
      email: string;
      supervisor_name: string | null;
    } | null;
  };

  type MobilyCustomerWithProfile = MobilyCustomer & {
    profiles?: {
      username: string | null;
      full_name: string | null;
      email: string;
      supervisor_name: string | null;
    } | null;
  };

  return (
    <AdminClient
      currentProfile={profileData}
      profiles={profilesList}
      salamCustomers={(salamCustomers || []) as CustomerWithProfile[]}
      mobilyCustomers={(mobilyCustomers || []) as MobilyCustomerWithProfile[]}
      stats={{
        salamCount,
        mobilyCount,
        salamDailyCount,
        mobilyDailyCount,
      }}
    />
  );
}
