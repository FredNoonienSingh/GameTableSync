'use client';

import { Paper, Group, Text, ActionIcon, Button, Tooltip } from '@mantine/core';
import {
  IconArrowLeft,
  IconMinus,
  IconPlus,
  IconChevronRight,
  IconBolt,
  IconMoon,
  IconSun,
  IconDice,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconMaximize,
  IconMinimize,
  IconSettings,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { MtgPhaseItem } from './types';

export interface MtgTopBarProps {
  turnNumber: number;
  onChangeTurnNumber: (next: number) => void;
  activeSeatIdx: number;
  activePlayerName?: string;
  onPassTurn: () => void;
  phases: MtgPhaseItem[];
  phaseIdx: number;
  onSelectPhase: (idx: number) => void;
  onAdvancePhase: () => void;
  stormCount: number;
  onChangeStormCount: (next: number) => void;
  isNight: boolean;
  onToggleNight: () => void;
  onRollD20: () => void;
  clockEnabled: boolean;
  clockRunning: boolean;
  onToggleClock: () => void;
  onResetGame: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isPhone: boolean;
  onOpenSettings?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function MtgTopBar({
  turnNumber,
  onChangeTurnNumber,
  activeSeatIdx,
  activePlayerName,
  onPassTurn,
  phases,
  phaseIdx,
  onSelectPhase,
  onAdvancePhase,
  stormCount,
  onChangeStormCount,
  isNight,
  onToggleNight,
  onRollD20,
  clockEnabled,
  clockRunning,
  onToggleClock,
  onResetGame,
  isFullscreen,
  onToggleFullscreen,
  isPhone,
  onOpenSettings,
  onBack,
  backLabel,
}: MtgTopBarProps) {
  const t = useTranslations('BattleCompanionMtg');

  const seatButtonColor =
    activeSeatIdx === 0
      ? 'brandBlue.6'
      : activeSeatIdx === 1
        ? 'red.6'
        : activeSeatIdx === 2
          ? 'teal.6'
          : 'yellow.6';

  return (
    <Paper
      px="xs"
      py={4}
      radius="md"
      className="gts-battle-topbar gts-mtg-topbar-seat-color"
      data-active-seat={activeSeatIdx}
    >
      <div className="gts-battle-topbar-row">
        <Group gap={5} wrap="nowrap">
          {onBack && (
            <Tooltip label={backLabel || t('back')}>
              <ActionIcon
                size="sm"
                variant="default"
                className="gts-tournament-secondary-btn"
                onClick={onBack}
              >
                <IconArrowLeft size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          <div className="gts-battle-round-pill">
            <Group gap={3} justify="center" align="center" wrap="nowrap">
              <Text size="9px" fw={700} className="brand-logo" c="dimmed">
                T
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => onChangeTurnNumber(Math.max(1, turnNumber - 1))}
              >
                <IconMinus size={10} />
              </ActionIcon>
              <Text size="xs" fw={900} className="brand-logo">
                {turnNumber}
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => onChangeTurnNumber(turnNumber + 1)}
              >
                <IconPlus size={10} />
              </ActionIcon>
            </Group>
          </div>

          <Button
            size="compact-xs"
            variant="filled"
            color={seatButtonColor}
            className="brand-logo"
            onClick={onPassTurn}
          >
            {activePlayerName} →
          </Button>
        </Group>

        <div className="gts-battle-phase-scroll">
          {phases.map((phase, idx) => (
            <Tooltip key={phase.id} label={phase.label}>
              <button
                type="button"
                className="brand-logo gts-battle-phase-step"
                data-active={idx === phaseIdx ? 'true' : undefined}
                onClick={() => onSelectPhase(idx)}
              >
                {phase.icon}
                <span className="gts-battle-phase-label">{phase.label}</span>
              </button>
            </Tooltip>
          ))}

          <ActionIcon
            size="sm"
            variant="default"
            className="gts-game-cta-join"
            onClick={onAdvancePhase}
            title={t('nextPhase')}
          >
            <IconChevronRight size={14} />
          </ActionIcon>
        </div>

        <Group gap={5} justify="flex-end" wrap="nowrap">
          {!isPhone && (
            <div className="gts-battle-score-summary-pill">
              <IconBolt size={12} color="var(--gts-accent)" />
              <Text size="10px" fw={700} className="brand-logo" c="dimmed">
                {t('storm')}:
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => onChangeStormCount(Math.max(0, stormCount - 1))}
              >
                <IconMinus size={10} />
              </ActionIcon>
              <Text size="xs" fw={900} className="brand-logo">
                {stormCount}
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => onChangeStormCount(stormCount + 1)}
              >
                <IconPlus size={10} />
              </ActionIcon>
            </div>
          )}

          <Tooltip label={isNight ? t('night') : t('day')}>
            <ActionIcon
              size="sm"
              variant="light"
              color={isNight ? 'indigo' : 'yellow'}
              onClick={onToggleNight}
            >
              {isNight ? <IconMoon size={13} /> : <IconSun size={13} />}
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t('rollD20')}>
            <ActionIcon size="sm" variant="default" onClick={onRollD20}>
              <IconDice size={14} />
            </ActionIcon>
          </Tooltip>

          {clockEnabled && (
            <ActionIcon
              size="sm"
              variant="light"
              color={clockRunning ? 'teal' : 'gray'}
              onClick={onToggleClock}
              title={t('toggleClock')}
            >
              {clockRunning ? (
                <IconPlayerPause size={13} />
              ) : (
                <IconPlayerPlay size={13} />
              )}
            </ActionIcon>
          )}

          <Tooltip label={t('resetGame')}>
            <ActionIcon size="sm" variant="subtle" onClick={onResetGame}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t('fullscreen')}>
            <ActionIcon
              size="sm"
              variant={isFullscreen ? 'filled' : 'subtle'}
              color={isFullscreen ? 'brandBlue.6' : undefined}
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
            </ActionIcon>
          </Tooltip>

          {onOpenSettings && (
            <Tooltip label={t('settings')}>
              <ActionIcon size="sm" variant="subtle" onClick={onOpenSettings}>
                <IconSettings size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </div>
    </Paper>
  );
}
