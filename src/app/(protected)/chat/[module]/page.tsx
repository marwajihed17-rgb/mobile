import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatClient } from './chat-client';
import { MODULE_INFO, type ModuleKey } from '@/lib/utils';
import type { Profile, ChatMessage } from '@/types/database';

interface ChatPageProps {
  params: {
    module: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = createClient();
  const moduleType = params.module as ModuleKey;

  // Validate module type
  if (!MODULE_INFO[moduleType]) {
    notFound();
  }

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

  // Check module access
  const { data: moduleAccess } = await supabase
    .from('module_access')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_type', moduleType)
    .single();

  if (!moduleAccess?.has_access) {
    redirect('/dashboard');
  }

  // Get chat messages
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_type', moduleType)
    .order('created_at', { ascending: true })
    .limit(100);

  return (
    <ChatClient
      profile={profile as Profile}
      moduleType={moduleType}
      moduleInfo={MODULE_INFO[moduleType]}
      initialMessages={(messages || []) as ChatMessage[]}
    />
  );
}
