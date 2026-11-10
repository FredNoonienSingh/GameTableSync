import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
 
export const routing = defineRouting({
  locales: ['en', 'de'],
  defaultLocale: 'en' // Fallback, falls jemand aus Frankreich kommt
});
 
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);