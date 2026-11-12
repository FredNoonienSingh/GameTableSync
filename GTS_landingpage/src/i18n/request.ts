import PrivacyPage from '@/app/[locale]/privacy/page';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['de', 'en'];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  if (!locale || !locales.includes(locale)) notFound();

  const [intro, features, subpages, 
      pricing ,common, imprint, 
      privacy, terms] = await Promise.all([
    import(`../../messages/${locale}/intro.json`),
    import(`../../messages/${locale}/features.json`),
    import(`../../messages/${locale}/subpages.json`),
    import(`../../messages/${locale}/pricing.json`),
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/legal/imprint.json`),
    import(`../../messages/${locale}/legal/privacy.json`),
    import(`../../messages/${locale}/legal/terms.json`),
  ]);

  return {
    locale,
    messages: {
      HomePage: {
        ...intro.default,
        ...features.default,
        ...subpages.default,
      },
      ImprintPage:{
        ...imprint.default,
      },
      PrivacyPage:{
        ...privacy.default,
      },
      TermsPage:{
        ...terms.default,
      },
      PricingPage:{
        ...pricing.default,
      },
      Common: {
        ...common.default,
      },
    },
  };
});