import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Matched alle Routen außer statische Dateien (_next, Bilder, etc.)
  matcher: ['/', '/(de|en)/:path*']
};