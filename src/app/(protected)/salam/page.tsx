import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SalamFormClient } from './salam-form-client';
import type { Profile } from '@/types/database';

export default async function SalamPage() {
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

  return <SalamFormClient profile={profile as Profile} />;
}
