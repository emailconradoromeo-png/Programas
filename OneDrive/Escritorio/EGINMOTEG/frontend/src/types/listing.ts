import type { Property } from './property';

export interface Listing {
  id: string;
  property: Property;
  posted_by: { id: string; username: string };
  operation_type: 'venta' | 'alquiler' | 'alquiler_vacacional';
  price: number;
  currency: 'XAF' | 'EUR' | 'USD';
  price_xaf: number;
  price_negotiable: boolean;
  deposit_amount: number | null;
  deposit_currency: string | null;
  status: 'activo' | 'pausado' | 'vendido' | 'alquilado' | 'expirado';
  is_featured: boolean;
  views_count: number;
  contacts_count: number;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  is_favorited?: boolean;
}

export interface ListingSearchResult {
  id: string;
  title: string;
  city: string;
  price: number;
  currency: string;
  operation_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number;
  primary_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_featured: boolean;
  category_slug?: string;
  category_name?: string;
}
