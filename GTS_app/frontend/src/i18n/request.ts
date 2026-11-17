import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const [baseMessages, Account] = await Promise.all([
    import(`../messages/${locale}.json`).catch(() => ({ default: {} })),
    import(`../../messages/${locale}/Account.json`),
  ]);

  return {
    locale,
    messages: {
      ...baseMessages.default,
      Account: {
        ...Account.default,
      },
    },
  };
});