export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'propietario' | 'inquilino' | 'agente' | 'admin';
  language: 'es' | 'fr';
  preferred_currency: 'XAF' | 'EUR' | 'USD';
  is_verified: boolean;
  date_joined: string;
  profile: UserProfile | null;
}

export interface UserProfile {
  avatar: string | null;
  bio: string;
  company_name: string;
  license_number: string;
  address: string;
  city: string;
  reputation_score: number;
  total_reviews: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  language: string;
}
