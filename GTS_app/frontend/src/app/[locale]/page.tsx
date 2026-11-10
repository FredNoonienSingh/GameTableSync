'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Container, Title, Text, Button, Group, Stack, Paper, SimpleGrid, ThemeIcon, Box } from '@mantine/core';
import { IconSwords, IconShield, IconTrophy, IconArrowRight } from '@tabler/icons-react';
import { AnimatedBackground, AppHeader, Footer } from '@gts/ui';

export default function AppPage() {
  const t = useTranslations('App');
  const locale = useLocale();

  return (
    <Box
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
    >
      <AnimatedBackground />

      <AppHeader
        locale={locale}
        labels={{
          dashboard: t('nav.dashboard'),
          tabletop: t('nav.tabletop'),
          ttSystems: t('nav.ttSystems'),
          ttCampaign: t('nav.ttCampaign'),
          ttRoster: t('nav.ttRoster'),
          rpg: t('nav.rpg'),
          rpgSheets: t('nav.rpgSheets'),
          rpgWorldmap: t('nav.rpgWorldmap'),
          rpgSessions: t('nav.rpgSessions'),
          tcg: t('nav.tcg'),
          tcgDecks: t('nav.tcgDecks'),
          tcgCompanion: t('nav.tcgCompanion'),
          tcgPods: t('nav.tcgPods'),
          gameFinder: t('nav.gameFinder'),
          account: t('nav.account'),
        }}
      />

      <Box component="main" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Container size="lg" py={{ base: 40, md: 80 }}>
          {/* Hero Section */}
          <Stack align="center" ta="center" gap="md" mb={60}>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '4px',
                backgroundColor: 'rgba(24, 100, 255, 0.15)',
                border: '1px solid rgba(24, 100, 255, 0.4)',
              }}
            >
              <Text
                size="xs"
                c="brandCyan.4"
                fw={700}
                className="brand-logo"
                style={{ letterSpacing: '0.15em' }}
              >
                {t('home.badge')}
              </Text>
            </div>

            <Title
              order={1}
              c="white"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                lineHeight: 1.1,
              }}
            >
              {t('home.title')}
            </Title>
            <Text size="lg" c="gray.4" maw={650} lh={1.6}>
              {t('home.subtitle')}
            </Text>

            <Group gap="md" mt="sm">
              <Button
                component={Link}
                href={`/${locale}/tournaments`}
                size="lg"
                color="brandBlue.6"
                rightSection={<IconArrowRight size={18} />}
              >
                {t('home.ctaTournaments')}
              </Button>
              <Button
                component={Link}
                href={`/${locale}/game-finder`}
                size="lg"
                variant="outline"
                color="brandBlue.4"
              >
                {t('home.ctaGameFinder')}
              </Button>
            </Group>
          </Stack>

          {/* Feature Grid */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            <HomeCard
              icon={<IconSwords size={24} />}
              title={t('home.cardMatchmakingTitle')}
              description={t('home.cardMatchmakingDesc')}
            />
            <HomeCard
              icon={<IconTrophy size={24} />}
              title={t('home.cardTournamentsTitle')}
              description={t('home.cardTournamentsDesc')}
            />
            <HomeCard
              icon={<IconShield size={24} />}
              title={t('home.cardArmyViewerTitle')}
              description={t('home.cardArmyViewerDesc')}
            />
          </SimpleGrid>
        </Container>
      </Box>

      <Footer
        imprintHref={`/${locale}/imprint`}
        privacyHref={`/${locale}/privacy`}
        termsHref={`/${locale}/terms`}
        labels={{
          rights: t('footer.copyright'),
          imprint: t('footer.imprint'),
          privacy: t('footer.privacy'),
          terms: t('footer.terms'),
        }}
      />
    </Box>
  );
}

function HomeCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Paper p="xl" radius="md" style={{ height: '100%' }}>
      <Stack gap="md">
        <ThemeIcon
          size={48}
          radius="md"
          color="brandBlue.6"
          variant="light"
          style={{ backgroundColor: 'rgba(24, 100, 255, 0.15)' }}
        >
          {icon}
        </ThemeIcon>
        <Title order={3} c="white" style={{ fontSize: '1.25rem' }}>
          {title}
        </Title>
        <Text size="sm" c="gray.4" lh={1.5}>
          {description}
        </Text>
      </Stack>
    </Paper>
  );
}