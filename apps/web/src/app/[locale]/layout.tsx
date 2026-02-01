import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import '../globals.css';
import { ToastProvider } from '@/context/ToastContext';
import CapacitorInit from '@/components/CapacitorInit';

export const metadata: Metadata = {
  title: 'Professional Club League - PCL',
  description: 'A comprehensive platform for organizing professional sports leagues and tournaments',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  // Determine font family based on locale
  const fontFamily = locale === 'ml' 
    ? '"Noto Sans Malayalam", "Manjari", sans-serif'
    : '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return (
    <html lang={locale} className="light">
      <head>
        <meta name="theme-color" content="#0d1b3e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.sardine.ai https://browser.sentry-cdn.com; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://api.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com" />
        {/* Google Fonts for Malayalam */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;500;600;700;800&family=Manjari:wght@400;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body 
        className="w-full h-full min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100"
        style={{ colorScheme: 'light', fontFamily }}
      >
        <CapacitorInit>
          <NextIntlClientProvider messages={messages}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </NextIntlClientProvider>
        </CapacitorInit>
      </body>
    </html>
  );
}
