import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'localhost', '127']);

export function proxy(request: NextRequest) {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  // Detect custom club/store subdomain: e.g. slug.gametablesync.com or slug.localhost
  let subdomain: string | null = null;
  if (host.endsWith('.gametablesync.com')) {
    const sub = host.replace('.gametablesync.com', '');
    if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub)) {
      subdomain = sub;
    }
  } else if (host.endsWith('.localhost')) {
    const sub = host.replace('.localhost', '');
    if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub)) {
      subdomain = sub;
    }
  }

  if (subdomain) {
    // If hitting root or locale root on slug.gametablesync.com, rewrite to /[locale]/s/[slug]
    if (pathname === '/' || pathname === '/de' || pathname === '/en') {
      const locale = pathname === '/en' ? 'en' : routing.defaultLocale;
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/s/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/', '/(de|en)/:path*'],
};
