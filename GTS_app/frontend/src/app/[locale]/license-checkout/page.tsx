'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Divider,
  Alert,
  Center,
  Loader,
  Box,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCheck,
  IconAlertTriangle,
  IconLogin,
  IconSparkles,
} from '@tabler/icons-react';
import { AnimatedBackground, AppHeader } from '@gts/ui';
import { useAuth } from '../../../context/AuthContext';

function LicenseCheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const { token, openLogin } = useAuth();

  const mode = (searchParams.get('mode') || 'single').toLowerCase();
  const tier = searchParams.get('tier') || 'tier_1';
  const cycle = (searchParams.get('cycle') || 'yearly').toLowerCase();
  const extraParam = searchParams.get('extra') || '';
  const extraTiers = extraParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const [pricingDoc, setPricingDoc] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/billing/pricing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPricingDoc(data);
      })
      .catch(() => {});
  }, []);

  const tiers = pricingDoc?.tiers || {};
  const discountPct = pricingDoc?.combined_rules?.additional_slot_discount_percent ?? 10;

  const getSlotPrice = (tKey: string, isAdditional = false) => {
    const cfg = tiers[tKey];
    if (!cfg) return 0;
    const base =
      cycle === 'yearly'
        ? Number(cfg.yearly_monthly_price_eur ?? cfg.monthly_price_eur ?? 0)
        : Number(cfg.monthly_price_eur ?? 0);
    return isAdditional ? Number((base * (1 - discountPct / 100)).toFixed(2)) : base;
  };

  const handleConfirmOrder = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      openLogin();
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload =
        mode === 'combined'
          ? {
              mode: 'combined',
              primary_tier: 'tier_3',
              additional_tiers: extraTiers.length > 0 ? extraTiers : ['tier_2'],
              billing_cycle: cycle,
            }
          : {
              mode: 'single',
              tier,
              billing_cycle: cycle,
            };

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.msg || 'Lizenz-Buchung fehlgeschlagen.');
        return;
      }

      setSuccessMsg(data.msg || 'Lizenz erfolgreich eingerichtet!');
      setTimeout(() => {
        router.push(`/${locale}/club`);
      }, 1200);
    } catch {
      setErrorMsg('Server nicht erreichbar.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMonthlyPrice =
    mode === 'combined'
      ? getSlotPrice('tier_3', false) +
        (extraTiers.length > 0 ? extraTiers : ['tier_2']).reduce(
          (acc, k) => acc + getSlotPrice(k, true),
          0
        )
      : getSlotPrice(tier, false);

  return (
    <Box className="gts-page-root">
      <AnimatedBackground />
      <AppHeader locale={locale} />

      <Container size="sm" py={{ base: 48, md: 80 }} className="gts-relative-layer">
        <Paper p="xl" radius="md" withBorder className="gts-panel-header">
          <Stack gap="md">
            <Group gap="xs">
              <IconBuildingStore size={28} className="gts-section-icon" />
              <Badge variant="outline" className="gts-tier-badge">
                {mode === 'combined' ? 'MULTI-STORE KOMBI-LIZENZ' : 'EINZEL-STORE LIZENZ'}
              </Badge>
              <Badge variant="outline" className="gts-status-badge">
                {cycle === 'yearly' ? 'JÄHRLICHE ABRECHNUNG (-10%)' : 'MONATLICHE ABRECHNUNG'}
              </Badge>
            </Group>

            <Title order={2} className="brand-logo gts-army-title">
              LIZENZ-EINRICHTUNG & CHECKOUT
            </Title>
            <Text size="sm" className="gts-text-subtitle">
              Überprüfe deine Lizenz-Konfiguration. Nach der Aktivierung wirst du direkt in dein
              Club-Management weitergeleitet, um deine Stores einzurichten.
            </Text>

            <Divider className="gts-divider" />

            <Paper p="md" radius="md" className="gts-subcard">
              {mode === 'combined' ? (
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={700} className="gts-text-heading">
                      1. Hauptstandort: {tiers.tier_3?.display_label || 'Citadel (Tier 3)'}
                    </Text>
                    <Text size="sm" fw={700} className="gts-text-heading">
                      {getSlotPrice('tier_3', false).toFixed(2)} € / Mo.
                    </Text>
                  </Group>
                  {(extraTiers.length > 0 ? extraTiers : ['tier_2']).map((tKey, idx) => (
                    <Group key={idx} justify="space-between">
                      <Text size="sm" className="gts-text-secondary">
                        {idx + 2}. Zusatz-Standort: {tiers[tKey]?.display_label || tKey}{' '}
                        <Badge size="xs" ml={6} variant="outline" className="gts-status-badge" data-tone="success">
                          -{discountPct}% Kombi-Rabatt
                        </Badge>
                      </Text>
                      <Text size="sm" fw={600} className="gts-text-heading">
                        {getSlotPrice(tKey, true).toFixed(2)} € / Mo.
                      </Text>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Group justify="space-between">
                  <Text size="sm" fw={700} className="gts-text-heading">
                    Gewähltes Lizenz-Tier: {tiers[tier]?.display_label || tier}
                  </Text>
                  <Text size="sm" fw={700} className="gts-text-heading">
                    {getSlotPrice(tier, false).toFixed(2)} € / Mo.
                  </Text>
                </Group>
              )}
            </Paper>

            <Divider className="gts-divider" />

            <Group justify="space-between">
              <Text className="gts-section-heading">
                GESAMTSUMME PRO MONAT
              </Text>
              <Title order={3} className="gts-checkout-total">
                {totalMonthlyPrice.toFixed(2)} € / Monat
              </Title>
            </Group>

            {errorMsg && (
              <Alert className="gts-alert" data-tone="danger" icon={<IconAlertTriangle size={16} />}>
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert className="gts-alert" data-tone="success" icon={<IconCheck size={16} />}>
                {successMsg}
              </Alert>
            )}

            {!token ? (
              <Button
                fullWidth
                size="md"
                variant="default"
                className="gts-btn-primary"
                leftSection={<IconLogin size={18} />}
                onClick={openLogin}
              >
                Zuerst anmelden / Account erstellen, um Lizenz zu aktivieren
              </Button>
            ) : (
              <Button
                fullWidth
                size="md"
                variant="default"
                className="gts-btn-primary"
                loading={submitting}
                leftSection={<IconSparkles size={18} />}
                onClick={handleConfirmOrder}
              >
                Lizenz jetzt verbindlich einrichten & zum Club-Management
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default function LicenseCheckoutPage() {
  return (
    <Suspense
      fallback={
        <Center mih="100vh">
          <Loader size="lg" />
        </Center>
      }
    >
      <LicenseCheckoutInner />
    </Suspense>
  );
}
