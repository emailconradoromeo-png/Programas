'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  HomeIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  UsersIcon,
  MegaphoneIcon,
  BanknotesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function Sidebar() {
  const t = useTranslations('nav');
  const tDash = useTranslations('dashboard');
  const tAdmin = useTranslations('admin');
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const { user } = useAuth();

  const mainNavItems: NavItem[] = [
    {
      href: `/${locale}/dashboard`,
      label: tDash('title'),
      icon: HomeIcon,
    },
    {
      href: `/${locale}/dashboard/properties`,
      label: t('my_properties'),
      icon: BuildingOfficeIcon,
    },
    {
      href: `/${locale}/dashboard/messages`,
      label: t('messages'),
      icon: ChatBubbleLeftRightIcon,
    },
    {
      href: `/${locale}/dashboard/subscription`,
      label: locale === 'es' ? 'Suscripcion' : 'Abonnement',
      icon: CreditCardIcon,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      href: `/${locale}/admin/users`,
      label: tAdmin('users'),
      icon: UsersIcon,
    },
    {
      href: `/${locale}/admin/listings`,
      label: tAdmin('properties'),
      icon: MegaphoneIcon,
    },
    {
      href: `/${locale}/admin/payments`,
      label: locale === 'es' ? 'Pagos' : 'Paiements',
      icon: BanknotesIcon,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* User info */}
      {user && (
        <div className="border-b border-gray-200 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <UserCircleIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.label}
          </Link>
        ))}

        {/* Admin section */}
        {user?.role === 'admin' && (
          <>
            <div className="pb-1 pt-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {tAdmin('title')}
              </p>
            </div>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
