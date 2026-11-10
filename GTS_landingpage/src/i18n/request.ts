import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['de', 'en'];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  if (!locale || !locales.includes(locale)) notFound();

  const [intro, features, subpages] = await Promise.all([
    import(`../../messages/${locale}/intro.json`),
    import(`../../messages/${locale}/features.json`),
    import(`../../messages/${locale}/subpages.json`),
  ]);

  return {
    locale,
    messages: {
      HomePage: {
        ...intro.default,
        ...features.default,
        ...subpages.default,
      },
    },
  };
});