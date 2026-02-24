'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bars3BottomLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

import PropertyCard from '@/components/properties/PropertyCard';
import FilterPanel, { type FilterValues } from '@/components/search/FilterPanel';
import SearchBar from '@/components/search/SearchBar';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { useProperties, useCategories } from '@/hooks/useProperties';

export default function PropertiesPage() {
  const t = useTranslations('properties');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Read query params for initial state
  const initialQuery = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';
  const initialOperationType = searchParams.get('operation_type') || '';
  const initialPriceMin = searchParams.get('price_min') || '';
  const initialPriceMax = searchParams.get('price_max') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBedrooms = searchParams.get('bedrooms') || '';

  const [filters, setFilters] = useState({
    city: initialCity,
    operation_type: initialOperationType,
    min_price: initialPriceMin ? Number(initialPriceMin) : undefined,
    max_price: initialPriceMax ? Number(initialPriceMax) : undefined,
    category: initialCategory,
    bedrooms: initialBedrooms ? Number(initialBedrooms) : undefined,
    page,
    page_size: 12,
  });

  const { data: categories } = useCategories();
  const { data, isLoading, isError } = useProperties(filters);

  // Update filters when page changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page }));
  }, [page]);

  const handleApplyFilters = useCallback(
    (filterValues: FilterValues) => {
      const newFilters = {
        ...filters,
        min_price: filterValues.price_min ? Number(filterValues.price_min) : undefined,
        max_price: filterValues.price_max ? Number(filterValues.price_max) : undefined,
        category: filterValues.category || undefined,
        bedrooms: filterValues.bedrooms ? Number(filterValues.bedrooms) : undefined,
        currency: filterValues.currency || undefined,
        page: 1,
      };
      setFilters(newFilters as typeof filters);
      setPage(1);
      setFiltersOpen(false);

      // Update URL params
      const params = new URLSearchParams();
      if (initialQuery) params.set('q', initialQuery);
      if (filters.city) params.set('city', filters.city);
      if (filters.operation_type) params.set('operation_type', filters.operation_type);
      if (filterValues.price_min) params.set('price_min', filterValues.price_min);
      if (filterValues.price_max) params.set('price_max', filterValues.price_max);
      if (filterValues.category) params.set('category', filterValues.category);
      if (filterValues.bedrooms) params.set('bedrooms', filterValues.bedrooms);
      router.replace(`/${locale}/properties?${params.toString()}`);
    },
    [filters, initialQuery, locale, router]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      city: '',
      operation_type: '',
      min_price: undefined,
      max_price: undefined,
      category: '',
      bedrooms: undefined,
      page: 1,
      page_size: 12,
    });
    setPage(1);
    router.replace(`/${locale}/properties`);
  }, [locale, router]);

  const totalPages = data ? Math.ceil(data.count / 12) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <SearchBar
            defaultValues={{
              query: initialQuery,
              city: initialCity,
              operation_type: initialOperationType,
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 lg:hidden"
          >
            {filtersOpen ? (
              <XMarkIcon className="h-4 w-4" />
            ) : (
              <Bars3BottomLeftIcon className="h-4 w-4" />
            )}
            {t('filters')}
          </button>
        </div>

        {data && (
          <p className="mt-1 text-sm text-gray-500">
            {tCommon('showing')} {data.results.length} {tCommon('of')} {data.count}{' '}
            {tCommon('results')}
          </p>
        )}

        <div className="mt-6 flex gap-6">
          {/* Filter sidebar -- desktop always visible, mobile togglable */}
          <aside
            className={`w-full shrink-0 lg:block lg:w-64 ${
              filtersOpen ? 'block' : 'hidden'
            }`}
          >
            <FilterPanel
              categories={
                categories?.map((c) => ({
                  id: c.id,
                  name: c.name,
                  slug: c.slug,
                })) ?? []
              }
              initialValues={{
                price_min: initialPriceMin,
                price_max: initialPriceMax,
                category: initialCategory,
                bedrooms: initialBedrooms,
                bathrooms: '',
                area_min: '',
                area_max: '',
                currency: 'XAF',
              }}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </aside>

          {/* Property grid */}
          <main className="min-w-0 flex-1">
            {isLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : isError ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <p className="text-lg font-medium text-red-600">{tCommon('error')}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Por favor, intenta de nuevo mas tarde.
                </p>
              </div>
            ) : data && data.results.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-900">
                  {t('no_results')}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta cambiar los filtros de busqueda.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {data?.results.map((listing) => (
                    <PropertyCard
                      key={listing.id}
                      listing={listing}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    className="mt-8 flex items-center justify-center gap-2"
                    aria-label="Pagination"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      {tCommon('previous')}
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (page <= 4) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = page - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                              page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      {tCommon('next')}
                    </Button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
