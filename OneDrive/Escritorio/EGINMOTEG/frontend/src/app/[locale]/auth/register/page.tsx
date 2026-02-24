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

const registerSchema = z
  .object({
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
    email: z.string().email('Correo electronico invalido'),
    first_name: z.string().min(1, 'El nombre es obligatorio'),
    last_name: z.string().min(1, 'El apellido es obligatorio'),
    phone: z.string().optional(),
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
    password_confirm: z.string().min(1, 'Confirma tu contrasena'),
    role: z.enum(['propietario', 'inquilino', 'agente'], {
      errorMap: () => ({ message: 'Selecciona un rol' }),
    }),
    language: z.enum(['es', 'fr'], {
      errorMap: () => ({ message: 'Selecciona un idioma' }),
    }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Las contrasenas no coinciden',
    path: ['password_confirm'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      password_confirm: '',
      role: 'inquilino',
      language: locale === 'fr' ? 'fr' : 'es',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await registerUser({
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || undefined,
        password: data.password,
        password_confirm: data.password_confirm,
        role: data.role,
        language: data.language,
      });

      toast.success(t('register_success'));
      router.push(`/${locale}/auth/login`);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: Record<string, string | string[]> };
      };
      const responseData = axiosError?.response?.data;

      if (responseData) {
        // Combine all field errors into a single message
        const messages = Object.entries(responseData)
          .map(([field, msg]) => {
            const message = Array.isArray(msg) ? msg.join(', ') : msg;
            return `${field}: ${message}`;
          })
          .join('. ');
        setServerError(messages);
      } else {
        setServerError(t('register_error'));
      }

      toast.error(t('register_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    {
      value: 'inquilino',
      label: locale === 'es' ? 'Inquilino' : 'Locataire',
      desc: locale === 'es' ? 'Busco propiedades para alquilar o comprar' : 'Je cherche des proprietes a louer ou acheter',
    },
    {
      value: 'propietario',
      label: locale === 'es' ? 'Propietario' : 'Proprietaire',
      desc: locale === 'es' ? 'Tengo propiedades para publicar' : 'J\'ai des proprietes a publier',
    },
    {
      value: 'agente',
      label: locale === 'es' ? 'Agente inmobiliario' : 'Agent immobilier',
      desc: locale === 'es' ? 'Soy profesional del sector' : 'Je suis professionnel du secteur',
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
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
            {t('register_title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('has_account')}{' '}
            <Link
              href={`/${locale}/auth/login`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t('login_title')}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('first_name')}
                type="text"
                placeholder={locale === 'es' ? 'Tu nombre' : 'Votre prenom'}
                autoComplete="given-name"
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                label={t('last_name')}
                type="text"
                placeholder={locale === 'es' ? 'Tu apellido' : 'Votre nom'}
                autoComplete="family-name"
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>

            {/* Username */}
            <Input
              label={locale === 'es' ? 'Nombre de usuario' : "Nom d'utilisateur"}
              type="text"
              placeholder={locale === 'es' ? 'Elige un nombre de usuario' : "Choisissez un nom d'utilisateur"}
              autoComplete="username"
              error={errors.username?.message}
              {...register('username')}
            />

            {/* Email */}
            <Input
              label={t('email')}
              type="email"
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Phone */}
            <Input
              label={t('phone')}
              type="tel"
              placeholder="+240 222 123 456"
              autoComplete="tel"
              helperText={locale === 'es' ? 'Opcional' : 'Optionnel'}
              error={errors.phone?.message}
              {...register('phone')}
            />

            {/* Role selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {locale === 'es' ? 'Tipo de cuenta' : 'Type de compte'}
              </label>
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('role')}
                    />
                    <div>
                      <span className="block text-sm font-medium text-gray-900">
                        {option.label}
                      </span>
                      <span className="block text-xs text-gray-500">{option.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Language selection */}
            <div>
              <label
                htmlFor="language"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {locale === 'es' ? 'Idioma preferido' : 'Langue preferee'}
              </label>
              <select
                id="language"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('language')}
              >
                <option value="es">Espanol</option>
                <option value="fr">Francais</option>
              </select>
              {errors.language && (
                <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
              )}
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('password')}
                type="password"
                placeholder="********"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label={t('confirm_password')}
                type="password"
                placeholder="********"
                autoComplete="new-password"
                error={errors.password_confirm?.message}
                {...register('password_confirm')}
              />
            </div>

            {/* Terms notice */}
            <p className="text-xs text-gray-500">
              {locale === 'es'
                ? 'Al registrarte, aceptas nuestros Terminos de Servicio y Politica de Privacidad.'
                : "En vous inscrivant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialite."}
            </p>

            {/* Submit */}
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {t('register_button')}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          {t('has_account')}{' '}
          <Link
            href={`/${locale}/auth/login`}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t('login_button')}
          </Link>
        </p>
      </div>
    </div>
  );
}
