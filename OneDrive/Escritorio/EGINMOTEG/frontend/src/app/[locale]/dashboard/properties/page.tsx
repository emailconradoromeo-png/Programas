'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMyListings } from '@/hooks/useProperties';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  BuildingOfficeIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import type { Listing } from '@/types/listing';

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  activo: 'success',
  pausado: 'warning',
  vendido: 'info',
  alquilado: 'info',
  expirado: 'error',
};

export default function MyPropertiesPage() {
  const t = useTranslations('properties');
  const tCommon = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();
  const { data, isLoading, error } = useMyListings();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/listings/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      setDeleteTarget(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      await api.patch(`/listings/${id}/`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });

  const listings = data?.results || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {listings.length} {locale === 'es' ? 'propiedades encontradas' : 'proprietes trouvees'}
          </p>
        </div>
        <Link href={`/${locale}/properties/new`}>
          <Button variant="primary">
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('add_property')}
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {listings.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {locale === 'es' ? 'No tienes propiedades' : "Vous n'avez pas de proprietes"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {locale === 'es'
                ? 'Comienza agregando tu primera propiedad para que aparezca en las busquedas.'
                : 'Commencez par ajouter votre premiere propriete pour apparaitre dans les recherches.'}
            </p>
            <Link href={`/${locale}/properties/new`} className="mt-6">
              <Button variant="primary">
                <PlusIcon className="mr-2 h-4 w-4" />
                {t('add_property')}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Listings Table */
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Propiedad' : 'Propriete'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Estado' : 'Statut'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <EyeIcon className="inline h-4 w-4" /> {locale === 'es' ? 'Vistas' : 'Vues'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Creada' : 'Creee'}
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
                          <Link
                            href={`/${locale}/properties/${listing.property.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {listing.property.title}
                          </Link>
                          <p className="text-xs text-gray-500">{listing.property.city}</p>
                        </div>
                      </div>
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
                      {listing.views_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString(
                        locale === 'es' ? 'es-ES' : 'fr-FR'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/${locale}/properties/${listing.property.id}`}>
                          <button
                            className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title={tCommon('edit')}
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          className="rounded p-1.5 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                          title={listing.status === 'activo'
                            ? (locale === 'es' ? 'Pausar' : 'Mettre en pause')
                            : (locale === 'es' ? 'Activar' : 'Activer')}
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: listing.id,
                              newStatus: listing.status === 'activo' ? 'pausado' : 'activo',
                            })
                          }
                          disabled={toggleStatusMutation.isPending}
                        >
                          {listing.status === 'activo' ? (
                            <PauseIcon className="h-4 w-4" />
                          ) : (
                            <PlayIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title={tCommon('delete')}
                          onClick={() => setDeleteTarget(listing)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('delete_property')}
      >
        <p className="text-sm text-gray-500">{t('confirm_delete')}</p>
        <p className="mt-2 text-sm font-medium text-gray-900">{deleteTarget?.property.title}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            {tCommon('delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
