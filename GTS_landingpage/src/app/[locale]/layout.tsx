import '@mantine/core/styles.css';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MantineProvider, mantineHtmlProps } from '@mantine/core';
import { theme } from '@gts/ui';
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-orbitron',
});

export default async function RootLayout({
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
    <html
      lang={locale}
      className={`${orbitron.className} ${orbitron.variable}`}
      data-mantine-color-scheme="dark"
      suppressHydrationWarning
      {...mantineHtmlProps}
    >
      <head>
        <style>{`
          .brand-logo {
            font-family: var(--font-orbitron), 'Orbitron', sans-serif;
          }
        `}</style>
      </head>
      <body style={{ backgroundColor: '#0f100c', color: '#ffffff', margin: 0 }}>
        <NextIntlClientProvider messages={messages}>
          <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
            {children}
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}