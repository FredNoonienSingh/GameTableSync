'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Badge,
  Stack,
  Grid,
  Paper,
  Button,
  Group,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconSparkles,
  IconArrowRight,
  IconSettingsAutomation,
  IconDatabaseImport,
} from '@tabler/icons-react';
import { AnimatedBackground, LandingNavbar, SimpleHeader, PriceDetail, Footer } from '@gts/ui';

export default function PricingPage() {
  const t = useTranslations('PricingPage');
  const tNavbar = useTranslations('HomePage.Navbar')
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

      <Container size="lg" py={{ base: 40, md: 70 }} style={{ flex: 1, position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <Stack align="center" ta="center" gap="md" mb={{ base: 35, md: 50 }}>
          <Badge color="brandBlue.5" variant="outline" size="lg">
            {t('badge')}
          </Badge>
          <Title
            order={1}
            c="white"
            className="brand-logo"
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.75rem)',
              textShadow: '0 4px 25px rgba(24, 100, 255, 0.35)',
            }}
          >
            {t('title')}
          </Title>
          <Text size="lg" c="gray.4" maw={680}>
            {t('subtitle')}
          </Text>

          {/* Early-Bird Promo Banner */}
          <Paper
            px="lg"
            py="xs"
            radius="xl"
            mt="xs"
            style={{
              backgroundColor: 'rgba(41, 212, 255, 0.1)',
              border: '1px solid rgba(41, 212, 255, 0.4)',
            }}
          >
            <Text size="sm" c="cyan.3" fw={600} className="brand-logo" style={{ letterSpacing: '0.04em' }}>
              {t('promoBanner')}
            </Text>
          </Paper>
        </Stack>

        {/* 1. Free Forever for Players Callout Banner */}
        <Paper
          p={{ base: 'lg', sm: 'xl' }}
          radius="md"
          mb={{ base: 40, md: 60 }}
          style={{
            backgroundColor: 'rgba(15, 16, 12, 0.9)',
            border: '1px solid rgba(41, 212, 255, 0.35)',
            borderLeft: '4px solid #29d4ff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(41, 212, 255, 0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Grid align="center" gap="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="xs">
                <Group gap="xs">
                  <ThemeIcon
                    size="md"
                    radius="sm"
                    style={{ backgroundColor: 'rgba(41, 212, 255, 0.15)', color: '#29d4ff' }}
                  >
                    <IconSparkles size={16} />
                  </ThemeIcon>
                  <Badge color="cyan" variant="outline" size="sm">
                    {t('playerFree.badge')}
                  </Badge>
                </Group>
                <Title
                  order={3}
                  c="white"
                  className="brand-logo"
                  style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)' }}
                >
                  {t('playerFree.title')}
                </Title>
                <Text size="sm" c="gray.3" lh={1.6}>
                  {t('playerFree.description')}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                component="a"
                href={`/${locale}/players`}
                size="lg"
                radius="md"
                fullWidth
                rightSection={<IconArrowRight size={18} />}
                className="brand-logo"
                styles={{
                  root: {
                    backgroundColor: 'rgba(41, 212, 255, 0.15)',
                    border: '1px solid #29d4ff',
                    color: '#fff',
                    height: 'auto',
                    minHeight: '3rem',
                    padding: '0.6rem 1rem',
                  },
                  label: {
                    whiteSpace: 'normal',
                    textAlign: 'center',
                  },
                }}
              >
                {t('playerFree.cta')}
              </Button>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* 2. Three Club/Store Pricing Tiers: Outpost, Stronghold, Citadel */}
        <Grid gap="xl" align="stretch">
          {/* Tier 1: OUTPOST (Cyan Border) */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <PriceDetail
              badge={t('tier1.badge')}
              title={t('tier1.title')}
              price={t('tier1.price')}
              period={t('tier1.period')}
              promoNote={t('tier1.promo')}
              description={t('tier1.description')}
              features={[t('tier1.f1'), t('tier1.f2'), t('tier1.f3'), t('tier1.f4')]}
              borderColor="#29d4ff"
              ctaLabel={t('tier1.cta')}
              ctaHref={`/${locale}/demo`}
            />
          </Grid.Col>

          {/* Tier 2: STRONGHOLD (Brand Blue Border) */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <PriceDetail
              badge={t('tier2.badge')}
              title={t('tier2.title')}
              price={t('tier2.price')}
              period={t('tier2.period')}
              promoNote={t('tier2.promo')}
              description={t('tier2.description')}
              features={[t('tier2.f1'), t('tier2.f2'), t('tier2.f3'), t('tier2.f4')]}
              borderColor="#1864ff"
              ctaLabel={t('tier2.cta')}
              ctaHref={`/${locale}/demo`}
            />
          </Grid.Col>

          {/* Tier 3: CITADEL (Gold / Amber Border) */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <PriceDetail
              badge={t('tier3.badge')}
              title={t('tier3.title')}
              price={t('tier3.price')}
              period={t('tier3.period')}
              promoNote={t('tier3.promo')}
              description={t('tier3.description')}
              features={[t('tier3.f1'), t('tier3.f2'), t('tier3.f3'), t('tier3.f4')]}
              borderColor="#f59f00"
              ctaLabel={t('tier3.cta')}
              ctaHref={`/${locale}#contact`}
            />
          </Grid.Col>
        </Grid>

        {/* 3. Setup & Legacy Data Migration Section */}
        <Box mt={{ base: 50, md: 80 }}>
          <Title
            order={2}
            c="white"
            ta="center"
            mb="xl"
            className="brand-logo"
            style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}
          >
            {t('services.sectionTitle')}
          </Title>

          <Grid gap="xl" align="stretch">
            {/* Setup Card (€49.95 or Free with Annual) */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper
                p={{ base: 'lg', sm: 'xl' }}
                radius="md"
                h="100%"
                style={{
                  backgroundColor: 'rgba(15, 16, 12, 0.88)',
                  border: '1px solid rgba(24, 100, 255, 0.3)',
                  borderLeft: '4px solid #1864ff',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Badge color="brandBlue.5" variant="outline">
                      {t('services.setup.badge')}
                    </Badge>
                    <ThemeIcon
                      size="lg"
                      radius="md"
                      style={{ backgroundColor: 'rgba(24, 100, 255, 0.15)', color: '#1864ff' }}
                    >
                      <IconSettingsAutomation size={20} />
                    </ThemeIcon>
                  </Group>

                  <Title order={3} c="white" className="brand-logo" style={{ fontSize: '1.25rem' }}>
                    {t('services.setup.title')}
                  </Title>

                  <Box>
                    <Text component="span" c="white" fw={700} className="brand-logo" style={{ fontSize: '1.75rem' }}>
                      {t('services.setup.price')}
                    </Text>
                    <Text component="span" size="xs" c="cyan.3" ml="sm" fw={600}>
                      {t('services.setup.priceSub')}
                    </Text>
                  </Box>

                  <Text size="sm" c="gray.3" lh={1.6}>
                    {t('services.setup.description')}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Legacy Data Migration Card (from €99.95) */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper
                p={{ base: 'lg', sm: 'xl' }}
                radius="md"
                h="100%"
                style={{
                  backgroundColor: 'rgba(15, 16, 12, 0.88)',
                  border: '1px solid rgba(245, 159, 0, 0.3)',
                  borderLeft: '4px solid #f59f00',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Badge color="yellow.6" variant="outline">
                      {t('services.migration.badge')}
                    </Badge>
                    <ThemeIcon
                      size="lg"
                      radius="md"
                      style={{ backgroundColor: 'rgba(245, 159, 0, 0.15)', color: '#f59f00' }}
                    >
                      <IconDatabaseImport size={20} />
                    </ThemeIcon>
                  </Group>

                  <Title order={3} c="white" className="brand-logo" style={{ fontSize: '1.25rem' }}>
                    {t('services.migration.title')}
                  </Title>

                  <Box>
                    <Text component="span" c="white" fw={700} className="brand-logo" style={{ fontSize: '1.75rem' }}>
                      {t('services.migration.price')}
                    </Text>
                    <Text component="span" size="xs" c="gray.4" ml="sm">
                      {t('services.migration.priceSub')}
                    </Text>
                  </Box>

                  <Text size="sm" c="gray.3" lh={1.6}>
                    {t('services.migration.description')}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Box>
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