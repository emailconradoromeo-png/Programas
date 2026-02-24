'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EnvelopeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function VerifyPage() {
  const t = useTranslations('verify');
  const tAuth = useTranslations('auth');
  const { locale } = useParams<{ locale: string }>();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600"
        >
          <BuildingOfficeIcon className="h-8 w-8" />
          EGINMOTEG
        </Link>

        {/* Card */}
        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <EnvelopeIcon className="h-8 w-8 text-blue-600" />
          </div>

          {/* Title */}
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            {t('title')}
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-lg font-medium text-blue-600">
            {t('check_email')}
          </p>

          {/* Message */}
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {t('message')}
          </p>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200" />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                // Placeholder: resend verification email
              }}
            >
              <EnvelopeIcon className="mr-2 h-4 w-4" />
              {t('resend')}
            </Button>

            <Link href={`/${locale}/auth/login`} className="block">
              <Button variant="primary" size="md" className="w-full">
                {t('back_to_login')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-6 text-sm text-gray-500">
          {locale === 'es'
            ? 'Si no recibes el correo, revisa tu carpeta de spam o correo no deseado.'
            : 'Si vous ne recevez pas l\'e-mail, verifiez votre dossier spam ou courrier indesirable.'}
        </p>
      </div>
    </div>
  );
}
