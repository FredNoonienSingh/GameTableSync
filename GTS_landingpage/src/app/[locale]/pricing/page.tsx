'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { animate, useMotionValue } from 'framer-motion';
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
import {
  AnimatedBackground,
  LandingNavbar,
  SimpleHeader,
  PriceDetail,
  Footer,
  OutpostGraphic,
  StrongholdGraphic,
  CitadelGraphic,
  FortressOfTerraGraphic,
} from '@gts/ui';

export default function PricingPage() {
  const t = useTranslations('PricingPage');
  const tNavbar = useTranslations('HomePage.Navbar');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

  const tierProgress = useMotionValue(0);

  useEffect(() => {
    const controls = animate(tierProgress, [0, 1, 0], {
      duration: 10,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => controls.stop();
  }, [tierProgress]);

  const monthlyLabel = t.has('billingToggle.monthly') ? t('billingToggle.monthly') : 'Monthly';
  const yearlyLabel = t.has('billingToggle.yearly') ? t('billingToggle.yearly') : 'Yearly';

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

      <Container size="xl" py={{ base: 40, md: 70 }} style={{ flex: 1, position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <Stack align="center" ta="center" gap="md" mb={{ base: 35, md: 50 }}>
          <Badge color="brandBlue.5" variant="outline" size="lg">
            {t('badge')}
          </Badge>
          <Title
            order={1}
             
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

          {/* Optional Early-Bird Global Promo Banner */}
          {t.has('promoBanner') && (
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
          )}
        </Stack>

        {/* 1. Free Forever for Players Callout Banner 
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
            <Grid span={{ base: 12, md: 8 }}>
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
                   
                  className="brand-logo"
                  style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)' }}
                >
                  {t('playerFree.title')}
                </Title>
                <Text size="sm" c="gray.3" lh={1.6}>
                  {t('playerFree.description')}
                </Text>
              </Stack>
            </Grid>
            <Grid>
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
            </Grid>
          </Grid>
        </Paper>
        */}

        {/* 2. Four Club/Store Pricing Tiers: Outpost, Stronghold, Citadel, Fortress of Terra */}
        <Grid gap="lg" align="stretch">
          {/* Tier 1: OUTPOST (Cyan Border) */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <PriceDetail
              graphic={
                <OutpostGraphic
                  progress={tierProgress}
                  primaryColor="#1864ff"
                  accentColor="#29d4ff"
                />
              }
              badge={t('tier1.badge')}
              title={t('tier1.title')}
              price={t('tier1.price')}
              period={t('tier1.period')}
              yearlyPrice={t.has('tier1.yearlyPrice') ? t('tier1.yearlyPrice') : undefined}
              yearlyPeriod={t.has('tier1.yearlyPeriod') ? t('tier1.yearlyPeriod') : undefined}
              monthlyLabel={monthlyLabel}
              yearlyLabel={yearlyLabel}
              billingNote={t.has('tier1.billingNote') ? t('tier1.billingNote') : undefined}
              promoNote={t.has('tier1.promo') ? t('tier1.promo') : undefined}
              subNote={t.has('tier1.subNote') ? t('tier1.subNote') : undefined}
              description={t('tier1.description')}
              features={[t('tier1.f1'), t('tier1.f2'), t('tier1.f3'), t('tier1.f4')]}
              borderColor="#29d4ff"
              ctaLabel={t('tier1.cta')}
              ctaHref={`/${locale}/demo`}
            />
          </Grid.Col>

          {/* Tier 2: STRONGHOLD (Brand Blue Border) */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <PriceDetail
              graphic={
                <StrongholdGraphic
                  progress={tierProgress}
                  primaryColor="#1864ff"
                  accentColor="#29d4ff"
                />
              }
              badge={t('tier2.badge')}
              title={t('tier2.title')}
              price={t('tier2.price')}
              period={t('tier2.period')}
              yearlyPrice={t.has('tier2.yearlyPrice') ? t('tier2.yearlyPrice') : undefined}
              yearlyPeriod={t.has('tier2.yearlyPeriod') ? t('tier2.yearlyPeriod') : undefined}
              monthlyLabel={monthlyLabel}
              yearlyLabel={yearlyLabel}
              billingNote={t.has('tier2.billingNote') ? t('tier2.billingNote') : undefined}
              promoNote={t.has('tier2.promo') ? t('tier2.promo') : undefined}
              subNote={t.has('tier2.subNote') ? t('tier2.subNote') : undefined}
              description={t('tier2.description')}
              features={[t('tier2.f1'), t('tier2.f2'), t('tier2.f3'), t('tier2.f4')]}
              borderColor="#1864ff"
              ctaLabel={t('tier2.cta')}
              ctaHref={`/${locale}/demo`}
            />
          </Grid.Col>

          {/* Tier 3: CITADEL (Violet / Arcane Border) */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <PriceDetail
              graphic={
                <CitadelGraphic
                  progress={tierProgress}
                  primaryColor="#7c3aed"
                  accentColor="#c084fc"
                />
              }
              badge={t('tier3.badge')}
              title={t('tier3.title')}
              price={t('tier3.price')}
              period={t('tier3.period')}
              yearlyPrice={t.has('tier3.yearlyPrice') ? t('tier3.yearlyPrice') : undefined}
              yearlyPeriod={t.has('tier3.yearlyPeriod') ? t('tier3.yearlyPeriod') : undefined}
              monthlyLabel={monthlyLabel}
              yearlyLabel={yearlyLabel}
              billingNote={t.has('tier3.billingNote') ? t('tier3.billingNote') : undefined}
              promoNote={t.has('tier3.promo') ? t('tier3.promo') : undefined}
              subNote={t.has('tier3.subNote') ? t('tier3.subNote') : undefined}
              description={t('tier3.description')}
              features={[t('tier3.f1'), t('tier3.f2'), t('tier3.f3'), t('tier3.f4')]}
              borderColor="#a855f7"
              ctaLabel={t('tier3.cta')}
              ctaHref={`/${locale}#contact`}
            />
          </Grid.Col>

          {/* Tier 4: FORTRESS OF TERRA (Imperial Gold / Amber Border - No Yearly Toggle or Promo) */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <PriceDetail
              graphic={
                <FortressOfTerraGraphic
                  progress={tierProgress}
                  primaryColor="#d97706"
                  accentColor="#fde047"
                />
              }
              badge={t('tier4.badge')}
              title={t('tier4.title')}
              price={t('tier4.price')}
              period={t('tier4.period')}
              yearlyPrice={t.has('tier4.yearlyPrice') ? t('tier4.yearlyPrice') : undefined}
              yearlyPeriod={t.has('tier4.yearlyPeriod') ? t('tier4.yearlyPeriod') : undefined}
              monthlyLabel={monthlyLabel}
              yearlyLabel={yearlyLabel}
              billingNote={t.has('tier4.billingNote') ? t('tier4.billingNote') : undefined}
              promoNote={t.has('tier4.promo') ? t('tier4.promo') : undefined}
              subNote={t.has('tier4.subNote') ? t('tier4.subNote') : undefined}
              description={t('tier4.description')}
              features={[t('tier4.f1'), t('tier4.f2'), t('tier4.f3'), t('tier4.f4')]}
              borderColor="#f59f00"
              ctaLabel={t('tier4.cta')}
              ctaHref={`/${locale}#contact`}
            />
          </Grid.Col>
        </Grid>

        {/* 3. Setup & Legacy Data Migration Section */}
        <Box mt={{ base: 50, md: 80 }}>
          <Title
            order={2}
             
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

                  <Title order={3}   className="brand-logo" style={{ fontSize: '1.25rem' }}>
                    {t('services.setup.title')}
                  </Title>

                  <Box>
                    <Text component="span"   fw={700} className="brand-logo" style={{ fontSize: '1.75rem' }}>
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

                  <Title order={3}   className="brand-logo" style={{ fontSize: '1.25rem' }}>
                    {t('services.migration.title')}
                  </Title>

                  <Box>
                    <Text component="span"   fw={700} className="brand-logo" style={{ fontSize: '1.75rem' }}>
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