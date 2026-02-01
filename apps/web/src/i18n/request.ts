import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // If no locale from URL, try to get from cookie or header
  if (!locale) {
    const cookieStore = await cookies();
    const headerStore = await headers();
    locale = cookieStore.get('NEXT_LOCALE')?.value || 
             headerStore.get('x-locale') || 
             routing.defaultLocale;
  }

  // Validate that the incoming locale is supported
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
