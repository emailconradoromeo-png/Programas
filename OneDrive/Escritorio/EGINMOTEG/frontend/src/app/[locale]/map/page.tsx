'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { MapPinIcon, ListBulletIcon, MapIcon } from '@heroicons/react/24/outline';

import SearchBar from '@/components/search/SearchBar';
import PropertyCard from '@/components/properties/PropertyCard';
import Spinner from '@/components/ui/Spinner';
import { useProperties } from '@/hooks/useProperties';
import type { ListingSearchResult } from '@/types/listing';

// Dynamic import for MapView (Leaflet requires client-side only rendering)
const MapView = dynamic(() => import('@/components/search/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <Spinner size="lg" />
    </div>
  ),
});

export default function MapSearchPage() {
  const t = useTranslations('properties');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();

  const [showList, setShowList] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Read query params
  const initialQuery = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';
  const initialOperationType = searchParams.get('operation_type') || '';

  const { data, isLoading } = useProperties({
    city: initialCity || undefined,
    operation_type: initialOperationType || undefined,
    page_size: 50,
  });

  const listings = data?.results ?? [];

  // Transform Listing objects to ListingSearchResult for MapView
  const searchResults: ListingSearchResult[] = listings.map((l) => {
    const p = l.property;
    const primaryImg = p.images?.find((i) => i.is_primary) ?? p.images?.[0];
    return {
      id: l.id,
      title: p.title,
      city: p.city,
      price: l.price,
      currency: l.currency,
      operation_type: l.operation_type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms ?? null,
      area_m2: p.area_m2,
      primary_image_url: primaryImg?.image ?? (p as any).primary_image ?? null,
      latitude: (p as any).latitude ?? null,
      longitude: (p as any).longitude ?? null,
      is_featured: l.is_featured,
      category_slug: (p as any).category_slug ?? p.category?.slug,
      category_name: (p as any).category_name ?? p.category?.name,
    };
  });

  // Filter results that have coordinates for the map
  const mappableResults = searchResults.filter(
    (r) => r.latitude != null && r.longitude != null
  );

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedMarkerId(id);
    setShowList(true);
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Search bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-full px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                defaultValues={{
                  query: initialQuery,
                  city: initialCity,
                  operation_type: initialOperationType,
                }}
              />
            </div>
            {/* Toggle list/map on mobile */}
            <button
              type="button"
              onClick={() => setShowList(!showList)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 md:hidden"
            >
              {showList ? (
                <>
                  <MapIcon className="h-4 w-4" />
                  {t('map_view')}
                </>
              ) : (
                <>
                  <ListBulletIcon className="h-4 w-4" />
                  {t('list_view')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content: map + results list */}
      <div className="flex min-h-0 flex-1">
        {/* Results list panel */}
        <div
          className={`w-full shrink-0 overflow-y-auto border-r border-gray-200 bg-white md:block md:w-96 lg:w-[28rem] ${
            showList ? 'block' : 'hidden'
          }`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                {isLoading
                  ? tCommon('loading')
                  : `${data?.count ?? 0} ${tCommon('results')}`}
              </h2>
            </div>

            {isLoading ? (
              <div className="mt-8 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : listings.length === 0 ? (
              <div className="mt-12 text-center">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {t('no_results')}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Intenta ajustar tu busqueda
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {listings.map((listing) => {
                  const isSelected = listing.id === selectedMarkerId;
                  return (
                    <div
                      key={listing.id}
                      className={`rounded-lg transition-shadow ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-1'
                          : ''
                      }`}
                    >
                      <PropertyCard listing={listing} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Map area */}
        <div
          className={`min-h-0 flex-1 md:block ${
            showList ? 'hidden' : 'block'
          }`}
        >
          <MapView
            results={mappableResults}
            selectedId={selectedMarkerId}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
}
