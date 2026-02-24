import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['es', 'fr'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

export const config = {
  matcher: ['/', '/(es|fr)/:path*'],
};
