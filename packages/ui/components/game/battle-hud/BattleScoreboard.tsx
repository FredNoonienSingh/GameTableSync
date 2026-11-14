// packages/ui/components/game/battle-hud/BattleScoreboard.tsx
'use client';

import type { ReactNode } from 'react';
import {
  Box,
  Grid,
  Paper,
  Stack,
  Group,
  Title,
  Badge,
  Button,
  Switch,
  Text,
  ActionIcon,
} from '@mantine/core';
import {
  IconListDetails,
  IconClock,
  IconMinus,
  IconPlus,
  IconCheck,
  IconTrash,
  IconRefresh,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import {
  formatBattleClock,
  type BattleCompanionArmyInput,
  type SecondaryMissionCard,
} from './types';

export interface CommanderScoreState {
  side: 'player' | 'opponent';
  army: BattleCompanionArmyInput;
  cp: number;
  onChangeCp: (next: number) => void;
  primaryVp: number;
  onChangePrimaryVp: (next: number) => void;
  secondaryVp: number;
  onChangeSecondaryVp: (next: number) => void;
  painted: boolean;
  onChangePainted: (next: boolean) => void;
  totalVp: number;
  seconds: number;
  secondaries: SecondaryMissionCard[];
  factionExtraBar?: ReactNode;
}

export interface BattleScoreboardProps {
  commanders: [CommanderScoreState, CommanderScoreState];
  activeSide: 'player' | 'opponent';
  clockEnabled: boolean;
  clockRunning: boolean;
  isCompactHud: boolean;
  onOpenArmyViewer: (side: 'player' | 'opponent') => void;
  onScoreSecondary: (side: 'player' | 'opponent', cardId: string, pts: number) => void;
  onDiscardSecondary: (side: 'player' | 'opponent', cardId: string) => void;
  onDrawSecondary: (side: 'player' | 'opponent') => void;
}

export function BattleScoreboard({
  commanders,
  activeSide,
  clockEnabled,
  clockRunning,
  isCompactHud,
  onOpenArmyViewer,
  onScoreSecondary,
  onDiscardSecondary,
  onDrawSecondary,
}: BattleScoreboardProps) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <Box className={isCompactHud ? 'gts-battle-datasheet-scroll' : undefined}>
      <Grid gap="xs" align="stretch">
        {commanders.map((cmd) => {
          const isTurn = activeSide === cmd.side;

          return (
            <Grid.Col key={cmd.side} span={{ base: 12, sm: 6 }}>
              <Paper
                p="xs"
                radius="md"
                className="gts-battle-scorecard"
                data-side={cmd.side}
                data-active-turn={isTurn ? 'true' : undefined}
                h="100%"
              >
                <Stack gap={6}>
                  <Group justify="space-between" align="center" wrap="wrap" gap={4}>
                    <Group gap={6} wrap="wrap" miw={0}>
                      <Title order={6} className="brand-logo gts-army-title">
                        {cmd.army.playerName.toUpperCase()}
                      </Title>
                      <Badge variant="outline" size="xs" className="gts-game-meta-tag">
                        {cmd.army.metadata.faction}
                      </Badge>
                      {cmd.army.metadata.detachment && (
                        <Badge color="brandBlue.5" variant="light" size="xs">
                          {cmd.army.metadata.detachment}
                        </Badge>
                      )}
                    </Group>

                    <Group gap={6} wrap="nowrap">
                      <Button
                        size="compact-xs"
                        variant="light"
                        color={cmd.side === 'player' ? 'brandBlue.5' : 'red.5'}
                        leftSection={<IconListDetails size={12} />}
                        className="brand-logo"
                        onClick={() => onOpenArmyViewer(cmd.side)}
                      >
                        {t('armyViewer')}
                      </Button>

                      {clockEnabled && (
                        <div
                          className="gts-battle-clock"
                          data-running={clockRunning && isTurn ? 'true' : undefined}
                        >
                          <Group gap={4} wrap="nowrap">
                            <IconClock size={11} />
                            <span>{formatBattleClock(cmd.seconds)}</span>
                          </Group>
                        </div>
                      )}
                    </Group>
                  </Group>

                  {cmd.factionExtraBar}

                  <Grid gap={6}>
                    <Grid.Col span={3}>
                      <div className="gts-battle-metric-box">
                        <Group justify="space-between" wrap="nowrap">
                          <Text size="9px" fw={700} className="brand-logo" c="dimmed">
                            {t('totalVp')}
                          </Text>
                          <Switch
                            size="xs"
                            checked={cmd.painted}
                            onChange={(e) => cmd.onChangePainted(e.currentTarget.checked)}
                            title={`+10 ${t('painted')}`}
                          />
                        </Group>
                        <div className="gts-battle-metric-val">{cmd.totalVp}</div>
                      </div>
                    </Grid.Col>

                    <Grid.Col span={3}>
                      <div className="gts-battle-metric-box">
                        <Text size="9px" fw={700} className="brand-logo" c="yellow.4">
                          CP
                        </Text>
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <ActionIcon
                            size="xs"
                            variant="default"
                            onClick={() => cmd.onChangeCp(Math.max(0, cmd.cp - 1))}
                          >
                            <IconMinus size={10} />
                          </ActionIcon>
                          <span className="gts-battle-metric-val">{cmd.cp}</span>
                          <ActionIcon
                            size="xs"
                            variant="default"
                            onClick={() => cmd.onChangeCp(cmd.cp + 1)}
                          >
                            <IconPlus size={10} />
                          </ActionIcon>
                        </Group>
                      </div>
                    </Grid.Col>

                    <Grid.Col span={3}>
                      <div className="gts-battle-metric-box">
                        <Text size="9px" fw={700} className="brand-logo" c="dimmed">
                          {t('primary')} ({cmd.primaryVp}/50)
                        </Text>
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <ActionIcon
                            size="xs"
                            variant="default"
                            onClick={() =>
                              cmd.onChangePrimaryVp(Math.max(0, cmd.primaryVp - 5))
                            }
                          >
                            <IconMinus size={10} />
                          </ActionIcon>
                          <span className="gts-battle-metric-val">{cmd.primaryVp}</span>
                          <ActionIcon
                            size="xs"
                            variant="default"
                            onClick={() =>
                              cmd.onChangePrimaryVp(Math.min(50, cmd.primaryVp + 5))
                            }
                          >
                            <IconPlus size={10} />
                          </ActionIcon>
                        </Group>
                      </div>
                    </Grid.Col>

                    <Grid.Col span={3}>
                      <div className="gts-battle-metric-box">
                        <Text size="9px" fw={700} className="brand-logo" c="dimmed">
                          {t('secondary')} ({cmd.secondaryVp}/40)
                        </Text>
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <ActionIcon
                            size="xs"
                            variant="default"
                            onClick={() =>
                              cmd.onChangeSecondaryVp(Math.max(0, cmd.secondaryVp - 2))
                            }
                          >
                            <IconMinus size={10} />
                          </ActionIcon>
                          <span className="gts-battle-metric-val">{cmd.secondaryVp}</span>
                          <ActionIcon
                            size="xs"
                            variant="default"
                            onClick={() =>
                              cmd.onChangeSecondaryVp(Math.min(40, cmd.secondaryVp + 2))
                            }
                          >
                            <IconPlus size={10} />
                          </ActionIcon>
                        </Group>
                      </div>
                    </Grid.Col>
                  </Grid>

                  <Group gap={6} wrap="wrap" align="center">
                    {cmd.secondaries.map((sec) => (
                      <Paper
                        key={sec.id}
                        px="xs"
                        py={3}
                        radius="sm"
                        className="gts-unranked-pill"
                        miw={150}
                      >
                        <Group justify="space-between" wrap="nowrap" gap={4}>
                          <Text size="10px" fw={700} truncate>
                            {sec.name}
                          </Text>
                          <Group gap={3} wrap="nowrap">
                            <ActionIcon
                              size="xs"
                              color="teal"
                              variant="light"
                              onClick={() => onScoreSecondary(cmd.side, sec.id, 3)}
                              title="+3 VP"
                            >
                              <IconCheck size={10} />
                            </ActionIcon>
                            <Badge
                              size="xs"
                              color="teal"
                              variant="outline"
                              onClick={() => onScoreSecondary(cmd.side, sec.id, sec.maxVp)}
                            >
                              +{sec.maxVp}
                            </Badge>
                            <ActionIcon
                              size="xs"
                              color="yellow"
                              variant="subtle"
                              onClick={() => onDiscardSecondary(cmd.side, sec.id)}
                              title={t('discardForCp')}
                            >
                              <IconTrash size={10} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}

                    {cmd.secondaries.length < 2 && (
                      <Button
                        size="compact-xs"
                        variant="outline"
                        leftSection={<IconRefresh size={11} />}
                        className="brand-logo"
                        onClick={() => onDrawSecondary(cmd.side)}
                      >
                        {t('drawSecondary')}
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Box>
  );
}