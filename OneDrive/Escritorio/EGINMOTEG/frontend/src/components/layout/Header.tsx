'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  MapIcon,
  HomeIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function Header() {
  const t = useTranslations('nav');
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const otherLocale = locale === 'es' ? 'fr' : 'es';

  // Build the path for locale switching: replace /es/ or /fr/ prefix
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const navLinks = [
    { href: `/${locale}`, label: t('home'), icon: HomeIcon },
    { href: `/${locale}/properties`, label: t('properties'), icon: BuildingOfficeIcon },
    { href: `/${locale}/map`, label: 'Mapa', icon: MapIcon },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-xl font-bold text-blue-600"
        >
          <BuildingOfficeIcon className="h-7 w-7" />
          EGINMOTEG
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Language switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setUserMenuOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <GlobeAltIcon className="h-4 w-4" />
              {locale.toUpperCase()}
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-1 w-24 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <Link
                  href={switchLocalePath}
                  onClick={() => setLangMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {otherLocale === 'es' ? 'Espanol' : 'Francais'}
                </Link>
              </div>
            )}
          </div>

          {/* Auth section */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setLangMenuOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <UserCircleIcon className="h-5 w-5" />
                {user.first_name || user.username}
                <ChevronDownIcon className="h-3 w-3" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('dashboard')}
                  </Link>
                  <Link
                    href={`/${locale}/dashboard/properties`}
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('my_properties')}
                  </Link>
                  <Link
                    href={`/${locale}/dashboard/messages`}
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('messages')}
                  </Link>
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('profile')}
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('admin')}
                    </Link>
                  )}
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/auth/login`}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Abrir menu</span>
          {mobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                  isActive(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-200 px-4 py-3">
            {/* Mobile language switch */}
            <Link
              href={switchLocalePath}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <GlobeAltIcon className="h-5 w-5" />
              {otherLocale === 'es' ? 'Espanol' : 'Francais'}
            </Link>
          </div>

          <div className="border-t border-gray-200 px-4 py-3">
            {isAuthenticated && user ? (
              <div className="space-y-1">
                <p className="px-3 py-1 text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href={`/${locale}/dashboard/properties`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('my_properties')}
                </Link>
                <Link
                  href={`/${locale}/dashboard/messages`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('messages')}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href={`/${locale}/auth/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
