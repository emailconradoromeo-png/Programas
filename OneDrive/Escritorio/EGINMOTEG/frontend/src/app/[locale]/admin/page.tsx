'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import {
  UsersIcon,
  BuildingOfficeIcon,
  MegaphoneIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import type { User } from '@/types/user';

interface AdminStats {
  total_users: number;
  total_properties: number;
  active_listings: number;
  total_revenue: number;
  pending_kyc: number;
}

interface AdminUsersResponse {
  count: number;
  results: User[];
}

interface AdminListingsResponse {
  count: number;
  results: {
    id: string;
    property: { title: string; city: string };
    posted_by: string;
    posted_by_username?: string;
    status: string;
    price: number;
    currency: string;
    created_at: string;
  }[];
}

export default function AdminDashboardPage() {
  const tAdmin = useTranslations('admin');
  const { locale } = useParams<{ locale: string }>();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const { data } = await api.get<AdminStats>('/admin/stats/');
        return data;
      } catch {
        // Fallback: aggregate from individual endpoints
        const [usersRes, listingsRes] = await Promise.allSettled([
          api.get<AdminUsersResponse>('/auth/admin/users/?page_size=1'),
          api.get<AdminListingsResponse>('/listings/?page_size=1'),
        ]);
        return {
          total_users: usersRes.status === 'fulfilled' ? usersRes.value.data.count : 0,
          total_properties: 0,
          active_listings: listingsRes.status === 'fulfilled' ? listingsRes.value.data.count : 0,
          total_revenue: 0,
          pending_kyc: 0,
        };
      }
    },
  });

  const { data: recentUsers, isLoading: usersLoading } = useQuery<AdminUsersResponse>({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const { data } = await api.get<AdminUsersResponse>('/auth/admin/users/?ordering=-date_joined&page_size=5');
      return data;
    },
  });

  const { data: recentListings, isLoading: listingsLoading } = useQuery<AdminListingsResponse>({
    queryKey: ['admin-recent-listings'],
    queryFn: async () => {
      const { data } = await api.get<AdminListingsResponse>('/listings/?ordering=-created_at&page_size=5');
      return data;
    },
  });

  const statCards = [
    {
      label: locale === 'es' ? 'Total Usuarios' : 'Total Utilisateurs',
      value: stats?.total_users ?? '-',
      icon: UsersIcon,
      color: 'bg-blue-500',
      href: `/${locale}/admin/users`,
    },
    {
      label: locale === 'es' ? 'Total Propiedades' : 'Total Proprietes',
      value: stats?.total_properties ?? '-',
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
      href: `/${locale}/admin/listings`,
    },
    {
      label: locale === 'es' ? 'Anuncios Activos' : 'Annonces Actives',
      value: stats?.active_listings ?? '-',
      icon: MegaphoneIcon,
      color: 'bg-yellow-500',
      href: `/${locale}/admin/listings`,
    },
    {
      label: locale === 'es' ? 'Ingresos Totales' : 'Revenus Totaux',
      value: stats?.total_revenue
        ? new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
            style: 'currency',
            currency: 'XAF',
            maximumFractionDigits: 0,
          }).format(stats.total_revenue)
        : '-',
      icon: BanknotesIcon,
      color: 'bg-purple-500',
      href: `/${locale}/admin/payments`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tAdmin('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {locale === 'es' ? 'Resumen general del sistema' : 'Apercu general du systeme'}
          </p>
        </div>
        {stats?.pending_kyc !== undefined && stats.pending_kyc > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2 border border-orange-200">
            <ShieldCheckIcon className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">
              {stats.pending_kyc} KYC {locale === 'es' ? 'pendientes' : 'en attente'}
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {locale === 'es' ? 'Usuarios recientes' : 'Utilisateurs recents'}
              </h2>
              <Link
                href={`/${locale}/admin/users`}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {locale === 'es' ? 'Ver todos' : 'Voir tout'}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          }
          padding="none"
        >
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : !recentUsers?.results?.length ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {locale === 'es' ? 'No hay usuarios' : 'Aucun utilisateur'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentUsers.results.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.is_verified ? 'success' : 'warning'}>
                      {u.role}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(u.date_joined).toLocaleDateString(locale === 'es' ? 'es-ES' : 'fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Listings */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {locale === 'es' ? 'Anuncios recientes' : 'Annonces recentes'}
              </h2>
              <Link
                href={`/${locale}/admin/listings`}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {locale === 'es' ? 'Ver todos' : 'Voir tout'}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          }
          padding="none"
        >
          {listingsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : !recentListings?.results?.length ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {locale === 'es' ? 'No hay anuncios' : 'Aucune annonce'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentListings.results.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {listing.property.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {listing.posted_by_username || '-'} &middot; {listing.property.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        listing.status === 'activo' ? 'success' :
                        listing.status === 'pausado' ? 'warning' : 'default'
                      }
                    >
                      {listing.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
                        style: 'currency',
                        currency: listing.currency,
                        maximumFractionDigits: 0,
                      }).format(listing.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Links */}
      <Card
        header={
          <h2 className="text-lg font-semibold text-gray-900">
            {locale === 'es' ? 'Accesos rapidos' : 'Acces rapides'}
          </h2>
        }
        padding="md"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: tAdmin('manage_users'),
              href: `/${locale}/admin/users`,
              icon: UsersIcon,
              color: 'text-blue-600 bg-blue-100',
            },
            {
              label: tAdmin('manage_properties'),
              href: `/${locale}/admin/listings`,
              icon: MegaphoneIcon,
              color: 'text-green-600 bg-green-100',
            },
            {
              label: locale === 'es' ? 'Gestionar pagos' : 'Gerer les paiements',
              href: `/${locale}/admin/payments`,
              icon: BanknotesIcon,
              color: 'text-purple-600 bg-purple-100',
            },
            {
              label: locale === 'es' ? 'Verificaciones KYC' : 'Verifications KYC',
              href: `/${locale}/admin/users`,
              icon: ShieldCheckIcon,
              color: 'text-orange-600 bg-orange-100',
            },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
