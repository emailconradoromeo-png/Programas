'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es obligatorio'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await login(data.username, data.password);
      toast.success(t('login_success'));
      router.push(`/${locale}/dashboard`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('invalid_credentials');

      // Check for axios error structure
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const detail = axiosError?.response?.data?.detail;

      setServerError(detail || errorMessage);
      toast.error(t('login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600"
          >
            <BuildingOfficeIcon className="h-8 w-8" />
            EGINMOTEG
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {t('login_title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('no_account')}{' '}
            <Link
              href={`/${locale}/auth/register`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t('register_title')}
            </Link>
          </p>
        </div>

        {/* Form Card */}
        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {/* Server error display */}
          {serverError && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="ml-3 text-sm text-red-700">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <Input
              label={locale === 'es' ? 'Nombre de usuario' : "Nom d'utilisateur"}
              type="text"
              placeholder={locale === 'es' ? 'Tu nombre de usuario' : "Votre nom d'utilisateur"}
              autoComplete="username"
              error={errors.username?.message}
              {...register('username')}
            />

            {/* Password */}
            <Input
              label={t('password')}
              type="password"
              placeholder="********"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t('remember_me')}</span>
              </label>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {t('forgot_password')}
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {t('login_button')}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          {t('no_account')}{' '}
          <Link
            href={`/${locale}/auth/register`}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t('register_button')}
          </Link>
        </p>
      </div>
    </div>
  );
}
