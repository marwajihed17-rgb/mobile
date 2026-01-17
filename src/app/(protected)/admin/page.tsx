import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './admin-client';
import type { Profile, ModuleAccess, UserSettings } from '@/types/database';

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

  // Check if user is admin
  const isAdmin = currentProfile.role === 'admin' || currentProfile.role === 'super_admin';

  if (!isAdmin) {
    redirect('/dashboard');
  }

  // Get all users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Get all module access records
  const { data: allModuleAccess } = await supabase
    .from('module_access')
    .select('*');

  // Get all user settings
  const { data: allSettings } = await supabase
    .from('user_settings')
    .select('*');

  // Calculate stats
  const totalUsers = profiles?.length || 0;
  const activeUsers = profiles?.filter(p => p.status === 'active').length || 0;
  const adminCount = profiles?.filter(p => p.role === 'admin' || p.role === 'super_admin').length || 0;
  const disabledUsers = profiles?.filter(p => p.status !== 'active').length || 0;

  return (
    <AdminClient
      currentProfile={currentProfile as Profile}
      profiles={(profiles || []) as Profile[]}
      allModuleAccess={(allModuleAccess || []) as ModuleAccess[]}
      allSettings={(allSettings || []) as UserSettings[]}
      stats={{
        totalUsers,
        activeUsers,
        adminCount,
        disabledUsers,
      }}
    />
  );
}
