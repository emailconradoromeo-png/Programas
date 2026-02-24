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
import Modal from '@/components/ui/Modal';
import {
  BanknotesIcon,
  CheckIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  price_xaf: number | string;
  price_eur: number | string;
  duration_days: number;
  max_listings: number;
  features: Record<string, string[]> | string[];
  is_active: boolean;
  created_at: string;
}

interface Subscription {
  id: number;
  user: string;
  plan: SubscriptionPlan;
  status: 'activo' | 'expirado' | 'cancelado';
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  created_at: string;
}

const defaultPlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: 'Basico',
    slug: 'basico',
    price_xaf: 0,
    price_eur: 0,
    features: [],
    max_listings: 3,
    duration_days: 30,
    is_active: true,
    created_at: '',
  },
  {
    id: 2,
    name: 'Profesional',
    slug: 'profesional',
    price_xaf: 15000,
    price_eur: 25,
    features: [],
    max_listings: 20,
    duration_days: 30,
    is_active: true,
    created_at: '',
  },
  {
    id: 3,
    name: 'Agencia',
    slug: 'agencia',
    price_xaf: 45000,
    price_eur: 75,
    features: [],
    max_listings: -1,
    duration_days: 30,
    is_active: true,
    created_at: '',
  },
];

export default function SubscriptionPage() {
  const tCommon = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bange_mobil' | 'rosa_money' | 'muni_dinero' | 'tarjeta' | 'transferencia'>('bange_mobil');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: subscription, isLoading: subLoading } = useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Subscription>('/payments/my-subscription/');
        return data;
      } catch {
        return null;
      }
    },
  });

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      try {
        const { data } = await api.get<{ count: number; results: SubscriptionPlan[] } | SubscriptionPlan[]>('/payments/plans/');
        // Handle both paginated and non-paginated responses
        if (Array.isArray(data)) return data;
        if (data && 'results' in data) return data.results;
        return defaultPlans;
      } catch {
        return defaultPlans;
      }
    },
    placeholderData: defaultPlans,
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, method }: { planId: number; method: string }) => {
      const { data } = await api.post('/payments/subscribe/', {
        plan_id: planId,
        payment_method: method,
        currency: 'XAF',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowPaymentModal(false);
      setSelectedPlan(null);
    },
  });

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedPlan) return;
    subscribeMutation.mutate({ planId: selectedPlan.id, method: paymentMethod });
  };

  const activePlans = plans || defaultPlans;

  const planFeatures: Record<string, { es: string[]; fr: string[] }> = {
    basico: {
      es: [
        'Hasta 3 anuncios',
        'Fotos basicas',
        'Soporte por email',
        'Perfil de propietario',
      ],
      fr: [
        "Jusqu'a 3 annonces",
        'Photos basiques',
        'Support par email',
        'Profil proprietaire',
      ],
    },
    profesional: {
      es: [
        'Hasta 20 anuncios',
        'Fotos HD ilimitadas',
        'Anuncios destacados',
        'Estadisticas avanzadas',
        'Soporte prioritario',
        'Badge verificado',
      ],
      fr: [
        "Jusqu'a 20 annonces",
        'Photos HD illimitees',
        'Annonces en vedette',
        'Statistiques avancees',
        'Support prioritaire',
        'Badge verifie',
      ],
    },
    agencia: {
      es: [
        'Anuncios ilimitados',
        'Todas las funciones Pro',
        'Panel de agencia',
        'API de integracion',
        'Agente dedicado',
        'Marca personalizada',
        'Reportes mensuales',
      ],
      fr: [
        'Annonces illimitees',
        'Toutes les fonctions Pro',
        "Panneau d'agence",
        "API d'integration",
        'Agent dedie',
        'Marque personnalisee',
        'Rapports mensuels',
      ],
    },
  };

  const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error'> = {
    activo: 'success',
    expirado: 'error',
    cancelado: 'warning',
  };

  const statusLabels: Record<string, Record<string, string>> = {
    activo: { es: 'Activo', fr: 'Actif' },
    expirado: { es: 'Expirado', fr: 'Expire' },
    cancelado: { es: 'Cancelado', fr: 'Annule' },
  };

  if (subLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {locale === 'es' ? 'Suscripcion' : 'Abonnement'}
      </h1>

      {/* Current Subscription */}
      <Card
        header={
          <h2 className="text-lg font-semibold text-gray-900">
            {locale === 'es' ? 'Plan actual' : 'Plan actuel'}
          </h2>
        }
        padding="md"
      >
        {subscription ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">{subscription.plan.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={statusBadgeVariant[subscription.status] || 'default'}>
                  {statusLabels[subscription.status]?.[locale as string] || subscription.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  {locale === 'es' ? 'Expira' : 'Expire'}:{' '}
                  {new Date(subscription.expires_at).toLocaleDateString(
                    locale === 'es' ? 'es-ES' : 'fr-FR'
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              {locale === 'es'
                ? 'No tienes una suscripcion activa. Elige un plan para comenzar.'
                : "Vous n'avez pas d'abonnement actif. Choisissez un plan pour commencer."}
            </p>
          </div>
        )}
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {locale === 'es' ? 'Planes disponibles' : 'Plans disponibles'}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {activePlans.map((plan) => {
            const priceXaf = Number(plan.price_xaf);
            // Support features from DB (dict with locale keys) or hardcoded fallback
            const dbFeatures = !Array.isArray(plan.features) && plan.features
              ? (plan.features as Record<string, string[]>)[locale as string]
              : null;
            const features = dbFeatures ||
              planFeatures[plan.slug]?.[locale as 'es' | 'fr'] ||
              (Array.isArray(plan.features) ? plan.features : []);
            const isCurrentPlan = subscription?.plan?.id === plan.id;
            const isPopular = plan.slug === 'profesional';

            return (
              <Card
                key={plan.id}
                padding="none"
                className={`relative ${isPopular ? 'border-blue-500 border-2 shadow-lg' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      {locale === 'es' ? 'Popular' : 'Populaire'}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {priceXaf === 0
                        ? (locale === 'es' ? 'Gratis' : 'Gratuit')
                        : new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
                            style: 'currency',
                            currency: 'XAF',
                            maximumFractionDigits: 0,
                          }).format(priceXaf)}
                    </span>
                    {priceXaf > 0 && (
                      <span className="ml-1 text-sm text-gray-500">
                        /{locale === 'es' ? 'mes' : 'mois'}
                      </span>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {isCurrentPlan ? (
                      <Button variant="outline" size="lg" className="w-full" disabled>
                        {locale === 'es' ? 'Plan actual' : 'Plan actuel'}
                      </Button>
                    ) : (
                      <Button
                        variant={isPopular ? 'primary' : 'outline'}
                        size="lg"
                        className="w-full"
                        onClick={() => handleSubscribe(plan)}
                      >
                        {priceXaf === 0
                          ? (locale === 'es' ? 'Comenzar gratis' : 'Commencer gratuitement')
                          : (locale === 'es' ? 'Suscribirse' : "S'abonner")}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPlan(null);
        }}
        title={locale === 'es' ? 'Metodo de pago' : 'Methode de paiement'}
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                {locale === 'es' ? 'Plan seleccionado' : 'Plan selectionne'}: {selectedPlan.name}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {Number(selectedPlan.price_xaf) === 0
                  ? (locale === 'es' ? 'Gratis' : 'Gratuit')
                  : new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
                      style: 'currency',
                      currency: 'XAF',
                      maximumFractionDigits: 0,
                    }).format(Number(selectedPlan.price_xaf))}
                {Number(selectedPlan.price_xaf) > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    /{locale === 'es' ? 'mes' : 'mois'}
                  </span>
                )}
              </p>
            </div>

            {Number(selectedPlan.price_xaf) > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {locale === 'es' ? 'Selecciona un metodo de pago' : 'Selectionnez une methode de paiement'}
                </p>

                <button
                  onClick={() => setPaymentMethod('bange_mobil')}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'bange_mobil'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Bange Mobil</p>
                    <p className="text-xs text-gray-500">BANGE Guinea Ecuatorial</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('rosa_money')}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'rosa_money'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Rosa Money</p>
                    <p className="text-xs text-gray-500">GETESA / Guinea Ecuatorial</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('muni_dinero')}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'muni_dinero'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Muni Dinero</p>
                    <p className="text-xs text-gray-500">Muni / Guinea Ecuatorial</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'tarjeta'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCardIcon className="h-6 w-6 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {locale === 'es' ? 'Tarjeta de credito/debito' : 'Carte de credit/debit'}
                    </p>
                    <p className="text-xs text-gray-500">Visa, Mastercard</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'transferencia'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BanknotesIcon className="h-6 w-6 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {locale === 'es' ? 'Transferencia bancaria' : 'Virement bancaire'}
                    </p>
                    <p className="text-xs text-gray-500">BANGE, CCEI, BGFI</p>
                  </div>
                </button>
              </div>
            )}

            {subscribeMutation.isError && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-sm text-red-600">{tCommon('error')}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPlan(null);
                }}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                variant="primary"
                loading={subscribeMutation.isPending}
                onClick={handleConfirmPayment}
              >
                {tCommon('confirm')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
