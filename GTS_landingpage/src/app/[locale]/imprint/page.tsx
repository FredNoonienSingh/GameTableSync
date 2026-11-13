// Imprint Page

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Container, Title, Text, Paper, Stack, Divider, Box, Anchor } from '@mantine/core';
import { AnimatedBackground, LandingNavbar, SimpleHeader, Footer } from '@gts/ui';

export default function ImprintPage() {
  const t = useTranslations('ImprintPage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

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
          <Title
            order={1}
             
            className="brand-logo"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              textShadow: '0 4px 25px rgba(24, 100, 255, 0.35)',
            }}
          >
            {t('title')}
          </Title>

          <Paper
            p={{ base: 'lg', sm: 'xl' }}
            radius="md"
            style={{
              backgroundColor: 'rgba(20, 22, 27, 0.88)',
              border: '1px solid rgba(24, 100, 255, 0.25)',
              borderLeft: '4px solid #1864ff',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack gap="lg">
              {/* 1. § 5 DDG Provider Identification */}
              <Box>
                <Title order={3}   size="h4" mb="xs" className="brand-logo">
                  {t('ddgTitle')}
                </Title>
                <Text c="gray.3" lh={1.6}>
                  GameTableSync<br />
                  Frederic Baumeister<br />
                  {/* TODO: Replace with your exact street and house number */}
                   Merklingerstraße 9<br />
                  71263 Weil der Stadt<br />
                  {t('country')}
                </Text>
              </Box>

              <Divider color="rgba(255, 255, 255, 0.08)" />

              {/* 2. Contact */}
              <Box>
                <Title order={3}   size="h4" mb="xs" className="brand-logo">
                  {t('contactTitle')}
                </Title>
                <Text c="gray.3" lh={1.6}>
                  {t('phoneLabel')}: +49 155 61946155<br />
                  {t('emailLabel')}:{' '}
                  <Anchor href="mailto:contact@gametablesync.com" c="cyan.4">
                    contact@gametablesync.com
                  </Anchor>
                </Text>
              </Box>

              <Divider color="rgba(255, 255, 255, 0.08)" />

              {/*
              <Box>
                <Title order={3}   size="h4" mb="xs" className="brand-logo">
                  {t('vatTitle')}
                </Title>
                <Text c="gray.3" size="sm" lh={1.6}>
                  {t('vatText')}
                </Text>
              </Box>

              <Divider color="rgba(255, 255, 255, 0.08)" />
              */}

              <Box>
                <Title order={3}   size="h4" mb="xs" className="brand-logo">
                  {t('editorialTitle')}
                </Title>
                <Text c="gray.3" size="sm" lh={1.6}>
                  Frederic Baumeister<br />
                  Merklingerstraße 9<br />
                  71263 Weil der Stadt
                </Text>
              </Box>

              <Divider color="rgba(255, 255, 255, 0.08)" />

              {/* 5. Dispute Resolution */}
              <Box>
                <Title order={3}   size="h4" mb="xs" className="brand-logo">
                  {t('disputeTitle')}
                </Title>
                <Text c="gray.4" size="sm" lh={1.6}>
                  {t('disputeText')}
                </Text>
              </Box>

              <Divider color="rgba(255, 255, 255, 0.08)" />

              {/* 6. Liability for Content & Links */}
              <Box>
                <Title order={3}   size="h4" mb="xs" className="brand-logo">
                  {t('liabilityTitle')}
                </Title>
                <Text c="gray.4" size="sm" lh={1.6}>
                  {t('liabilityText')}
                </Text>
              </Box>
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