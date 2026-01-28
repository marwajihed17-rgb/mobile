import { getSupabaseClient } from './supabase/client';
import type { Profile, UserSettings, UserRole } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOperator: boolean;
}

export interface UserWithSettings {
  profile: Profile;
  settings: UserSettings | null;
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
    username: profile.username,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
    isOperator: profile.role === 'operator',
  };
}

// Get user with all related data
export async function getUserWithSettings(userId: string): Promise<UserWithSettings | null> {
  const supabase = getSupabaseClient();

  const [profileRes, settingsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('user_settings').select('*').eq('user_id', userId).single(),
  ]);

  if (profileRes.error || !profileRes.data) {
    return null;
  }

  return {
    profile: profileRes.data,
    settings: settingsRes.data,
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

// Sign in with username (converts to username@retaam.app internally)
export async function signInWithEmailOrUsername(username: string, password: string) {
  const supabase = getSupabaseClient();

  // Convert username to internal email format
  // All users have auto-generated emails as username@retaam.app
  const email = `${username.toLowerCase().trim()}@retaam.app`;

  // Sign in with the generated email
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error('بيانات الدخول غير صحيحة');
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

// Reset password request by email
export async function requestPasswordReset(email: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// Reset password request by username (converts to username@retaam.app internally)
export async function requestPasswordResetByUsername(username: string) {
  const supabase = getSupabaseClient();

  // Convert username to internal email format
  const email = `${username.toLowerCase().trim()}@retaam.app`;

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
