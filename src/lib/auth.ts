import { getSupabaseClient } from './supabase/client';
import type { Profile, UserSettings, ModuleAccess, UserRole } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface UserWithAccess {
  profile: Profile;
  settings: UserSettings | null;
  modules: ModuleAccess[];
}

// Get current authenticated user with profile
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
  };
}

// Get user with all related data
export async function getUserWithAccess(userId: string): Promise<UserWithAccess | null> {
  const supabase = getSupabaseClient();

  const [profileRes, settingsRes, modulesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('user_settings').select('*').eq('user_id', userId).single(),
    supabase.from('module_access').select('*').eq('user_id', userId),
  ]);

  if (profileRes.error || !profileRes.data) {
    return null;
  }

  return {
    profile: profileRes.data,
    settings: settingsRes.data,
    modules: modulesRes.data || [],
  };
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Sign up with email and password
export async function signUp(email: string, password: string, fullName?: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Sign out
export async function signOut() {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

// Reset password request
export async function requestPasswordReset(email: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// Update profile
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Check if user has access to a module
export async function checkModuleAccess(userId: string, moduleType: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('module_access')
    .select('has_access')
    .eq('user_id', userId)
    .eq('module_type', moduleType)
    .single();

  if (error || !data) {
    return false;
  }

  return data.has_access;
}
