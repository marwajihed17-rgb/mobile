import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AnimatedBackground } from '@/components/layout/background';
import { BrandFooter } from '@/components/layout/footer';
import { ChatBubbleWrapper } from '@/components/layout/chat-bubble-wrapper';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile to check if they are admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      {children}
      <BrandFooter />
      {/* Chat bubble is only visible to admin users */}
      {isAdmin && <ChatBubbleWrapper />}
    </div>
  );
}
