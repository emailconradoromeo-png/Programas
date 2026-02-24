'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Property, Category } from '@/types/property';
import type { Listing, ListingSearchResult } from '@/types/listing';

interface ListingFilters {
  city?: string;
  operation_type?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  min_area?: number;
  max_area?: number;
  is_featured?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function useProperties(filters: ListingFilters = {}) {
  return useQuery<PaginatedResponse<Listing>>({
    queryKey: ['listings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const { data } = await api.get<PaginatedResponse<Listing>>(
        `/listings/?${params.toString()}`
      );
      return data;
    },
  });
}

export function useProperty(id: string | undefined) {
  return useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data } = await api.get<Listing>(`/listings/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/properties/categories/');
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useMyListings() {
  return useQuery<PaginatedResponse<Listing>>({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Listing>>('/listings/my/');
      return data;
    },
  });
}
