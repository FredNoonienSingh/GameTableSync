// Privacy page
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Container, Title, Text, Paper, Stack, Divider, Box, Anchor } from '@mantine/core';
import { AnimatedBackground, LandingNavbar, SimpleHeader, Footer } from '@gts/ui';

export default function PrivacyPage() {
  const t = useTranslations('PrivacyPage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

  const sections = [
    'controller',
    'hosting',
    'discord',
    'contact',
    'cookies',
    'rights',
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
              borderLeft: '4px solid #29d4ff',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack gap="lg">
              {/* Intro */}
              <Text c="gray.3" size="sm" lh={1.7}>
                {t('intro')}
              </Text>

              <Divider color="rgba(255, 255, 255, 0.08)" />

              {/* 1. Controller (Hardcoded address + translated labels) */}
              <Box>
                <Title order={3}   size="h4" mb="xs" className="brand-logo">
                  {t('controller.title')}
                </Title>
                <Text c="gray.3" size="sm" lh={1.7} mb="xs">
                  {t('controller.text')}
                </Text>
                <Text c="gray.2" size="sm" lh={1.6} fw={500}>
                  GameTableSync – Frederic Baumeister<br />

                  Merklingerstraße 9<br />
                  71263 Weil der Stadt<br />
                  E-Mail:{' '}
                  <Anchor href="mailto:contact@gametablesync.com" c="cyan.4">
                    info@gametablesync.com
                  </Anchor>
                </Text>
              </Box>

              {/* 2–6. Dynamic Sections */}
              {sections.slice(1).map((key) => (
                <Box key={key}>
                  <Divider color="rgba(255, 255, 255, 0.08)" mb="lg" />
                  <Title order={3}   size="h4" mb="xs" className="brand-logo">
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