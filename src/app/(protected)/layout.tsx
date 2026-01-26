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

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      {children}
      <BrandFooter />
      <ChatBubbleWrapper />
    </div>
  );
}
