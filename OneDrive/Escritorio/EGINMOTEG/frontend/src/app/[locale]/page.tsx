import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  MapPinIcon,
  HomeModernIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import SearchBar from '@/components/search/SearchBar';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');

  return (
    <div className="bg-white">
      {/* ============================================= */}
      {/* Hero Section                                  */}
      {/* ============================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white" />
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-white" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <BuildingOfficeIcon className="h-4 w-4" />
              EGINMOTEG
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('hero_title')}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl">
              {t('hero_subtitle')}
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-10 max-w-2xl">
              <SearchBar className="shadow-xl" />
            </div>

            {/* Quick stats */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <HomeModernIcon className="h-5 w-5" />
                <span>500+ {t('properties_count')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                <span>9+ {locale === 'es' ? 'ciudades' : 'villes'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                <span>{locale === 'es' ? 'Plataforma verificada' : 'Plateforme verifiee'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#F9FAFB" />
          </svg>
        </div>
      </section>

      {/* ============================================= */}
      {/* Featured Properties Section                   */}
      {/* ============================================= */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('featured_title')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500">
              {t('featured_subtitle')}
            </p>
          </div>

          {/* Property cards placeholder grid */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image placeholder */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="flex h-full items-center justify-center">
                    <BuildingOffice2Icon className="h-16 w-16 text-gray-300" />
                  </div>
                  {/* Badge */}
                  <div className="absolute left-2 top-2">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {i % 3 === 0
                        ? locale === 'es' ? 'Venta' : 'Vente'
                        : i % 3 === 1
                          ? locale === 'es' ? 'Alquiler' : 'Location'
                          : locale === 'es' ? 'Vacacional' : 'Vacances'}
                    </span>
                  </div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <p className="text-lg font-bold text-blue-600">
                    {i % 3 === 0
                      ? '45.000.000 XAF'
                      : i % 3 === 1
                        ? '350.000 XAF/mes'
                        : '75.000 XAF/noche'}
                  </p>
                  <h3 className="mt-1 truncate text-sm font-semibold text-gray-900">
                    {locale === 'es' ? `Propiedad ${i} - Ejemplo` : `Propriete ${i} - Exemple`}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {i <= 2 ? 'Malabo' : i <= 4 ? 'Bata' : 'Oyala'}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>{i + 1} hab.</span>
                    <span>{Math.max(1, i - 1)} {locale === 'es' ? 'banos' : 'SdB'}</span>
                    <span>{80 + i * 20} m&sup2;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View all link */}
          <div className="mt-10 text-center">
            <Link
              href={`/${locale}/properties`}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {t('view_properties')}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* Cities Section                                */}
      {/* ============================================= */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('cities_title')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500">
              {t('cities_subtitle')}
            </p>
          </div>

          {/* City cards */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Malabo */}
            <Link
              href={`/${locale}/properties?city=Malabo`}
              className="group relative overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-blue-600">
                <div className="flex h-full items-center justify-center">
                  <MapPinIcon className="h-20 w-20 text-white/30" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white">{t('city_malabo')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  {t('city_malabo_desc')}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-300 group-hover:text-blue-200">
                  {t('explore')}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Bata */}
            <Link
              href={`/${locale}/properties?city=Bata`}
              className="group relative overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-400 to-emerald-600">
                <div className="flex h-full items-center justify-center">
                  <MapPinIcon className="h-20 w-20 text-white/30" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white">{t('city_bata')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  {t('city_bata_desc')}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-300 group-hover:text-emerald-200">
                  {t('explore')}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Oyala */}
            <Link
              href={`/${locale}/properties?city=Oyala`}
              className="group relative overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-amber-400 to-amber-600">
                <div className="flex h-full items-center justify-center">
                  <MapPinIcon className="h-20 w-20 text-white/30" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white">{t('city_oyala')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  {t('city_oyala_desc')}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-300 group-hover:text-amber-200">
                  {t('explore')}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* How It Works Section                          */}
      {/* ============================================= */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('how_it_works_title')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500">
              {t('how_it_works_subtitle')}
            </p>
          </div>

          {/* Steps */}
          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <MagnifyingGlassIcon className="h-8 w-8" />
              </div>
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md">
                1
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                {t('step1_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {t('step1_desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <ChatBubbleLeftRightIcon className="h-8 w-8" />
              </div>
              <div className="absolute -top-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md">
                2
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                {t('step2_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {t('step2_desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <ShieldCheckIcon className="h-8 w-8" />
              </div>
              <div className="absolute -top-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white shadow-md">
                3
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                {t('step3_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {t('step3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* CTA Section                                   */}
      {/* ============================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-blue-900 py-16 sm:py-20">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('cta_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-200">
            {t('cta_subtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/properties`}
              className="inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-colors hover:bg-gray-100"
            >
              {t('cta_button')}
            </Link>
            <Link
              href={`/${locale}/auth/register`}
              className="inline-flex items-center rounded-md border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              {t('cta_register')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
