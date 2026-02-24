export interface PropertyValuation {
  id: string;
  property: string;
  property_title: string;
  estimated_price_xaf: number;
  confidence_score: number;
  comparable_listings: ComparableListing[];
  factors: ValuationFactors;
  created_at: string;
}

export interface ComparableListing {
  listing_id: string;
  property_title: string;
  price_xaf: number;
  city: string;
  area_m2: number | null;
  bedrooms: number | null;
}

export interface ValuationFactors {
  n_comparable: number;
  mean_price: number;
  median_price: number;
  coefficient_of_variation: number;
  city: string;
  category: string | null;
  bedrooms: number | null;
  area_m2: number | null;
  message?: string;
}

export interface Recommendation {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_price: number;
  listing_currency: string;
  listing_city: string;
  listing_image: string | null;
  listing_operation_type: string;
  score: number;
  reason: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  context: Record<string, any>;
  message_count: number;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  message_count: number;
  last_message: {
    role: string;
    content: string;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  session: ChatSession;
}

export interface ImageAnalysis {
  id: string;
  property_image: number;
  image_url: string | null;
  room_type: string;
  quality_score: number | null;
  description: string;
  features: string[];
  status: 'pendiente' | 'procesando' | 'completado' | 'error';
  error_message: string;
  created_at: string;
}
