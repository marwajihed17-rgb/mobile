import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MobilyFormClient } from './mobily-form-client';
import type { Profile } from '@/types/database';

export default async function MobilyPage() {
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

  return <MobilyFormClient profile={profile as Profile} />;
}
