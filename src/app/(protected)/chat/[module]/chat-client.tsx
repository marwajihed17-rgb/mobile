'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Send, Paperclip, X, FileText, Loader2
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { uploadFile, saveFileRecord } from '@/lib/storage';
import { formatRelativeTime, type ModuleKey } from '@/lib/utils';
import type { Profile, ChatMessage } from '@/types/database';

interface ChatClientProps {
  profile: Profile;
  moduleType: ModuleKey;
  moduleInfo: {
    name: string;
    description: string;
    emoji: string;
    gradient: string;
  };
  initialMessages: ChatMessage[];
}

export function ChatClient({
  profile,
  moduleType,
  moduleInfo,
  initialMessages,
}: ChatClientProps) {
  const supabase = getSupabaseClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    setIsSending(true);
    const messageContent = inputValue.trim();
    setInputValue('');

    try {
      // Upload attachments if any
      const uploadedPaths: string[] = [];
      if (attachments.length > 0) {
        setIsUploading(true);
        for (const file of attachments) {
          const uploaded = await uploadFile(file, 'uploads', profile.id, moduleType);
          await saveFileRecord(profile.id, uploaded, moduleType);
          uploadedPaths.push(uploaded.path);
        }
        setAttachments([]);
        setIsUploading(false);
      }

      // Save user message
      const { data: userMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: profile.id,
          module_type: moduleType,
          content: messageContent,
          is_bot: false,
          attachments: uploadedPaths.length > 0 ? uploadedPaths : null,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, userMessage as ChatMessage]);

      // Simulate bot response
      setIsTyping(true);
      setTimeout(async () => {
        const botResponse = getBotResponse(messageContent, moduleType);

        const { data: botMessage } = await supabase
          .from('chat_messages')
          .insert({
            user_id: profile.id,
            module_type: moduleType,
            content: botResponse,
            is_bot: true,
            attachments: null,
          })
          .select()
          .single();

        setMessages(prev => [...prev, botMessage as ChatMessage]);
        setIsTyping(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const gradientClass = `gradient-${moduleType.replace('_', '-')}`;

  return (
    <div className="h-screen flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-20 px-6 py-4 bg-background-secondary/80 backdrop-blur-xl border-b border-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="secondary" size="icon" className="w-10 h-10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <div className={`w-10 h-10 rounded-lg ${gradientClass} flex items-center justify-center`}>
              <span className="text-lg">{moduleInfo.emoji}</span>
            </div>

            <div>
              <h1 className="font-semibold text-foreground">{moduleInfo.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Online
              </div>
            </div>
          </div>

          <Avatar
            name={profile.full_name || profile.email}
            imageUrl={profile.avatar_url}
            size="sm"
          />
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-20 h-20 rounded-2xl ${gradientClass} flex items-center justify-center mb-4`}>
              <span className="text-4xl">{moduleInfo.emoji}</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Welcome to {moduleInfo.name}
            </h2>
            <p className="text-muted max-w-sm">
              {moduleInfo.description}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              userName={profile.full_name || profile.email}
            />
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className={`w-8 h-8 rounded-full ${gradientClass} flex items-center justify-center flex-shrink-0`}>
              <span className="text-sm">{moduleInfo.emoji}</span>
            </div>
            <div className="bg-card border border-card-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
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
      <div className="p-4 bg-background-secondary/80 backdrop-blur-xl border-t border-card-border">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-3">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-card-border rounded-lg text-sm"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="p-0.5 hover:bg-error/10 rounded text-muted hover:text-error transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 p-2 bg-card-hover border border-card-border rounded-2xl focus-within:border-primary transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 min-h-[24px] max-h-[150px] px-2 py-2 bg-transparent text-foreground placeholder:text-muted resize-none focus:outline-none"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={isSending || (!inputValue.trim() && attachments.length === 0)}
            className="p-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg
              hover:scale-105 hover:shadow-primary transition-all
              disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  userName: string;
}

function MessageBubble({ message, userName }: MessageBubbleProps) {
  const isUser = !message.is_bot;

  return (
    <div className={`flex flex-col max-w-[70%] animate-slide-up ${isUser ? 'self-end' : 'self-start'}`}>
      <div
        className={`px-4 py-3 rounded-2xl whitespace-pre-wrap break-words
          ${isUser
            ? 'bg-gradient-to-r from-primary to-secondary text-white rounded-br-sm'
            : 'bg-card border border-card-border text-foreground-secondary rounded-bl-sm'
          }`}
      >
        {message.content}
      </div>
      <span
        className={`text-xs mt-1 px-2 ${isUser ? 'text-white/60 text-right' : 'text-muted'}`}
      >
        {formatRelativeTime(message.created_at)}
      </span>
    </div>
  );
}

// Simple bot response generator
function getBotResponse(message: string, moduleType: string): string {
  const responses: Record<string, string[]> = {
    invoice: [
      "I've received your invoice request. Let me process that for you.",
      "Your invoice has been successfully processed and recorded.",
      "I can help you with invoice management. What would you like to do?",
    ],
    kdr: [
      "I'm generating your KDR report now. This may take a moment.",
      "Your KDR analysis is complete. Here are the key findings.",
      "I can help you with KDR reporting. What data would you like to analyze?",
    ],
    ga: [
      "Processing your GA analytics request...",
      "Here's your analytics summary based on the latest data.",
      "I can provide insights on your GA metrics. What would you like to know?",
    ],
    kdr_inv: [
      "Processing your KDR invoice request...",
      "Your KDR invoice has been processed successfully.",
      "I can help with KDR invoice management. How can I assist?",
    ],
    kdr_sellout: [
      "Analyzing your sellout data...",
      "Here's your KDR sellout analysis summary.",
      "I can help with sellout processing. What data do you need?",
    ],
  };

  const moduleResponses = responses[moduleType] || responses.invoice;
  return moduleResponses[Math.floor(Math.random() * moduleResponses.length)];
}
