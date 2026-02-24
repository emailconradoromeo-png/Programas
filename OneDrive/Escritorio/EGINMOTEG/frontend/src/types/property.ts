export interface FieldSchemaEntry {
  type: 'text' | 'number' | 'email' | 'url' | 'select' | 'multiselect';
  label: string;
  required: boolean;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  fields_schema: Record<string, FieldSchemaEntry>;
}

export interface PropertyImage {
  id: number;
  image: string;
  thumbnail: string | null;
  caption: string;
  order: number;
  is_primary: boolean;
}

export interface Property {
  id: string;
  owner: { id: string; username: string; first_name: string; last_name: string; phone: string | null };
  category: Category;
  title: string;
  description: string;
  address: string;
  city: string;
  neighborhood: string;
  area_m2: number;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  year_built: number | null;
  extra_attributes: Record<string, any>;
  is_verified: boolean;
  status: 'borrador' | 'activo' | 'pausado' | 'vendido' | 'alquilado';
  images: PropertyImage[];
  created_at: string;
  updated_at: string;
}
