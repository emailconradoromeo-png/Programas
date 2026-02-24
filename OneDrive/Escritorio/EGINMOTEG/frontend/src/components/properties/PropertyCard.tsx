'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { Listing } from '@/types/listing';

const NON_PROPERTY_SLUGS = ['negocio', 'agencia-inmobiliaria', 'hotel'];

export interface PropertyCardProps {
  listing: Listing;
  onToggleFavorite?: (listingId: string) => void;
  className?: string;
}

const operationBadgeVariant: Record<string, 'info' | 'success' | 'warning'> = {
  venta: 'info',
  alquiler: 'success',
  alquiler_vacacional: 'warning',
};

const operationLabels: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  alquiler_vacacional: 'Vacacional',
};

const categoryBadgeColors: Record<string, string> = {
  negocio: 'bg-purple-100 text-purple-700',
  'agencia-inmobiliaria': 'bg-teal-100 text-teal-700',
  hotel: 'bg-amber-100 text-amber-700',
};

export default function PropertyCard({
  listing,
  onToggleFavorite,
  className,
}: PropertyCardProps) {
  const { locale } = useParams<{ locale: string }>();
  const [isFavorited, setIsFavorited] = useState(listing.is_favorited ?? false);
  const [imgError, setImgError] = useState(false);

  const property = listing.property;
  const primaryImage = property.images?.find((img) => img.is_primary) ?? property.images?.[0];
  const fallbackImage = (property as any).primary_image as string | undefined;
  const imageUrl = imgError ? null : primaryImage?.image ?? fallbackImage ?? null;

  const categorySlug = (property as any).category_slug || property.category?.slug || '';
  const categoryName = (property as any).category_name || property.category?.name || '';
  const isNonProperty = NON_PROPERTY_SLUGS.includes(categorySlug);
  const extra = property.extra_attributes || {};

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onToggleFavorite?.(listing.id);
  };

  const renderStars = (rating: string | number) => {
    const n = Number(rating);
    if (!n || n < 1 || n > 5) return null;
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  };

  return (
    <Link
      href={`/${locale}/properties/${listing.id}`}
      className={cn(
        'group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
              />
            </svg>
          </div>
        )}

        {/* Operation type badge */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge variant={operationBadgeVariant[listing.operation_type] || 'default'}>
            {operationLabels[listing.operation_type] || listing.operation_type}
          </Badge>
          {/* Category badge for non-property types */}
          {isNonProperty && categoryName && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                categoryBadgeColors[categorySlug] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {categoryName}
            </span>
          )}
        </div>

        {/* Featured badge */}
        {listing.is_featured && (
          <div className="absolute right-2 top-2">
            <Badge variant="warning">Destacada</Badge>
          </div>
        )}

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleFavorite}
          className="absolute bottom-2 right-2 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          {isFavorited ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <p className="text-lg font-bold text-blue-600">
          {formatCurrency(listing.price, listing.currency)}
        </p>

        {/* Title */}
        <h3 className="mt-1 truncate text-sm font-semibold text-gray-900">
          {property.title}
        </h3>

        {/* City */}
        <p className="mt-0.5 truncate text-sm text-gray-500">{property.city}</p>

        {/* Key features - vary by type */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          {categorySlug === 'hotel' && extra.star_rating && (
            <span className="text-amber-500 font-medium">
              {renderStars(extra.star_rating)}
            </span>
          )}
          {categorySlug === 'negocio' && extra.business_type && (
            <span className="capitalize">
              {String(extra.business_type).replace(/_/g, ' ')}
            </span>
          )}
          {categorySlug === 'agencia-inmobiliaria' && extra.specialization && (
            <span className="capitalize">
              {String(extra.specialization).replace(/_/g, ' ')}
            </span>
          )}
          {!isNonProperty && property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {property.bedrooms} hab.
            </span>
          )}
          {!isNonProperty && property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {property.bathrooms} bano(s)
            </span>
          )}
          {property.area_m2 > 0 && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              {property.area_m2} m&sup2;
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
