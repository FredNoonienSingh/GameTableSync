// Terms Page

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Container, Title, Text, Paper, Stack, Divider, Box } from '@mantine/core';
import { AnimatedBackground, LandingNavbar, SimpleHeader, Footer } from '@gts/ui';

export default function TermsPage() {
  const t = useTranslations('TermsPage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

  const sections = [
    'scope',
    'services',
    'conduct',
    'suspension',
    'pricing',
    'liability',
    'final',
  ] as const;

  return (
    <main
      style={{
        position: 'relative',
        overflowX: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LandingNavbar />
      <AnimatedBackground />
      <SimpleHeader href={`/${locale}`} />

      <Container size="md" py={{ base: 60, md: 100 }} style={{ flex: 1, position: 'relative', zIndex: 2 }}>
        <Stack gap="xl">
          <Box>
            <Title
              order={1}
              c="white"
              className="brand-logo"
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                textShadow: '0 4px 25px rgba(24, 100, 255, 0.35)',
              }}
            >
              {t('title')}
            </Title>
            <Text size="sm" c="gray.4" mt="xs">
              {t('lastUpdated')}
            </Text>
          </Box>

          <Paper
            p={{ base: 'lg', sm: 'xl' }}
            radius="md"
            style={{
              backgroundColor: 'rgba(20, 22, 27, 0.88)',
              border: '1px solid rgba(24, 100, 255, 0.25)',
              borderLeft: '4px solid #f59f00',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack gap="lg">
              <Text c="gray.3" size="sm" lh={1.7}>
                {t('intro')}
              </Text>

              {sections.map((key) => (
                <Box key={key}>
                  <Divider color="rgba(255, 255, 255, 0.08)" mb="lg" />
                  <Title order={3} c="white" size="h4" mb="xs" className="brand-logo">
                    {t(`${key}.title`)}
                  </Title>
                  <Text c="gray.3" size="sm" lh={1.7} style={{ whiteSpace: 'pre-line' }}>
                    {t(`${key}.text`)}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <Footer
        imprintHref={`/${locale}/imprint`}
        privacyHref={`/${locale}/privacy`}
        termsHref={`/${locale}/terms`}
        labels={{
          rights: tFooter('copyright'),
          imprint: tFooter('imprint'),
          privacy: tFooter('privacy'),
          terms: tFooter('terms'),
        }}
      />
    </main>
  );
}