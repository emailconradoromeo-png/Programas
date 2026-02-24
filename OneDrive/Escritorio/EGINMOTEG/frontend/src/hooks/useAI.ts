'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  PropertyValuation,
  Recommendation,
  ChatResponse,
  ChatSessionSummary,
  ImageAnalysis,
} from '@/types/ai';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- Valuations ---

export function useValuation(propertyId: string | undefined) {
  return useQuery<PropertyValuation>({
    queryKey: ['valuation', propertyId],
    queryFn: async () => {
      const { data } = await api.get<PropertyValuation>(
        `/ai/valuations/${propertyId}/`
      );
      return data;
    },
    enabled: !!propertyId,
    retry: false,
  });
}

export function useRequestValuation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (propertyId: string) => {
      const { data } = await api.post('/ai/valuations/', {
        property_id: propertyId,
      });
      return data;
    },
    onSuccess: (_data, propertyId) => {
      // Invalidar la query de valoración para que se refresque
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['valuation', propertyId] });
      }, 3000);
    },
  });
}

// --- Recommendations ---

export function useRecommendations() {
  return useQuery<PaginatedResponse<Recommendation>>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Recommendation>>(
        '/ai/recommendations/'
      );
      return data;
    },
  });
}

// --- Chatbot ---

export function useChatSessions() {
  return useQuery<PaginatedResponse<ChatSessionSummary>>({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ChatSessionSummary>>(
        '/ai/chat/sessions/'
      );
      return data;
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation<ChatResponse, Error, { message: string; sessionId?: string }>({
    mutationFn: async ({ message, sessionId }) => {
      const payload: Record<string, string> = { message };
      if (sessionId) payload.session_id = sessionId;
      const { data } = await api.post<ChatResponse>('/ai/chat/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

// --- Image Analysis ---

export function useImageAnalysis(analysisId: string | undefined) {
  return useQuery<ImageAnalysis>({
    queryKey: ['image-analysis', analysisId],
    queryFn: async () => {
      const { data } = await api.get<ImageAnalysis>(
        `/ai/image-analysis/${analysisId}/`
      );
      return data;
    },
    enabled: !!analysisId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pendiente' || status === 'procesando') return 3000;
      return false;
    },
  });
}

export function useRequestImageAnalysis() {
  const queryClient = useQueryClient();
  return useMutation<ImageAnalysis, Error, number>({
    mutationFn: async (propertyImageId) => {
      const { data } = await api.post<ImageAnalysis>('/ai/image-analysis/', {
        property_image_id: propertyImageId,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['image-analysis', data.id],
      });
    },
  });
}
