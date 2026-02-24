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
  ShieldCheckIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { User } from '@/types/user';

interface PaginatedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export default function AdminUsersPage() {
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', '20');
    params.set('ordering', '-date_joined');
    if (roleFilter) params.set('role', roleFilter);
    if (verifiedFilter) params.set('is_verified', verifiedFilter);
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<PaginatedUsers>({
    queryKey: ['admin-users', page, roleFilter, verifiedFilter],
    queryFn: async () => {
      const { data } = await api.get<PaginatedUsers>(`/auth/admin/users/?${buildParams()}`);
      return data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/auth/admin/users/${userId}/verify/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const users = data?.results || [];
  const totalCount = data?.count || 0;

  const roleBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    admin: 'error',
    agente: 'info',
    propietario: 'success',
    inquilino: 'default',
  };

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
        <h1 className="text-2xl font-bold text-gray-900">{tAdmin('manage_users')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalCount} {locale === 'es' ? 'usuarios registrados' : 'utilisateurs enregistres'}
        </p>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />

          <div>
            <label htmlFor="role-filter" className="block text-xs font-medium text-gray-500 mb-1">
              {locale === 'es' ? 'Rol' : 'Role'}
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{tCommon('all')}</option>
              <option value="admin">Admin</option>
              <option value="agente">{locale === 'es' ? 'Agente' : 'Agent'}</option>
              <option value="propietario">{locale === 'es' ? 'Propietario' : 'Proprietaire'}</option>
              <option value="inquilino">{locale === 'es' ? 'Inquilino' : 'Locataire'}</option>
            </select>
          </div>

          <div>
            <label htmlFor="verified-filter" className="block text-xs font-medium text-gray-500 mb-1">
              {locale === 'es' ? 'Verificado' : 'Verifie'}
            </label>
            <select
              id="verified-filter"
              value={verifiedFilter}
              onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{tCommon('all')}</option>
              <option value="true">{tCommon('yes')}</option>
              <option value="false">{tCommon('no')}</option>
            </select>
          </div>

          {(roleFilter || verifiedFilter) && (
            <button
              onClick={() => { setRoleFilter(''); setVerifiedFilter(''); setPage(1); }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {locale === 'es' ? 'Limpiar filtros' : 'Effacer les filtres'}
            </button>
          )}
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {tCommon('no_results')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Usuario' : 'Utilisateur'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Rol' : 'Role'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Verificado' : 'Verifie'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Registro' : 'Inscription'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Acciones' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-xs text-gray-500">@{u.username}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={roleBadgeVariant[u.role] || 'default'}>{u.role}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {u.is_verified ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-400" />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(u.date_joined).toLocaleDateString(
                        locale === 'es' ? 'es-ES' : 'fr-FR'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {!u.is_verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={verifyMutation.isPending}
                          onClick={() => verifyMutation.mutate(u.id)}
                        >
                          <ShieldCheckIcon className="mr-1.5 h-4 w-4" />
                          {locale === 'es' ? 'Verificar' : 'Verifier'}
                        </Button>
                      )}
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
