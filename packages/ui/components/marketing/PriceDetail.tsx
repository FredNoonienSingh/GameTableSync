'use client';

import { Paper, Title, Text, List, ThemeIcon, Stack, Badge, Button, Box } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

export interface PriceDetailProps {
  title: string;
  price: string;
  period?: string;
  promoNote?: string;
  description: string;
  features: string[];
  borderColor?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function PriceDetail({
  title,
  price,
  period,
  promoNote,
  description,
  features,
  borderColor = '#1864ff',
  badge,
  ctaLabel,
  ctaHref,
}: PriceDetailProps) {
  return (
    <Paper
      p={{ base: 'lg', sm: 'xl' }}
      radius="md"
      h="100%"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'rgba(15, 16, 12, 0.88)',
        border: `1px solid ${borderColor}40`,
        borderTop: `4px solid ${borderColor}`,
        boxShadow: `0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px ${borderColor}15`,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Stack gap="md">
        {badge && (
          <Badge
            variant="outline"
            size="md"
            w="fit-content"
            style={{
              borderColor,
              color: borderColor,
              letterSpacing: '0.08em',
            }}
          >
            {badge}
          </Badge>
        )}

        <Title
          order={3}
          c="white"
          className="brand-logo"
          style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em' }}
        >
          {title}
        </Title>

        <Box my="xs">
          <Text
            component="span"
            className="brand-logo"
            c="white"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 700,
              textShadow: `0 0 20px ${borderColor}55`,
            }}
          >
            {price}
          </Text>
          {period && (
            <Text component="span" size="sm" c="gray.5" ml={6}>
              {period}
            </Text>
          )}

          {promoNote && (
            <Box
              mt="xs"
              px="xs"
              py={6}
              style={{
                backgroundColor: `${borderColor}15`,
                border: `1px solid ${borderColor}45`,
                borderRadius: 6,
              }}
            >
              <Text size="xs" fw={600} style={{ color: borderColor, lineHeight: 1.35 }}>
                {promoNote}
              </Text>
            </Box>
          )}
        </Box>

        <Text size="sm" c="gray.3" lh={1.6}>
          {description}
        </Text>

        <List
          spacing="sm"
          size="sm"
          mt="sm"
          center
          icon={
            <ThemeIcon
              size={22}
              radius="xl"
              style={{
                backgroundColor: `${borderColor}22`,
                color: borderColor,
                border: `1px solid ${borderColor}66`,
              }}
            >
              <IconCheck size={14} stroke={2.5} />
            </ThemeIcon>
          }
        >
          {features.map((feature, idx) => (
            <List.Item key={idx} style={{ color: '#E9ECEF', lineHeight: 1.4 }}>
              {feature}
            </List.Item>
          ))}
        </List>
      </Stack>

      {ctaLabel && (
        <Button
          component={ctaHref ? 'a' : 'button'}
          href={ctaHref}
          mt="xl"
          fullWidth
          size="md"
          radius="md"
          className="brand-logo"
          styles={{
            root: {
              backgroundColor: `${borderColor}20`,
              border: `1px solid ${borderColor}`,
              color: '#fff',
              height: 'auto',
              minHeight: '2.75rem',
              padding: '0.6rem 1rem',
            },
            label: {
              whiteSpace: 'normal',
              textAlign: 'center',
            },
          }}
        >
          {ctaLabel}
        </Button>
      )}
    </Paper>
  );
}