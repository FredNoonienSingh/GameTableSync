'use client';

import type { CSSProperties } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Container, Paper, Stack, Group, Badge, Title, Text, Box } from '@mantine/core';
import {
  IconSwords,
  IconCards,
  IconDice2,
  IconSparkles,
} from '@tabler/icons-react';
import {
  AnimatedBackground,
  LandingNavbar,
  TabbedShowcase,
  Footer,
  type TabbedShowcaseItem,
} from '@gts/ui';

import { WargamingTab } from './tabs/WargamingTab';
import { TcgTab } from './tabs/TcgTab';
import { RpgTab } from './tabs/RpgTab';

export default function PlayersPage() {
  const t = useTranslations('PlayersPage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

  const playerTabs: TabbedShowcaseItem[] = [
    {
      value: 'wargaming',
      label: t('tabs.wargaming'),
      icon: <IconSwords size={18} />,
      color: '#1864ff',
      content: () => <WargamingTab />,
    },
    {
      value: 'tcg',
      label: t('tabs.tcg'),
      icon: <IconCards size={18} />,
      color: '#7c3aed',
      content: () => <TcgTab />,
    },
    {
      value: 'rpg',
      label: t('tabs.rpg'),
      icon: <IconDice2 size={18} />,
      color: '#d97706',
      content: () => <RpgTab />,
    },
  ];

  return (
    <main style={{ position: 'relative', overflowX: 'clip', minHeight: '100vh' }}>
      <LandingNavbar />
      <AnimatedBackground />

      <Box component="section" pt={{ base: 110, md: 140 }} pb={{ base: 20, md: 30 }} style={{ position: 'relative', zIndex: 2 }}>
        <Container size="lg">
          <Stack align="center" ta="center" gap="md" mb="xl">
            <Badge variant="outline" size="lg" className="brand-logo gts-game-meta-tag">
              {t('hero.badge')}
            </Badge>
            <Title order={1} className="brand-logo gts-section-intro-title">
              {t('hero.title')}
            </Title>
            <Text size="lg" maw={680} style={{ color: 'var(--gts-text-secondary)' }}>
              {t('hero.subtitle')}
            </Text>
          </Stack>


        </Container>
      </Box>

      {/* 2. Dynamic Tabbed Showcase (Wargaming | TCG | RPG) */}
      <TabbedShowcase
        //badge={t('switcher.badge')}
        //title={t('switcher.title')}
        //subtitle={t('switcher.subtitle')}
        tabs={playerTabs}
        fullHeight
        containerSize="xl"
      />

      <Container size="xl" style={{ paddingBottom: 100 }}>
        <Paper
          p={{ base: 'lg', md: 'xl' }}
          radius="md"
          className="gts-price-card"
          style={{ '--card-color': 'var(--gts-accent)' } as CSSProperties}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Stack gap={6} style={{ flex: 1, minWidth: 260 }}>
              <Group gap="xs">
                <Badge
                  variant="outline"
                  size="sm"
                  leftSection={<IconSparkles size={12} />}
                  className="brand-logo gts-game-badge"
                >
                  {t('promise.badge')}
                </Badge>
                <Badge variant="outline" size="sm" className="brand-logo gts-game-meta-tag">
                  0,00 € FOREVER
                </Badge>
              </Group>
              <Title order={3} className="brand-logo gts-army-title">
                {t('promise.title')}
              </Title>
              <Text size="sm" style={{ color: 'var(--gts-text-secondary)', lineHeight: 1.6 }}>
                {t('promise.description')}
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Container>

      {/* 3. Footer */}
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