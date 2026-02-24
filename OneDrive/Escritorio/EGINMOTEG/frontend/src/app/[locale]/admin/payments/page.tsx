'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import {
  BanknotesIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

interface Payment {
  id: string;
  amount: number | string;
  currency: string;
  payment_method: 'bange_mobil' | 'rosa_money' | 'muni_dinero' | 'tarjeta' | 'transferencia';
  status: 'pendiente' | 'completado' | 'fallido' | 'reembolsado';
  reference: string;
  plan_name: string | null;
  created_at: string;
}

interface PaginatedPayments {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  completado: 'success',
  pendiente: 'warning',
  fallido: 'error',
  reembolsado: 'info',
};

const statusLabels: Record<string, Record<string, string>> = {
  completado: { es: 'Completado', fr: 'Complete' },
  pendiente: { es: 'Pendiente', fr: 'En attente' },
  fallido: { es: 'Fallido', fr: 'Echoue' },
  reembolsado: { es: 'Reembolsado', fr: 'Rembourse' },
};

const methodIcons: Record<string, typeof CreditCardIcon> = {
  bange_mobil: DevicePhoneMobileIcon,
  rosa_money: DevicePhoneMobileIcon,
  muni_dinero: DevicePhoneMobileIcon,
  tarjeta: CreditCardIcon,
  transferencia: BanknotesIcon,
};

const methodLabels: Record<string, Record<string, string>> = {
  bange_mobil: { es: 'Bange Mobil', fr: 'Bange Mobil' },
  rosa_money: { es: 'Rosa Money', fr: 'Rosa Money' },
  muni_dinero: { es: 'Muni Dinero', fr: 'Muni Dinero' },
  tarjeta: { es: 'Tarjeta', fr: 'Carte' },
  transferencia: { es: 'Transferencia', fr: 'Virement' },
};

export default function AdminPaymentsPage() {
  const tCommon = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();

  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<PaginatedPayments>({
    queryKey: ['admin-payments', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedPayments>(
        `/payments/history/?ordering=-created_at&page=${page}&page_size=20`
      );
      return data;
    },
    retry: false,
  });

  const payments = data?.results || [];
  const totalCount = data?.count || 0;

  const totalRevenue = payments
    .filter((p) => p.status === 'completado')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingCount = payments.filter((p) => p.status === 'pendiente').length;
  const completedCount = payments.filter((p) => p.status === 'completado').length;

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
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'es' ? 'Gestion de Pagos' : 'Gestion des Paiements'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalCount} {locale === 'es' ? 'pagos registrados' : 'paiements enregistres'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {locale === 'es' ? 'Ingresos (pagina)' : 'Revenus (page)'}
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  maximumFractionDigits: 0,
                }).format(totalRevenue)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {locale === 'es' ? 'Completados' : 'Completes'}
              </p>
              <p className="text-xl font-semibold text-gray-900">{completedCount}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {locale === 'es' ? 'Pendientes' : 'En attente'}
              </p>
              <p className="text-xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BanknotesIcon className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              {locale === 'es' ? 'No hay pagos registrados' : 'Aucun paiement enregistre'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Referencia' : 'Reference'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Plan' : 'Plan'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Monto' : 'Montant'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Metodo' : 'Methode'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Estado' : 'Statut'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {locale === 'es' ? 'Fecha' : 'Date'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payments.map((payment) => {
                  const MethodIcon = methodIcons[payment.payment_method] || BanknotesIcon;
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="text-sm font-mono text-gray-900">
                          {payment.reference || String(payment.id).slice(0, 8)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {payment.plan_name || '-'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
                          style: 'currency',
                          currency: payment.currency,
                          maximumFractionDigits: 0,
                        }).format(Number(payment.amount))}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {methodLabels[payment.payment_method]?.[locale as string] || payment.payment_method}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant={statusBadgeVariant[payment.status] || 'default'}>
                          {statusLabels[payment.status]?.[locale as string] || payment.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString(
                          locale === 'es' ? 'es-ES' : 'fr-FR',
                          { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Placeholder notice */}
      <Card padding="md">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {locale === 'es'
              ? 'La gestion detallada de pagos (reembolsos, disputas, exportacion) se implementara proximamente.'
              : 'La gestion detaillee des paiements (remboursements, litiges, export) sera implementee prochainement.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
