'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatBubbleProps {
  webhookUrl?: string;
  placeholder?: string;
  title?: string;
  welcomeMessage?: string;
}

export function ChatBubble({
  webhookUrl = '/api/chat',
  placeholder = 'اكتب رسالتك هنا...',
  title = 'المساعد الذكي',
  welcomeMessage = 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
}: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: welcomeMessage,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    }
  }, [welcomeMessage, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const sendMessage = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      content: trimmedMessage,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateId(),
        content: data.response || data.message || 'تم استلام رسالتك',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateId(),
        content: 'عذراً، حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    // Use Western digits (0-9) for timestamps
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-24 left-4 z-50 w-[360px] max-w-[calc(100vw-2rem)]',
          'bg-card/95 backdrop-blur-xl border border-card-border rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
        style={{ height: '500px', maxHeight: 'calc(100vh - 160px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{title}</h3>
              <p className="text-xs text-white/80">متصل الآن</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="إغلاق المحادثة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col gap-1',
                message.role === 'user' ? 'items-start' : 'items-end'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-secondary text-white rounded-tl-sm'
                    : 'bg-card-hover border border-card-border text-foreground rounded-tr-sm'
                )}
              >
                {message.content}
              </div>
              <span className="text-[10px] text-muted px-2">
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-end gap-1">
              <div className="bg-card-hover border border-card-border px-4 py-3 rounded-2xl rounded-tr-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-card-border bg-card/50">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm',
                'bg-card-hover border border-card-border rounded-xl',
                'text-foreground placeholder:text-muted',
                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'text-start'
              )}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-gradient-to-r from-primary to-secondary text-white',
                'hover:opacity-90 transition-opacity',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="إرسال الرسالة"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 rotate-180" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 left-4 z-50',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-r from-primary to-secondary text-white',
          'shadow-primary-lg hover:shadow-primary-xl',
          'flex items-center justify-center',
          'transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          isOpen && 'rotate-90'
        )}
        aria-label={isOpen ? 'إغلاق المحادثة' : 'فتح المحادثة'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Notification Badge (when closed and has unread) */}
      {!isOpen && messages.length > 1 && (
        <div className="fixed bottom-16 left-4 z-50 pointer-events-none">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>
      )}
    </>
  );
}
