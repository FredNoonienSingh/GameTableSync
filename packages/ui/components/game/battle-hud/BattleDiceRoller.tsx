// packages/ui/components/game/battle-hud/BattleDiceRoller.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  SegmentedControl,
  Badge,
  Paper,
  Grid,
} from '@mantine/core';
import { motion } from 'framer-motion';
import { IconDice, IconSparkles } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';

export const DICE_SIDES: Record<DiceType, number> = {
  D4: 4,
  D6: 6,
  D8: 8,
  D10: 10,
  D12: 12,
  D20: 20,
  D100: 100,
};

export interface DiceRollResult {
  diceType: DiceType;
  sides: number;
  count: number;
  rolls: number[];
  total: number;
  highest: number;
  lowest: number;
  crits: number;
  fumbles: number;
  timestamp: number;
}

/**
 * Reusable pure function that rolls `count` dice of `diceType` and returns full stats.
 */
export function rollDice(diceType: DiceType, count: number = 1): DiceRollResult {
  const safeCount = Math.max(1, Math.min(50, Math.floor(count)));
  const sides = DICE_SIDES[diceType] ?? 6;
  const rolls: number[] = [];

  for (let i = 0; i < safeCount; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = rolls.reduce((acc, v) => acc + v, 0);
  const highest = Math.max(...rolls);
  const lowest = Math.min(...rolls);
  const crits = rolls.filter((r) => r === sides).length;
  const fumbles = rolls.filter((r) => r === 1).length;

  return {
    diceType,
    sides,
    count: safeCount,
    rolls,
    total,
    highest,
    lowest,
    crits,
    fumbles,
    timestamp: Date.now(),
  };
}

export interface BattleDiceRollerModalProps {
  opened: boolean;
  onClose: () => void;
  initialDiceType?: DiceType;
  initialCount?: number;
  onRollComplete?: (result: DiceRollResult) => void;
}

const COUNT_PRESETS = [1, 2, 3, 5, 10];

export function BattleDiceRollerModal({
  opened,
  onClose,
  initialDiceType = 'D20',
  initialCount = 1,
  onRollComplete,
}: BattleDiceRollerModalProps) {
  const t = useTranslations('BattleCompanion40k');

  const [diceType, setDiceType] = useState<DiceType>(initialDiceType);
  const [count, setCount] = useState<number>(initialCount);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollCycle, setRollCycle] = useState<number>(0);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [scrambleVals, setScrambleVals] = useState<number[]>([]);

  useEffect(() => {
    if (opened) {
      setDiceType(initialDiceType);
      setCount(initialCount);
      setResult(null);
      setIsRolling(false);
    }
  }, [opened, initialDiceType, initialCount]);

  const triggerRoll = () => {
    setIsRolling(true);
    setRollCycle((c) => c + 1);
    const sides = DICE_SIDES[diceType];

    setScrambleVals(
      Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
    );

    const interval = setInterval(() => {
      setScrambleVals(
        Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
      );
    }, 55);

    setTimeout(() => {
      clearInterval(interval);
      const finalResult = rollDice(diceType, count);
      setResult(finalResult);
      setIsRolling(false);
      onRollComplete?.(finalResult);
    }, 420);
  };

  const hasRolled = result !== null && !isRolling;

  const displayedRolls: (number | string)[] = isRolling
    ? scrambleVals.length === count
      ? scrambleVals
      : Array.from({ length: count }, () => 1)
    : result && result.rolls.length === count
      ? result.rolls
      : Array.from({ length: count }, () => '-');

  const liveTotal = isRolling
    ? scrambleVals.reduce((a, b) => a + b, 0)
    : hasRolled
      ? result.total
      : '-';

  const liveHighest = isRolling
    ? scrambleVals.length > 0
      ? Math.max(...scrambleVals)
      : 0
    : hasRolled
      ? result.highest
      : '-';

  const liveCrits = hasRolled ? result.crits : '-';
  const liveFumbles = hasRolled ? result.fumbles : '-';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      padding="sm"
      title={
        <Group gap="xs">
          <IconDice size={18} color="var(--gts-accent)" />
          <Text fw={800} size="sm" className="brand-logo">
            {t('diceRoller.title')} ({count}×{diceType})
          </Text>
        </Group>
      }
      classNames={{
        content: 'gts-modal-content gts-dice-modal-content',
        header: 'gts-modal-header',
      }}
    >
      <Stack gap="xs">
        {/* Side-by-Side Type & Count Selectors so it fits < 100dvh on Landscape Phones */}
        <Grid gap="xs" align="end">
          <Grid.Col span={{ base: 12, sm: 7 }}>
            <Text size="9px" fw={700} className="brand-logo" c="dimmed" mb={2}>
              {t('diceRoller.diceType')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              className="brand-logo"
              value={diceType}
              onChange={(val) => {
                setDiceType(val as DiceType);
                setResult(null);
              }}
              data={['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100']}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 5 }}>
            <Text size="9px" fw={700} className="brand-logo" c="dimmed" mb={2}>
              {t('diceRoller.diceCount')}
            </Text>
            <Group gap={4} grow wrap="nowrap">
              {COUNT_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  size="compact-xs"
                  variant={count === preset ? 'filled' : 'default'}
                  color={count === preset ? 'brandBlue.6' : undefined}
                  className="brand-logo"
                  px={4}
                  onClick={() => {
                    setCount(preset);
                    setResult(null);
                  }}
                >
                  {preset}×
                </Button>
              ))}
            </Group>
          </Grid.Col>
        </Grid>

        {/* Responsive Viewport-Clamped 3D Animated Dice Tray */}
        <div className="gts-dice-tray">
          {displayedRolls.map((val, idx) => {
            const sides = DICE_SIDES[diceType];
            const isCrit = hasRolled && val === sides;
            const isFumble = hasRolled && val === 1;

            return (
              <motion.div
                key={`${idx}-${rollCycle}`}
                className="gts-die-cube"
                data-rolling={isRolling ? 'true' : undefined}
                data-crit={isCrit ? 'true' : undefined}
                data-fumble={isFumble ? 'true' : undefined}
                initial={
                  rollCycle > 0
                    ? {
                        scale: 0.75,
                        rotateX: -180,
                        rotateY: 180,
                        rotateZ: -45,
                      }
                    : false
                }
                animate={
                  isRolling
                    ? {
                        scale: [0.88, 1.04, 0.94, 1],
                        rotateX: [0, 360],
                        rotateY: [0, -360],
                        rotateZ: [-12, 12, -8, 0],
                      }
                    : {
                        scale: isCrit ? [1.14, 1] : 1,
                        rotateX: 0,
                        rotateY: 0,
                        rotateZ: 0,
                      }
                }
                transition={{
                  duration: isRolling ? 0.38 : 0.2,
                  ease: 'easeOut',
                }}
              >
                <span className="gts-die-val">{val}</span>
                <span className="gts-die-type-tag">{diceType}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Permanently Mounted Roll Statistics Bar */}
        <Paper p={8} radius="md" className="gts-subsection-paper">
          <Grid gap={8}>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <div className="gts-battle-metric-box">
                <Text size="10px" fw={700} className="brand-logo" c="dimmed">
                  {t('diceRoller.totalSum')}
                </Text>
                <div className="gts-battle-metric-val">{liveTotal}</div>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <div className="gts-battle-metric-box">
                <Text size="10px" fw={700} className="brand-logo" c="dimmed">
                  {t('diceRoller.highest')}
                </Text>
                <div className="gts-battle-metric-val">{liveHighest}</div>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <div className="gts-battle-metric-box">
                <Text size="10px" fw={700} className="brand-logo" c="yellow.4">
                  {t('diceRoller.crits')} ({DICE_SIDES[diceType]})
                </Text>
                <div className="gts-battle-metric-val">{liveCrits}</div>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <div className="gts-battle-metric-box">
                <Text size="10px" fw={700} className="brand-logo" c="red.4">
                  {t('diceRoller.ones')}
                </Text>
                <div className="gts-battle-metric-val">{liveFumbles}</div>
              </div>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Locked-Height Footer CTA */}
        <Group justify="space-between" align="center" mih={32} wrap="wrap">
          <Group gap={6}>
            {hasRolled && result.crits > 0 ? (
              <Badge color="yellow" variant="filled" leftSection={<IconSparkles size={12} />}>
                {result.crits}× {t('diceRoller.critBadge')}
              </Badge>
            ) : (
              <Badge color="gray" variant="outline">
                {isRolling
                  ? t('diceRoller.rolling')
                  : `${count}×${diceType} ${t('diceRoller.ready')}`}
              </Badge>
            )}
          </Group>

          <Button
            size="sm"
            variant="default"
            leftSection={<IconDice size={16} />}
            className="brand-logo gts-game-cta-join"
            disabled={isRolling}
            onClick={triggerRoll}
          >
            {t('diceRoller.rollBtn')} {count}×{diceType}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}