'use client';

import { ChatBubble } from '@/components/ui/chat-bubble';

export function ChatBubbleWrapper() {
  return (
    <ChatBubble
      webhookUrl="/api/chat"
      title="المساعد الذكي"
      placeholder="اكتب رسالتك هنا..."
      welcomeMessage="مرحباً! كيف يمكنني مساعدتك اليوم؟"
    />
  );
}
