import '@mantine/core/styles.css';
import '@gts/ui/styles.css'; // Ensure global tokens load in SSR head, not lazily via client components
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
      {...mantineHtmlProps}
      lang={locale}
      data-mantine-color-scheme="dark"
      data-locales={routing.locales.join(',')}
      className={`${orbitron.className} ${orbitron.variable}`}
      style={{ backgroundColor: '#0f100c', colorScheme: 'dark' }}
    >
      <head>
        {/* Critical First-Paint Style: Guarantees #0f100c before external CSS chunks parse */}
        <style>{`
          :root, html[data-mantine-color-scheme="dark"], html:not([data-mantine-color-scheme="light"]) {
            --gts-bg-canvas: #0f100c;
            --gts-text-body: #e9ecef;
            background-color: #0f100c;
            color-scheme: dark;
          }
          html[data-mantine-color-scheme="light"] {
            --gts-bg-canvas: #f4f6fb;
            --gts-text-body: #1e293b;
            background-color: #f4f6fb;
            color-scheme: light;
          }
          body {
            background-color: var(--gts-bg-canvas) !important;
            color: var(--gts-text-body) !important;
            margin: 0;
          }
          .brand-logo {
            font-family: var(--font-orbitron), 'Orbitron', sans-serif;
          }
        `}</style>
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            {children}
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}