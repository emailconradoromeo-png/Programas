'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Conversation, Message, Notification } from '@/types/message';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function useConversations() {
  return useQuery<PaginatedResponse<Conversation>>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Conversation>>('/messaging/conversations/');
      return data;
    },
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery<PaginatedResponse<Message>>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Message>>(
        `/messaging/conversations/${conversationId}/messages/`
      );
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 10000, // Poll every 10 seconds for new messages
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, { conversationId: string; content: string }>({
    mutationFn: async ({ conversationId, content }) => {
      const { data } = await api.post<Message>(
        `/messaging/conversations/${conversationId}/messages/`,
        { content }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useNotifications() {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Notification>>('/messaging/notifications/');
      return data;
    },
    refetchInterval: 30000, // Poll every 30 seconds for new notifications
  });
}
