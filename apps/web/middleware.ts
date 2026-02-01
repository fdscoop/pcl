import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle locale-specific routes
  if (pathname.startsWith('/en') || pathname.startsWith('/ml')) {
    return intlMiddleware(request);
  }
  
  // For other paths, check if there's a language cookie/header preference
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
  
  // Set the locale in request headers for the app to use
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  
  return response;
}

export const config = {
  // Match paths that need i18n handling
  matcher: ['/', '/(en|ml)/:path*']
};
