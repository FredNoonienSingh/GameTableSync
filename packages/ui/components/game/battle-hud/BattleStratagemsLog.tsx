// packages/ui/components/game/battle-hud/BattleStratagemsLog.tsx
'use client';

import { Paper, Grid, Group, Text, Badge, ScrollArea, Stack, Box } from '@mantine/core';
import { IconBolt, IconFlame } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { QuickActionItem } from './types';

export interface BattleStratagemsLogProps {
  actions: QuickActionItem[];
  activeCp: number;
  activePlayerLabel?: string;
  battleLog: string[];
  onUseAction: (name: string, cost: number) => void;
  compactDrawer?: boolean;
}

export function BattleStratagemsLog({
  actions,
  activeCp,
  activePlayerLabel,
  battleLog,
  onUseAction,
  compactDrawer = false,
}: BattleStratagemsLogProps) {
  const t = useTranslations('BattleCompanion40k');

  if (compactDrawer) {
    return (
      <Paper p="xs" radius="md" className="gts-army-panel">
        <Grid gap="xs" align="stretch">
          <Grid.Col span={8}>
            <Group gap={6} mb={4}>
              <IconBolt size={14} color="var(--gts-accent)" />
              <Text size="10px" fw={700} className="brand-logo">
                {t('coreStratagems')}
              </Text>
            </Group>
            <Grid gap={4}>
              {actions.map((strat) => (
                <Grid.Col key={strat.id} span={3}>
                  <button
                    type="button"
                    disabled={activeCp < strat.cost}
                    className="gts-battle-strat-btn"
                    onClick={() => onUseAction(strat.name, strat.cost)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Badge size="xs" color="yellow" variant="outline">
                        {strat.cost} CP
                      </Badge>
                      <Text size="9px" c="dimmed" truncate>
                        {strat.phase}
                      </Text>
                    </Group>
                    <Text size="11px" fw={700} truncate>
                      {strat.name}
                    </Text>
                  </button>
                </Grid.Col>
              ))}
            </Grid>
          </Grid.Col>

          <Grid.Col span={4}>
            <Group gap={6} mb={4}>
              <IconFlame size={14} color="var(--gts-accent)" />
              <Text size="10px" fw={700} className="brand-logo">
                {t('battleLog')}
              </Text>
            </Group>
            <ScrollArea h={85}>
              <Stack gap={2}>
                {battleLog.map((entry, idx) => (
                  <Text
                    key={idx}
                    size="11px"
                    c={idx === 0 ? undefined : 'dimmed'}
                    ff="monospace"
                  >
                    • {entry}
                  </Text>
                ))}
              </Stack>
            </ScrollArea>
          </Grid.Col>
        </Grid>
      </Paper>
    );
  }

  return (
    <Box className="gts-battle-datasheet-scroll">
      <Grid gap="sm" align="stretch">
        <Grid.Col span={{ base: 12, sm: 7 }}>
          <Paper p="sm" radius="md" className="gts-army-panel" h="100%">
            <Group gap="xs" mb="xs">
              <IconBolt size={15} color="var(--gts-accent)" />
              <Text size="xs" fw={700} className="brand-logo">
                {t('coreStratagems')} {activePlayerLabel ? `(${activePlayerLabel})` : ''}
              </Text>
            </Group>
            <Grid gap="xs">
              {actions.map((strat) => (
                <Grid.Col key={strat.id} span={{ base: 6, sm: 3 }}>
                  <button
                    type="button"
                    disabled={activeCp < strat.cost}
                    className="gts-battle-strat-btn"
                    onClick={() => onUseAction(strat.name, strat.cost)}
                  >
                    <Group justify="space-between" wrap="nowrap" mb={2}>
                      <Badge size="xs" color="yellow" variant="outline">
                        {strat.cost} CP
                      </Badge>
                      <Text size="9px" c="dimmed" truncate>
                        {strat.phase}
                      </Text>
                    </Group>
                    <Text size="xs" fw={700} truncate>
                      {strat.name}
                    </Text>
                  </button>
                </Grid.Col>
              ))}
            </Grid>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5 }}>
          <Paper p="sm" radius="md" className="gts-army-panel" h="100%">
            <Group gap="xs" mb="xs">
              <IconFlame size={15} color="var(--gts-accent)" />
              <Text size="xs" fw={700} className="brand-logo">
                {t('battleLog')}
              </Text>
            </Group>
            <ScrollArea h={220}>
              <Stack gap={4}>
                {battleLog.map((entry, idx) => (
                  <Text
                    key={idx}
                    size="xs"
                    c={idx === 0 ? undefined : 'dimmed'}
                    ff="monospace"
                  >
                    • {entry}
                  </Text>
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}