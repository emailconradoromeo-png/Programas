'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import {
  FunnelIcon,
  CheckIcon,
  NoSymbolIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface AdminListing {
  id: string;
  property: {
    id: string;
    title: string;
    city: string;
    owner?: { id: string; username: string; first_name: string; last_name: string };
    images?: { image: string; thumbnail: string | null }[];
  };
  posted_by: string;
  posted_by_username?: string;
  operation_type: string;
  price: number;
  currency: string;
  status: string;
  views_count: number;
  created_at: string;
}

interface PaginatedListings {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminListing[];
}

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  activo: 'success',
  pausado: 'warning',
  vendido: 'info',
  alquilado: 'info',
  expirado: 'error',
};

export default function AdminListingsPage() {
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', '20');
    params.set('ordering', '-created_at');
    if (statusFilter) params.set('status', statusFilter);
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<PaginatedListings>({
    queryKey: ['admin-listings', page, statusFilter],
    queryFn: async () => {
      const { data } = await api.get<PaginatedListings>(`/listings/?${buildParams()}`);
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/listings/${id}/`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
    },
  });

  const listings = data?.results || [];
  const totalCount = data?.count || 0;

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{tCommon('error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tAdmin('manage_properties')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalCount} {locale === 'es' ? 'anuncios en total' : 'annonces au total'}
        </p>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />

          <div>
            <label htmlFor="status-filter" className="block text-xs font-medium text-gray-500 mb-1">
              {locale === 'es' ? 'Estado' : 'Statut'}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{tCommon('all')}</option>
              <option value="activo">{locale === 'es' ? 'Activo' : 'Actif'}</option>
              <option value="pausado">{locale === 'es' ? 'Pausado' : 'En pause'}</option>
              <option value="vendido">{locale === 'es' ? 'Vendido' : 'Vendu'}</option>
              <option value="alquilado">{locale === 'es' ? 'Alquilado' : 'Loue'}</option>
              <option value="expirado">{locale === 'es' ? 'Expirado' : 'Expire'}</option>
            </select>
          </div>

          {statusFilter && (
            <button
              onClick={() => { setStatusFilter(''); setPage(1); }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {locale === 'es' ? 'Limpiar filtros' : 'Effacer les filtres'}
            </button>
          )}
        </div>
      </Card>

      {/* Listings Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : listings.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {tCommon('no_results')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Propiedad' : 'Propriete'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Propietario' : 'Proprietaire'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Estado' : 'Statut'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Precio' : 'Prix'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Fecha' : 'Date'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Acciones' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        {listing.property.images?.[0] ? (
                          <img
                            src={listing.property.images[0].thumbnail || listing.property.images[0].image}
                            alt={listing.property.title}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {listing.property.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {listing.property.city} &middot; {listing.operation_type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm text-gray-900">{listing.posted_by_username || listing.property.owner?.username || '-'}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={statusBadgeVariant[listing.status] || 'default'}>
                        {listing.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
                        style: 'currency',
                        currency: listing.currency,
                        maximumFractionDigits: 0,
                      }).format(listing.price)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString(
                        locale === 'es' ? 'es-ES' : 'fr-FR'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {listing.status !== 'activo' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: listing.id, status: 'activo' })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckIcon className="mr-1 h-4 w-4 text-green-500" />
                            {locale === 'es' ? 'Aprobar' : 'Approuver'}
                          </Button>
                        )}
                        {listing.status === 'activo' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: listing.id, status: 'pausado' })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <NoSymbolIcon className="mr-1 h-4 w-4 text-red-500" />
                            {locale === 'es' ? 'Suspender' : 'Suspendre'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > 20 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-500">
              {tCommon('showing')} {(page - 1) * 20 + 1}-{Math.min(page * 20, totalCount)}{' '}
              {tCommon('of')} {totalCount} {tCommon('results')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {tCommon('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.next}
                onClick={() => setPage((p) => p + 1)}
              >
                {tCommon('next')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
