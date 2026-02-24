'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useValuation, useRequestValuation } from '@/hooks/useAI';

interface ValuationCardProps {
  propertyId: string;
}

export default function ValuationCard({ propertyId }: ValuationCardProps) {
  const t = useTranslations('ai');
  const { locale } = useParams<{ locale: string }>();
  const [showDetails, setShowDetails] = useState(false);

  const { data: valuation, isLoading, isError } = useValuation(propertyId);
  const requestMutation = useRequestValuation();

  const handleRequestValuation = () => {
    requestMutation.mutate(propertyId);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'es-ES', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(price);

  const confidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const confidenceLabel = (score: number) => {
    if (score >= 0.7) return t('confidence_high');
    if (score >= 0.4) return t('confidence_medium');
    return t('confidence_low');
  };

  // No valuation yet
  if (isError || (!isLoading && !valuation)) {
    return (
      <Card
        header={
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('valuation_title')}</h3>
          </div>
        }
        padding="md"
      >
        <p className="text-sm text-gray-500">{t('no_valuation')}</p>
        <Button
          variant="primary"
          size="sm"
          className="mt-3 w-full"
          onClick={handleRequestValuation}
          loading={requestMutation.isPending}
        >
          <ChartBarIcon className="mr-2 h-4 w-4" />
          {t('request_valuation')}
        </Button>
        {requestMutation.isSuccess && (
          <p className="mt-2 text-xs text-green-600">{t('valuation_requested')}</p>
        )}
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
        </div>
      </Card>
    );
  }

  if (!valuation) return null;

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('valuation_title')}</h3>
          </div>
          <button
            type="button"
            onClick={handleRequestValuation}
            className="text-gray-400 hover:text-gray-600"
            title={t('refresh_valuation')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${requestMutation.isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
      padding="md"
    >
      {/* Estimated price */}
      <div className="text-center">
        <p className="text-3xl font-bold text-blue-600">
          {formatPrice(valuation.estimated_price_xaf)}
        </p>
        <p className="mt-1 text-xs text-gray-500">{t('estimated_price')}</p>
      </div>

      {/* Confidence */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceColor(valuation.confidence_score)}`}
        >
          {confidenceLabel(valuation.confidence_score)}
        </span>
        <span className="text-xs text-gray-400">
          ({Math.round(valuation.confidence_score * 100)}%)
        </span>
      </div>

      {/* Comparable count */}
      <p className="mt-3 text-center text-xs text-gray-500">
        {t('based_on', { count: valuation.comparable_listings.length })}
      </p>

      {/* Toggle details */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500"
      >
        <InformationCircleIcon className="h-3.5 w-3.5" />
        {showDetails ? t('hide_details') : t('show_details')}
      </button>

      {showDetails && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          {valuation.factors.mean_price && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('mean_price')}</span>
              <span className="font-medium">{formatPrice(valuation.factors.mean_price)}</span>
            </div>
          )}
          {valuation.factors.median_price && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('median_price')}</span>
              <span className="font-medium">{formatPrice(valuation.factors.median_price)}</span>
            </div>
          )}
          {valuation.comparable_listings.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700">{t('comparable_properties')}</p>
              <div className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                {valuation.comparable_listings.slice(0, 5).map((comp) => (
                  <div
                    key={comp.listing_id}
                    className="flex justify-between rounded bg-gray-50 px-2 py-1 text-xs"
                  >
                    <span className="truncate text-gray-600">{comp.property_title}</span>
                    <span className="ml-2 whitespace-nowrap font-medium">
                      {formatPrice(comp.price_xaf)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
