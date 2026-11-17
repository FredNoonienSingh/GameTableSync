'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Tabs,
  Select,
  ActionIcon,
  Divider,
  SegmentedControl,
} from '@mantine/core';
import {
  IconSettingsAutomation,
  IconDatabaseImport,
  IconBuildingStore,
  IconPlus,
  IconTrash,
  IconSparkles,
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

interface BackendTierDto {
  key: string;
  rank: number;
  name: string;
  display_label: string;
  is_commercial: boolean;
  allow_in_combined: boolean;
  purchase_mode: 'checkout' | 'contact_only';
  monthly_price_eur: number;
  yearly_monthly_price_eur: number;
  yearly_total_eur: number;
}

interface BackendPricingResponse {
  default_tier: string;
  yearly_discount_percent: number;
  combined_rules: {
    primary_required_tier: string;
    allowed_additional_tiers: string[];
    additional_slot_discount_percent: number;
  };
  services?: {
    setup_fee_eur?: number;
    migration_from_eur?: number;
  };
  tiers: Record<string, BackendTierDto>;
}

export default function PricingPage() {
  const t = useTranslations('PricingPage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

  const tierProgress = useMotionValue(0);

  // Live single-source-of-truth pricing from backend
  const [pricingCatalog, setPricingCatalog] = useState<BackendPricingResponse | null>(null);

  // Combined (Multi-Store) Configurator state
  const [combinedCycle, setCombinedCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [additionalSlots, setAdditionalSlots] = useState<string[]>(['tier_2']);

  useEffect(() => {
    const controls = animate(tierProgress, [0, 1, 0], {
      duration: 10,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => controls.stop();
  }, [tierProgress]);

  useEffect(() => {
    fetch('/api/billing/pricing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.tiers) {
          setPricingCatalog(data);
        }
      })
      .catch(() => {});
  }, []);

  const appBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'http://localhost:3001';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:3001`;
    }
    return 'https://app.gametablesync.com';
  }, []);

  const formatEur = (amount: number | undefined, fallback: string) => {
    if (amount === undefined || Number.isNaN(amount)) return fallback;
    const isInt = Number.isInteger(amount);
    if (locale === 'de') {
      return `${isInt ? amount : amount.toFixed(2).replace('.', ',')} €`;
    }
    return `€${isInt ? amount : amount.toFixed(2)}`;
  };

  const monthlyLabel = t.has('billingToggle.monthly') ? t('billingToggle.monthly') : 'Monthly';
  const yearlyLabel = t.has('billingToggle.yearly') ? t('billingToggle.yearly') : 'Yearly';

  const t1 = pricingCatalog?.tiers?.tier_1;
  const t2 = pricingCatalog?.tiers?.tier_2;
  const t3 = pricingCatalog?.tiers?.tier_3;
  const t4 = pricingCatalog?.tiers?.tier_4;
  const discountPct =
    pricingCatalog?.combined_rules?.additional_slot_discount_percent ?? 10;

  const getCombinedSlotPrice = (tierKey: string, isAdditional: boolean) => {
    const cfg = pricingCatalog?.tiers?.[tierKey];
    const defaultMonthly = tierKey === 'tier_3' ? 35 : 25;
    const defaultYearlyMonthly = tierKey === 'tier_3' ? 31.5 : 22.5;
    const base =
      combinedCycle === 'yearly'
        ? (cfg?.yearly_monthly_price_eur ?? defaultYearlyMonthly)
        : (cfg?.monthly_price_eur ?? defaultMonthly);
    return isAdditional ? Number((base * (1 - discountPct / 100)).toFixed(2)) : base;
  };

  const combinedTotalMonthly = useMemo(() => {
    const primaryPrice = getCombinedSlotPrice('tier_3', false);
    const extraSum = additionalSlots.reduce(
      (sum, k) => sum + getCombinedSlotPrice(k, true),
      0
    );
    return Number((primaryPrice + extraSum).toFixed(2));
  }, [additionalSlots, combinedCycle, pricingCatalog]);

  const buildSingleCheckoutHref = (tierKey: string, purchaseMode?: string) => {
    if (purchaseMode === 'contact_only' || tierKey === 'tier_4') {
      return `/${locale}#contact`;
    }
    return `${appBaseUrl}/${locale}/license-checkout?mode=single&tier=${tierKey}&cycle=yearly`;
  };

  const combinedCheckoutHref = useMemo(() => {
    const extraParam = encodeURIComponent(additionalSlots.join(','));
    return `${appBaseUrl}/${locale}/license-checkout?mode=combined&tier=tier_3&extra=${extraParam}&cycle=${combinedCycle}`;
  }, [appBaseUrl, locale, additionalSlots, combinedCycle]);

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

      <Container
        size="xl"
        py={{ base: 40, md: 70 }}
        style={{ flex: 1, position: 'relative', zIndex: 2 }}
      >
        {/* Header */}
        <Stack align="center" ta="center" gap="md" mb={{ base: 30, md: 45 }}>
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
              <Text
                size="sm"
                c="cyan.3"
                fw={600}
                className="brand-logo"
                style={{ letterSpacing: '0.04em' }}
              >
                {t('promoBanner')}
              </Text>
            </Paper>
          )}
        </Stack>

        {/* TABBED VIEW: SINGLE LICENSE vs. MULTI-STORE (COMBINED LICENSE) */}
        <Tabs defaultValue="single" variant="pills" radius="md">
          <Group justify="center" mb="xl">
            <Tabs.List
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                padding: 6,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Tabs.Tab value="single" leftSection={<IconBuildingStore size={16} />}>
                {locale === 'de'
                  ? 'Einzellizenz (1 Club / Store)'
                  : 'Single License (1 Club / Store)'}
              </Tabs.Tab>
              <Tabs.Tab value="combined" leftSection={<IconSparkles size={16} />}>
                {locale === 'de'
                  ? `Kombi-Lizenz / Multi-Store (-${discountPct}% je Zusatz-Store)`
                  : `Combined / Multi-Store License (-${discountPct}% per extra Store)`}
              </Tabs.Tab>
            </Tabs.List>
          </Group>

          {/* TAB 1: SINGLE LICENSE TIERS */}
          <Tabs.Panel value="single">
            <Grid gap="lg" align="stretch">
              {/* Tier 1: OUTPOST (Non-commercial only) */}
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
                  title={t1?.name?.toUpperCase() || t('tier1.title')}
                  price={formatEur(t1?.monthly_price_eur, t('tier1.price'))}
                  period={t('tier1.period')}
                  yearlyPrice={formatEur(
                    t1?.yearly_monthly_price_eur,
                    t.has('tier1.yearlyPrice') ? t('tier1.yearlyPrice') : '13,50 €'
                  )}
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
                  ctaHref={buildSingleCheckoutHref('tier_1', t1?.purchase_mode)}
                />
              </Grid.Col>

              {/* Tier 2: STRONGHOLD (Direct Checkout) */}
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
                  title={t2?.name?.toUpperCase() || t('tier2.title')}
                  price={formatEur(t2?.monthly_price_eur, t('tier2.price'))}
                  period={t('tier2.period')}
                  yearlyPrice={formatEur(
                    t2?.yearly_monthly_price_eur,
                    t.has('tier2.yearlyPrice') ? t('tier2.yearlyPrice') : '22,50 €'
                  )}
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
                  ctaHref={buildSingleCheckoutHref('tier_2', t2?.purchase_mode)}
                />
              </Grid.Col>

              {/* Tier 3: CITADEL (Direct Checkout) */}
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
                  title={t3?.name?.toUpperCase() || t('tier3.title')}
                  price={formatEur(t3?.monthly_price_eur, t('tier3.price'))}
                  period={t('tier3.period')}
                  yearlyPrice={formatEur(
                    t3?.yearly_monthly_price_eur,
                    t.has('tier3.yearlyPrice') ? t('tier3.yearlyPrice') : '31,50 €'
                  )}
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
                  ctaHref={buildSingleCheckoutHref('tier_3', t3?.purchase_mode)}
                />
              </Grid.Col>

              {/* Tier 4: FORTRESS OF TERRA (Contact Only via Mail) */}
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
                  title={t4?.name?.toUpperCase() || t('tier4.title')}
                  price={formatEur(t4?.monthly_price_eur, t('tier4.price'))}
                  period={t('tier4.period')}
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
          </Tabs.Panel>

          {/* TAB 2: COMBINED / MULTI-STORE LICENSE CONFIGURATOR */}
          <Tabs.Panel value="combined">
            <Paper
              p={{ base: 'lg', md: 'xl' }}
              radius="md"
              maw={860}
              mx="auto"
              style={{
                backgroundColor: 'rgba(15, 16, 12, 0.92)',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                borderTop: '4px solid #a855f7',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <div>
                    <Badge color="violet" variant="light" mb={6}>
                      MULTI-STORE KOMBI-KONFIGURATOR (1 OWNER • MEHRERE STORES)
                    </Badge>
                    <Title order={3} className="brand-logo">
                      {locale === 'de'
                        ? 'KOMBINIERTE MULTI-STORE LIZENZ'
                        : 'COMBINED MULTI-STORE LICENSE'}
                    </Title>
                    <Text size="sm" c="gray.4" maw={560} mt={4}>
                      {locale === 'de'
                        ? `Deine erste Lizenz im Multi-Store-Verbund ist immer Citadel. Jede weitere Lizenz kann frei als Stronghold oder Citadel gewählt werden und erhält ${discountPct}% Rabatt (Outpost ist nur für nicht-kommerzielle Einzel-Clubs).`
                        : `Your first license in a multi-store bundle is always Citadel. Each additional store license can be Stronghold or Citadel and receives a ${discountPct}% discount (Outpost is for non-commercial single clubs only).`}
                    </Text>
                  </div>

                  <SegmentedControl
                    value={combinedCycle}
                    onChange={(v) => setCombinedCycle(v as 'monthly' | 'yearly')}
                    size="xs"
                    data={[
                      { label: monthlyLabel, value: 'monthly' },
                      { label: yearlyLabel, value: 'yearly' },
                    ]}
                  />
                </Group>

                <Divider color="rgba(255,255,255,0.1)" />

                {/* 1. Primary Store (Locked to Citadel) */}
                <Paper
                  p="md"
                  radius="md"
                  style={{
                    backgroundColor: 'rgba(124, 58, 237, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                  }}
                >
                  <Group justify="space-between" wrap="wrap">
                    <Group gap="sm">
                      <Badge color="violet" variant="filled">
                        STORE #1 (HAUPTLIZENZ)
                      </Badge>
                      <Text fw={700} className="brand-logo">
                        CITADEL (PFLICHT FÜR MULTI-STORE)
                      </Text>
                    </Group>
                    <Text fw={800} size="lg" className="brand-logo" c="violet.3">
                      {formatEur(getCombinedSlotPrice('tier_3', false), '31,50 €')}{' '}
                      <Text span size="xs" c="dimmed">
                        {t('tier3.period')}
                      </Text>
                    </Text>
                  </Group>
                </Paper>

                {/* 2. Additional Store Slots (Stronghold or Citadel at -10%) */}
                <Stack gap="sm">
                  {additionalSlots.map((slotTier, idx) => (
                    <Paper
                      key={idx}
                      p="md"
                      radius="md"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Group justify="space-between" align="center" wrap="wrap" gap="md">
                        <Group gap="sm">
                          <Badge color="teal" variant="light">
                            STORE #{idx + 2} (-{discountPct}%)
                          </Badge>
                          <Select
                            size="xs"
                            value={slotTier}
                            onChange={(val) => {
                              if (!val) return;
                              setAdditionalSlots((prev) =>
                                prev.map((item, i) => (i === idx ? val : item))
                              );
                            }}
                            data={[
                              {
                                value: 'tier_2',
                                label: `Stronghold (-${discountPct}%)`,
                              },
                              {
                                value: 'tier_3',
                                label: `Citadel (-${discountPct}%)`,
                              },
                            ]}
                          />
                        </Group>

                        <Group gap="sm">
                          <Text fw={700} className="brand-logo">
                            {formatEur(getCombinedSlotPrice(slotTier, true), '20,25 €')}{' '}
                            <Text span size="xs" c="dimmed">
                              {t('tier2.period')}
                            </Text>
                          </Text>
                          {additionalSlots.length > 1 && (
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() =>
                                setAdditionalSlots((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Group>
                    </Paper>
                  ))}

                  <Group justify="flex-start">
                    <Button
                      size="xs"
                      variant="light"
                      color="violet"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => setAdditionalSlots((prev) => [...prev, 'tier_2'])}
                    >
                      {locale === 'de'
                        ? `Weiteren Store hinzufügen (-${discountPct}%)`
                        : `Add Another Store (-${discountPct}%)`}
                    </Button>
                  </Group>
                </Stack>

                <Divider color="rgba(255,255,255,0.1)" />

                <Group justify="space-between" align="center" wrap="wrap">
                  <div>
                    <Text size="xs" c="dimmed">
                      {1 + additionalSlots.length} Stores insgesamt •{' '}
                      {combinedCycle === 'yearly' ? yearlyLabel : monthlyLabel}
                    </Text>
                    <Title order={2} className="brand-logo" c="white">
                      {formatEur(combinedTotalMonthly, `${combinedTotalMonthly} €`)}{' '}
                      <Text span size="sm" c="dimmed">
                        {t('tier3.period')}
                      </Text>
                    </Title>
                  </div>

                  <Button
                    component="a"
                    href={combinedCheckoutHref}
                    size="lg"
                    color="violet"
                    radius="md"
                    className="brand-logo"
                    leftSection={<IconSparkles size={18} />}
                  >
                    {locale === 'de'
                      ? 'KOMBI-LIZENZ JETZT STARTEN'
                      : 'START COMBINED LICENSE'}
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>

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

                  <Title order={3} className="brand-logo" style={{ fontSize: '1.25rem' }}>
                    {t('services.setup.title')}
                  </Title>

                  <Box>
                    <Text
                      component="span"
                      fw={700}
                      className="brand-logo"
                      style={{ fontSize: '1.75rem' }}
                    >
                      {formatEur(pricingCatalog?.services?.setup_fee_eur, t('services.setup.price'))}
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

                  <Title order={3} className="brand-logo" style={{ fontSize: '1.25rem' }}>
                    {t('services.migration.title')}
                  </Title>

                  <Box>
                    <Text
                      component="span"
                      fw={700}
                      className="brand-logo"
                      style={{ fontSize: '1.75rem' }}
                    >
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
