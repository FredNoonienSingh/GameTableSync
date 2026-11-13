'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  Paper,
  Title,
  Text,
  List,
  ThemeIcon,
  Stack,
  Badge,
  Button,
  Box,
  Group,
  SegmentedControl,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

export interface PriceDetailProps {
  title: string;
  price: string;
  period?: string;
  yearlyPrice?: string;
  yearlyPeriod?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
  billingNote?: string;
  promoNote?: string;
  subNote?: string;
  description: string;
  features: string[];
  borderColor?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
  graphic?: ReactNode;
}

export function PriceDetail({
  title,
  price,
  period,
  yearlyPrice,
  yearlyPeriod,
  monthlyLabel = 'Monthly',
  yearlyLabel = 'Yearly',
  billingNote,
  promoNote,
  subNote,
  description,
  features,
  borderColor = 'var(--gts-primary)',
  badge,
  ctaLabel,
  ctaHref,
  graphic,
}: PriceDetailProps) {
  const hasYearlyToggle = Boolean(yearlyPrice && yearlyPrice.trim().length > 0);
  const hasPromoBanner = Boolean(promoNote && promoNote.trim().length > 0);
  const hasSubNote = Boolean(subNote && subNote.trim().length > 0);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    hasYearlyToggle ? 'yearly' : 'monthly'
  );

  const activePrice = hasYearlyToggle && billingCycle === 'yearly' ? yearlyPrice : price;
  const activePeriod =
    hasYearlyToggle && billingCycle === 'yearly' ? (yearlyPeriod ?? period) : period;

  return (
    <Paper
      p={{ base: 'lg', sm: 'xl' }}
      radius="md"
      h="100%"
      className="gts-price-card"
      style={{ '--card-color': borderColor } as CSSProperties}
    >
      <Stack gap="sm">
        {graphic && (
          <Box className="gts-price-graphic-slot">
            <div className="gts-price-graphic-scale">{graphic}</div>
          </Box>
        )}

        <Box className="gts-price-badge-slot">
          {badge && (
            <Badge variant="outline" size="md" w="fit-content" className="gts-price-badge">
              {badge}
            </Badge>
          )}
        </Box>

        <Box className="gts-price-title-slot">
          <Title order={3} className="brand-logo gts-price-title">
            {title}
          </Title>
        </Box>

        <Box className="gts-price-toggle-slot">
          {hasYearlyToggle ? (
            <SegmentedControl
              value={billingCycle}
              onChange={(val) => setBillingCycle(val as 'monthly' | 'yearly')}
              fullWidth
              size="xs"
              radius="sm"
              data={[
                { label: monthlyLabel, value: 'monthly' },
                { label: yearlyLabel, value: 'yearly' },
              ]}
              classNames={{
                root: 'gts-price-segmented-root',
                indicator: 'gts-price-segmented-indicator',
                label: 'gts-price-segmented-label',
              }}
            />
          ) : (
            <Box className="gts-price-static-pill">
              <Text size="xs" fw={600} className="gts-price-static-pill-text">
                {billingNote ?? 'MANAGED ENTERPRISE SLA'}
              </Text>
            </Box>
          )}
        </Box>

        <Box my={4} className="gts-price-value-slot">
          <div>
            <Group gap={6} align="baseline" wrap="nowrap">
              <Text component="span" className="brand-logo gts-price-amount">
                {activePrice}
              </Text>
              {activePeriod && (
                <Text component="span" size="sm" className="gts-price-period">
                  {activePeriod}
                </Text>
              )}
            </Group>

            {hasYearlyToggle && (
              <Text size="xs" mt={2} className="gts-price-billing-note">
                {billingCycle === 'yearly' ? billingNote : '\u00A0'}
              </Text>
            )}
          </div>

          {(hasPromoBanner || hasSubNote) && (
            <Box mt="xs" px="xs" py={6} className="gts-price-promo-box">
              <Text
                size="xs"
                fw={600}
                className={hasPromoBanner ? 'gts-price-promo-text' : 'gts-price-subnote-text'}
              >
                {hasPromoBanner ? promoNote : subNote}
              </Text>
            </Box>
          )}
        </Box>

        <Box className="gts-price-desc-slot">
          <Text size="sm" lh={1.55} className="gts-price-desc-text">
            {description}
          </Text>
        </Box>

        <List
          spacing="sm"
          size="sm"
          mt={4}
          center
          icon={
            <ThemeIcon size={22} radius="xl" className="gts-price-feature-icon">
              <IconCheck size={14} stroke={2.5} />
            </ThemeIcon>
          }
        >
          {features.map((feature, idx) => (
            <List.Item key={idx} className="gts-price-feature-item">
              {feature}
            </List.Item>
          ))}
        </List>
      </Stack>

      {ctaLabel && (
        <Button
          component={ctaHref ? 'a' : 'button'}
          href={ctaHref}
          variant="default"
          mt="xl"
          fullWidth
          size="md"
          radius="md"
          className="brand-logo"
          classNames={{
            root: 'gts-price-cta-root',
            label: 'gts-price-cta-label',
          }}
        >
          {ctaLabel}
        </Button>
      )}
    </Paper>
  );
}