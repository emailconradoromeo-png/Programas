'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useSendMessage } from '@/hooks/useMessages';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function MessagesPage() {
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();
  const { user } = useAuth();

  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(undefined);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, isLoading: convsLoading } = useConversations();
  const { data: messagesData, isLoading: msgsLoading } = useMessages(selectedConversation);
  const sendMessage = useSendMessage();

  const conversations = conversationsData?.results || [];
  const messages = messagesData?.results || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessage.mutate(
      { conversationId: selectedConversation, content: messageInput.trim() },
      { onSuccess: () => setMessageInput('') }
    );
  };

  const getOtherParticipant = (participants: { id: string; username: string; first_name: string; last_name: string }[]) => {
    return participants.find((p) => p.id !== user?.id) || participants[0];
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays < 7) {
      return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'fr-FR', { weekday: 'short' });
    }
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const selectedConvData = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Conversations List */}
        <div className="w-80 flex-shrink-0">
          <Card padding="none" className="h-full flex flex-col">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">{t('inbox')}</h2>
            </div>

            {convsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">{t('no_messages')}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation.participants);
                  const isSelected = selectedConversation === conversation.id;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                          <UserCircleIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {otherUser?.first_name} {otherUser?.last_name}
                            </p>
                            {conversation.last_message && (
                              <span className="ml-2 flex-shrink-0 text-xs text-gray-400">
                                {formatTime(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="truncate text-xs text-gray-500">
                              {conversation.last_message?.content || (
                                locale === 'es' ? 'Sin mensajes' : 'Aucun message'
                              )}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="ml-2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          {conversation.listing && (
                            <p className="mt-0.5 truncate text-xs text-gray-400">
                              {conversation.listing.property.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Messages Panel */}
        <div className="flex-1">
          <Card padding="none" className="h-full flex flex-col">
            {!selectedConversation ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">
                  {locale === 'es'
                    ? 'Selecciona una conversacion para ver los mensajes'
                    : 'Selectionnez une conversation pour voir les messages'}
                </p>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                      <UserCircleIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      {selectedConvData && (() => {
                        const other = getOtherParticipant(selectedConvData.participants);
                        return (
                          <p className="text-sm font-medium text-gray-900">
                            {other?.first_name} {other?.last_name}
                          </p>
                        );
                      })()}
                      {selectedConvData?.listing && (
                        <p className="text-xs text-gray-500">
                          {selectedConvData.listing.property.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgsLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="md" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-sm text-gray-500">
                        {locale === 'es'
                          ? 'No hay mensajes todavia. Inicia la conversacion.'
                          : "Aucun message pour l'instant. Commencez la conversation."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isMine = message.sender.id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isMine
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p
                                className={`mt-1 text-xs ${
                                  isMine ? 'text-blue-200' : 'text-gray-400'
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={locale === 'es' ? 'Escribe un mensaje...' : 'Ecrivez un message...'}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sendMessage.isPending}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!messageInput.trim() || sendMessage.isPending}
                      loading={sendMessage.isPending}
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      <span className="sr-only">{t('send')}</span>
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
