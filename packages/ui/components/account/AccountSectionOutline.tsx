'use client';

import React from 'react';
import { Paper, Stack, Group, Title, Text, Badge, SimpleGrid, Box } from '@mantine/core';

export interface AccountOutlineCardItem {
  title: string;
  description: string;
  badge?: string;
}

export interface AccountSectionOutlineProps {
  badge: string;
  title: string;
  subtitle: string;
  cards?: AccountOutlineCardItem[];
  headerAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function AccountSectionOutline({
  badge,
  title,
  subtitle,
  cards = [],
  headerAction,
  children,
}: AccountSectionOutlineProps) {
  return (
    <Stack gap="lg" maw={1200}>
      {/* Section Header */}
      <Paper
        p={{ base: 'lg', md: 'xl' }}
        radius="md"
        withBorder
        className="gts-panel-header"
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Stack gap="xs" className="gts-flex-1" style={{ minWidth: 260 }}>
            <Group gap="xs">
              <Badge variant="outline" size="sm" className="brand-logo gts-game-meta-tag">
                {badge}
              </Badge>
            </Group>
            <Title order={2} className="brand-logo gts-army-title">
              {title}
            </Title>
            <Text size="sm" maw={700} className="gts-text-subtitle">
              {subtitle}
            </Text>
          </Stack>
          {headerAction && <Box>{headerAction}</Box>}
        </Group>
      </Paper>

      {children}

      {/* Outline Cards Grid */}
      {cards.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {cards.map((card, idx) => (
            <Paper
              key={idx}
              p="lg"
              radius="md"
              withBorder
              className="gts-panel-card"
            >
              <Stack gap="xs">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Text fw={700} size="sm" className="brand-logo" c="white">
                    {card.title}
                  </Text>
                  {card.badge && (
                    <Badge variant="outline" size="xs" className="brand-logo gts-game-meta-tag">
                      {card.badge}
                    </Badge>
                  )}
                </Group>
                <Text size="xs" className="gts-text-description">
                  {card.description}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}