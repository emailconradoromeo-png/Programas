'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  SparklesIcon,
  MapPinIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { useRecommendations } from '@/hooks/useAI';

const operationLabels: Record<string, Record<string, string>> = {
  es: { venta: 'Venta', alquiler: 'Alquiler', alquiler_vacacional: 'Vacacional' },
  fr: { venta: 'Vente', alquiler: 'Location', alquiler_vacacional: 'Vacances' },
};

export default function RecommendationGrid() {
  const t = useTranslations('ai');
  const { locale } = useParams<{ locale: string }>();
  const { data, isLoading } = useRecommendations();

  const recommendations = data?.results || [];

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);

  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card
        header={
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">{t('recommendations_title')}</h3>
          </div>
        }
        padding="md"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <SparklesIcon className="h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">{t('no_recommendations')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('no_recommendations_hint')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      header={
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">{t('recommendations_title')}</h3>
        </div>
      }
      padding="none"
    >
      <div className="grid grid-cols-1 gap-px bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.slice(0, 6).map((rec) => (
          <Link
            key={rec.id}
            href={`/${locale}/properties/${rec.listing_id}`}
            className="group bg-white p-4 transition-colors hover:bg-gray-50"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
              {rec.listing_image ? (
                <img
                  src={rec.listing_image}
                  alt={rec.listing_title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <HomeModernIcon className="h-10 w-10 text-gray-300" />
                </div>
              )}
              {/* Score badge */}
              <div className="absolute right-2 top-2 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">
                {Math.round(rec.score * 100)}%
              </div>
              {/* Operation type */}
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {(operationLabels[locale] || operationLabels['es'])[rec.listing_operation_type] ||
                  rec.listing_operation_type}
              </div>
            </div>

            {/* Info */}
            <div className="mt-3">
              <h4 className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600">
                {rec.listing_title}
              </h4>
              <p className="mt-1 text-sm font-bold text-blue-600">
                {formatPrice(rec.listing_price, rec.listing_currency)}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPinIcon className="h-3 w-3" />
                <span className="capitalize">{rec.listing_city}</span>
              </div>
              {rec.reason && (
                <p className="mt-1.5 line-clamp-2 text-xs text-gray-400">
                  {rec.reason}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
