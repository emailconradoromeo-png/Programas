'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyListings } from '@/hooks/useProperties';
import { useConversations } from '@/hooks/useMessages';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import {
  BuildingOfficeIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  PlusIcon,
  EnvelopeIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import RecommendationGrid from '@/components/ai/RecommendationGrid';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tProp = useTranslations('properties');
  const tNav = useTranslations('nav');
  const tMsg = useTranslations('messages');
  const { locale } = useParams<{ locale: string }>();
  const { user } = useAuth();
  const { data: listingsData, isLoading: listingsLoading } = useMyListings();
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations();

  const listings = listingsData?.results || [];
  const conversations = conversationsData?.results || [];

  const totalProperties = listings.length;
  const activeListings = listings.filter((l) => l.status === 'activo').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const statsCards = [
    {
      label: locale === 'es' ? 'Total Propiedades' : 'Total Proprietes',
      value: totalProperties,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
    },
    {
      label: locale === 'es' ? 'Anuncios Activos' : 'Annonces Actives',
      value: activeListings,
      icon: MegaphoneIcon,
      color: 'bg-green-500',
    },
    {
      label: tMsg('title'),
      value: unreadMessages,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-yellow-500',
    },
    {
      label: t('views'),
      value: totalViews,
      icon: EyeIcon,
      color: 'bg-purple-500',
    },
  ];

  const recentListings = listings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('welcome')}, {user?.first_name || user?.username}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('title')} - {new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      {listingsLoading || conversationsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.label} padding="md">
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
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Card
        header={
          <h2 className="text-lg font-semibold text-gray-900">
            {locale === 'es' ? 'Acciones rapidas' : 'Actions rapides'}
          </h2>
        }
        padding="md"
      >
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/properties/new`}>
            <Button variant="primary" size="md">
              <PlusIcon className="mr-2 h-4 w-4" />
              {tProp('add_property')}
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/messages`}>
            <Button variant="outline" size="md">
              <EnvelopeIcon className="mr-2 h-4 w-4" />
              {tMsg('title')}
              {unreadMessages > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadMessages}
                </span>
              )}
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/subscription`}>
            <Button variant="outline" size="md">
              <CreditCardIcon className="mr-2 h-4 w-4" />
              {locale === 'es' ? 'Suscripcion' : 'Abonnement'}
            </Button>
          </Link>
        </div>
      </Card>

      {/* AI Recommendations */}
      <RecommendationGrid />

      {/* Recent Activity */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('recent_activity')}</h2>
            <Link
              href={`/${locale}/dashboard/properties`}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {locale === 'es' ? 'Ver todas' : 'Voir tout'}
            </Link>
          </div>
        }
        padding="none"
      >
        {recentListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              {locale === 'es'
                ? 'No tienes propiedades todavia. Agrega tu primera propiedad.'
                : "Vous n'avez pas encore de proprietes. Ajoutez votre premiere propriete."}
            </p>
            <Link href={`/${locale}/properties/new`} className="mt-4">
              <Button variant="primary" size="sm">
                <PlusIcon className="mr-1.5 h-4 w-4" />
                {tProp('add_property')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  {listing.property.images?.[0] ? (
                    <img
                      src={listing.property.images[0].thumbnail || listing.property.images[0].image}
                      alt={listing.property.title}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{listing.property.title}</p>
                    <p className="text-xs text-gray-500">
                      {listing.property.city} &middot; {listing.operation_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
                      style: 'currency',
                      currency: listing.currency,
                      maximumFractionDigits: 0,
                    }).format(listing.price)}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      listing.status === 'activo'
                        ? 'bg-green-100 text-green-800'
                        : listing.status === 'pausado'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
