'use client';

import { ChatBubble } from '@/components/ui/chat-bubble';

export function ChatBubbleWrapper() {
  return (
    <ChatBubble
      webhookUrl="https://n8n.srv987649.hstgr.cloud/webhook/RetaamCellular"
      title="المساعد الذكي"
      placeholder="اكتب رسالتك هنا..."
      welcomeMessage="مرحباً! كيف يمكنني مساعدتك اليوم؟"
    />
  );
}
