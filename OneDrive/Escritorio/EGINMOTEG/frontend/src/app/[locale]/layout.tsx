import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatbotWidget from '@/components/ai/ChatbotWidget';
import Providers from './Providers';
import '@/styles/globals.css';

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'fr' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  const locales = ['es', 'fr'];

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <ChatbotWidget />
            <Footer locale={locale} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
