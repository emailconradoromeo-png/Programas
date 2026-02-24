'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useSendMessage } from '@/hooks/useAI';
import type { ChatMessage } from '@/types/ai';

export default function ChatbotWidget() {
  const t = useTranslations('ai');
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMutation = useSendMessage();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Don't render if not authenticated
  if (!user) return null;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    sendMutation.mutate(
      { message: trimmed, sessionId },
      {
        onSuccess: (data) => {
          setSessionId(data.session_id);
          const assistantMsg: ChatMessage = {
            id: `resp-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: () => {
          const errorMsg: ChatMessage = {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: t('chat_error'),
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('chat_open')}
        >
          <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-white" />
              <h3 className="text-sm font-semibold text-white">{t('chat_title')}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded p-1 text-blue-200 hover:bg-blue-500 hover:text-white"
                title={t('chat_new')}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-blue-200 hover:bg-blue-500 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {t('chat_welcome')}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t('chat_welcome_hint')}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-br-md bg-blue-600 text-white'
                      : 'rounded-bl-md bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sendMutation.isPending && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat_placeholder')}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={sendMutation.isPending}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sendMutation.isPending}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
