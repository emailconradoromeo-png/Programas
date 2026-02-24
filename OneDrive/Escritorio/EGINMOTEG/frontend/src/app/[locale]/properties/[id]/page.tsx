'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  HeartIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  MapPinIcon,
  CheckBadgeIcon,
  ArrowLeftIcon,
  ShareIcon,
  HomeModernIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ValuationCard from '@/components/ai/ValuationCard';
import ImageAnalysisPanel from '@/components/ai/ImageAnalysisPanel';
import RecommendationGrid from '@/components/ai/RecommendationGrid';
import { useProperty } from '@/hooks/useProperties';
import { formatCurrency } from '@/lib/currency';
import type { FieldSchemaEntry } from '@/types/property';

const NON_PROPERTY_SLUGS = ['negocio', 'agencia-inmobiliaria', 'hotel'];

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

function renderStars(rating: string | number) {
  const n = Number(rating);
  if (!n || n < 1 || n > 5) return String(rating);
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatExtraValue(
  key: string,
  value: any,
  fieldSchema?: FieldSchemaEntry
): React.ReactNode {
  if (Array.isArray(value)) {
    return (
      <ul className="mt-0.5 flex flex-wrap gap-1.5">
        {value.map((v) => (
          <li
            key={v}
            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
          >
            {String(v).charAt(0).toUpperCase() + String(v).slice(1).replace(/_/g, ' ')}
          </li>
        ))}
      </ul>
    );
  }
  if (key === 'star_rating') {
    return <span className="text-amber-500">{renderStars(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return value ? 'Si' : 'No';
  }
  return String(value).charAt(0).toUpperCase() + String(value).slice(1).replace(/_/g, ' ');
}

export default function PropertyDetailPage() {
  const t = useTranslations('properties');
  const tCommon = useTranslations('common');
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();

  const { data: listing, isLoading, isError } = useProperty(id);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // 404 state
  if (isError || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <HomeModernIcon className="h-20 w-20 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Propiedad no encontrada
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          La propiedad que buscas no existe o ha sido eliminada.
        </p>
        <Button
          variant="outline"
          size="md"
          className="mt-6"
          onClick={() => router.push(`/${locale}/properties`)}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Volver a propiedades
        </Button>
      </div>
    );
  }

  const property = listing.property;
  const images = property.images ?? [];
  const currentImage = images[selectedImageIndex];

  const categorySlug = property.category?.slug || '';
  const categoryName = property.category?.name || '';
  const fieldsSchema: Record<string, FieldSchemaEntry> =
    (property.category?.fields_schema as Record<string, FieldSchemaEntry>) || {};
  const isTraditionalProperty = !NON_PROPERTY_SLUGS.includes(categorySlug);
  const extra = property.extra_attributes || {};
  const hasExtra = Object.keys(extra).length > 0;

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageError = (index: number) => {
    setImgErrors((prev) => new Set(prev).add(index));
  };

  const featureItems = [
    {
      label: t('rooms'),
      value: property.bedrooms,
      suffix: '',
    },
    {
      label: t('bathrooms'),
      value: property.bathrooms,
      suffix: '',
    },
    {
      label: t('area'),
      value: property.area_m2 > 0 ? property.area_m2 : null,
      suffix: ' m\u00B2',
    },
    {
      label: 'Pisos',
      value: property.floors,
      suffix: '',
    },
    {
      label: 'Ano construido',
      value: property.year_built,
      suffix: '',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {tCommon('back')}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Image gallery */}
        <section className="overflow-hidden rounded-lg bg-white shadow-sm">
          {images.length > 0 ? (
            <div>
              {/* Main image */}
              <div className="relative aspect-[16/9] w-full bg-gray-100 sm:aspect-[2/1]">
                {currentImage && !imgErrors.has(selectedImageIndex) ? (
                  <Image
                    src={currentImage.image}
                    alt={currentImage.caption || property.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                    onError={() => handleImageError(selectedImageIndex)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <HomeModernIcon className="h-24 w-24 text-gray-300" />
                  </div>
                )}

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails grid */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                        index === selectedImageIndex
                          ? 'border-blue-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {!imgErrors.has(index) ? (
                        <Image
                          src={img.thumbnail || img.image}
                          alt={img.caption || `${property.title} - ${index + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                          onError={() => handleImageError(index)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <HomeModernIcon className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center bg-gray-100 sm:aspect-[2/1]">
              <div className="text-center">
                <HomeModernIcon className="mx-auto h-24 w-24 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">Sin imagenes</p>
              </div>
            </div>
          )}
        </section>

        {/* Content grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Title and badges */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <Badge
                  variant={
                    operationBadgeVariant[listing.operation_type] || 'default'
                  }
                >
                  {operationLabels[listing.operation_type] ||
                    listing.operation_type}
                </Badge>
                {property.is_verified && (
                  <Badge variant="success">
                    <CheckBadgeIcon className="mr-1 h-3.5 w-3.5" />
                    Verificada
                  </Badge>
                )}
                {listing.is_featured && (
                  <Badge variant="warning">Destacada</Badge>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                {property.title}
              </h1>

              {/* Price */}
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {formatCurrency(listing.price, listing.currency)}
              </p>
              {listing.price_negotiable && (
                <span className="mt-1 inline-block text-sm text-gray-500">
                  Precio negociable
                </span>
              )}
              {listing.deposit_amount && listing.deposit_currency && (
                <p className="mt-1 text-sm text-gray-500">
                  Deposito:{' '}
                  {formatCurrency(listing.deposit_amount, listing.deposit_currency)}
                </p>
              )}

              {/* Location */}
              <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 text-gray-400" />
                <span>
                  {property.address}
                  {property.neighborhood && `, ${property.neighborhood}`}
                  {property.city && `, ${property.city}`}
                </span>
              </div>

              {/* Category */}
              {categoryName && (
                <p className="mt-2 text-sm text-gray-500">
                  Categoria: {categoryName}
                </p>
              )}
            </div>

            {/* Key features grid - only for traditional properties */}
            {isTraditionalProperty && (
              <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Caracteristicas principales
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {featureItems.map(
                    (item) =>
                      item.value != null && (
                        <div
                          key={item.label}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center"
                        >
                          <p className="text-2xl font-bold text-blue-600">
                            {item.value}
                            {item.suffix}
                          </p>
                          <p className="mt-1 text-xs font-medium text-gray-500">
                            {item.label}
                          </p>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {/* Category-specific details (extra_attributes) */}
            {hasExtra && (
              <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Detalles de {categoryName || 'la propiedad'}
                </h2>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(extra).map(([key, value]) => {
                    const schema = fieldsSchema[key];
                    const label = schema?.label || key.replace(/_/g, ' ');
                    return (
                      <div key={key}>
                        <dt className="text-xs font-medium capitalize text-gray-500">
                          {label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-gray-900">
                          {formatExtraValue(key, value, schema)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

            {/* Full description */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('description')}
              </h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {property.description || 'Sin descripcion disponible.'}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('location')}
              </h2>
              <div className="mt-3 flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                <div className="text-center text-sm text-gray-500">
                  <MapPinIcon className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 font-medium">Mapa de ubicacion</p>
                  <p className="mt-1">
                    {property.city}
                    {property.address && ` - ${property.address}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Integracion con Leaflet disponible
                  </p>
                </div>
              </div>
            </div>

            {/* Image Analysis */}
            {images.length > 0 && (
              <div className="mt-6">
                <ImageAnalysisPanel images={images} />
              </div>
            )}

            {/* Recommendations */}
            <div className="mt-6">
              <RecommendationGrid />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Action buttons */}
            <div className="sticky top-4 space-y-4">
              {/* Owner/Agent info card */}
              <Card>
                <div className="text-center">
                  {/* Avatar */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                    {property.owner?.first_name?.charAt(0) ||
                      (listing.posted_by_username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-gray-900">
                    {property.owner?.first_name && property.owner?.last_name
                      ? `${property.owner.first_name} ${property.owner.last_name}`
                      : listing.posted_by_username || 'Usuario'}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">Propietario</p>
                </div>

                <div className="mt-5 space-y-3">
                  {/* Contact - show phone */}
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => setShowPhone(!showPhone)}
                  >
                    <PhoneIcon className="mr-2 h-4 w-4" />
                    {showPhone && property.owner?.phone
                      ? property.owner.phone
                      : t('contact_owner')}
                  </Button>

                  {/* Send message */}
                  <Link href={`/${locale}/dashboard/messages`}>
                    <Button variant="outline" size="md" className="w-full">
                      <ChatBubbleLeftIcon className="mr-2 h-4 w-4" />
                      Enviar mensaje
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Favorite and share buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setIsFavorited(!isFavorited)}
                >
                  {isFavorited ? (
                    <HeartSolidIcon className="mr-2 h-4 w-4 text-red-500" />
                  ) : (
                    <HeartIcon className="mr-2 h-4 w-4" />
                  )}
                  {isFavorited ? 'Guardada' : 'Guardar'}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      navigator.share({
                        title: property.title,
                        url: window.location.href,
                      });
                    }
                  }}
                >
                  <ShareIcon className="mr-2 h-4 w-4" />
                  Compartir
                </Button>
              </div>

              {/* AI Valuation */}
              <ValuationCard propertyId={property.id} />

              {/* Listing metadata */}
              <Card>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Vistas</dt>
                    <dd className="font-medium text-gray-900">
                      {listing.views_count}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Contactos</dt>
                    <dd className="font-medium text-gray-900">
                      {listing.contacts_count}
                    </dd>
                  </div>
                  {listing.published_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Publicada</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(listing.published_at).toLocaleDateString(
                          locale === 'fr' ? 'fr-FR' : 'es-ES'
                        )}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Referencia</dt>
                    <dd className="font-mono text-xs text-gray-900">
                      {listing.id.slice(0, 8)}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
