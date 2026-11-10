import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@gts/ui/styles.css';
import { MantineProvider, mantineHtmlProps } from '@mantine/core';
import { theme } from '@gts/ui';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Orbitron } from 'next/font/google';
import { routing } from '../../i18n/routing';
import { AuthProvider } from '../../context/AuthContext';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-orbitron',
});

export const metadata = {
  title: 'GameTableSync | Command Hub',
  description: 'Club & Tournament Management Engine',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} {...mantineHtmlProps} className={orbitron.variable} data-mantine-color-scheme="dark">
      <body style={{ backgroundColor: '#0f100c', color: '#ffffff', margin: 0 }}>
        <NextIntlClientProvider messages={messages}>
          <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
            <AuthProvider>{children}</AuthProvider>
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}