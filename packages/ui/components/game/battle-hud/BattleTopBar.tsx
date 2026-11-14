// packages/ui/components/game/battle-hud/BattleTopBar.tsx
'use client';

import { Paper, Group, Text, ActionIcon, Button, Badge, Tooltip } from '@mantine/core';
import {
  IconArrowLeft,
  IconMinus,
  IconPlus,
  IconArrowsLeftRight,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconPlayerPause,
  IconPlayerPlay,
  IconMaximize,
  IconMinimize,
  IconSettings,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { HudPhaseItem } from './types';

export interface BattleTopBarProps {
  battleRound: number;
  maxRounds?: number;
  onChangeRound: (nextRound: number) => void;
  activeSide: 'player' | 'opponent';
  onSwapSide: () => void;
  phases: HudPhaseItem[];
  phaseIdx: number;
  onSelectPhase: (idx: number) => void;
  onAdvancePhase: () => void;
  p1TotalVp: number;
  p2TotalVp: number;
  scoreBadgeText: string;
  isCompactHud: boolean;
  scoreboardCollapsed: boolean;
  onToggleScoreboard: () => void;
  clockEnabled: boolean;
  clockRunning: boolean;
  onToggleClock: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSettings?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function BattleTopBar({
  battleRound,
  maxRounds = 5,
  onChangeRound,
  activeSide,
  onSwapSide,
  phases,
  phaseIdx,
  onSelectPhase,
  onAdvancePhase,
  p1TotalVp,
  p2TotalVp,
  scoreBadgeText,
  isCompactHud,
  scoreboardCollapsed,
  onToggleScoreboard,
  clockEnabled,
  clockRunning,
  onToggleClock,
  isFullscreen,
  onToggleFullscreen,
  onOpenSettings,
  onBack,
  backLabel,
}: BattleTopBarProps) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <Paper
      px="xs"
      py={4}
      radius="md"
      className="gts-battle-topbar"
      data-turn={activeSide}
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
                R
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => onChangeRound(Math.max(1, battleRound - 1))}
              >
                <IconMinus size={10} />
              </ActionIcon>
              <Text size="xs" fw={900} className="brand-logo">
                {battleRound}/{maxRounds}
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => onChangeRound(Math.min(maxRounds, battleRound + 1))}
              >
                <IconPlus size={10} />
              </ActionIcon>
            </Group>
          </div>

          <Tooltip label={t('swapTurn')}>
            <ActionIcon
              size="sm"
              variant="filled"
              color={activeSide === 'player' ? 'brandBlue.6' : 'red.6'}
              onClick={onSwapSide}
            >
              <IconArrowsLeftRight size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <div className="gts-battle-phase-scroll">
          {phases.map((phase, idx) => (
            <Tooltip key={phase.id} label={`${idx + 1}. ${phase.label}`}>
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

          {isCompactHud ? (
            <Tooltip label={phaseIdx === phases.length - 1 ? t('endTurn') : t('nextPhase')}>
              <ActionIcon
                size="sm"
                variant="default"
                className="gts-game-cta-join"
                onClick={onAdvancePhase}
              >
                <IconChevronRight size={14} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button
              size="compact-xs"
              variant="default"
              rightSection={<IconChevronRight size={12} />}
              className="brand-logo gts-game-cta-join"
              onClick={onAdvancePhase}
            >
              {phaseIdx === phases.length - 1 ? t('endTurn') : t('nextPhase')}
            </Button>
          )}
        </div>

        <Group gap={5} justify="flex-end" wrap="nowrap">
          <div
            className="gts-battle-score-summary-pill"
            onClick={onToggleScoreboard}
            title={t('toggleScoreboard')}
          >
            <Text size="xs" fw={900} className="brand-logo" c="var(--gts-primary)">
              {String(p1TotalVp).padStart(2, '0')}
            </Text>
            <Badge size="xs" variant="outline" className="brand-logo">
              {scoreBadgeText}
            </Badge>
            <Text size="xs" fw={900} className="brand-logo" c="red.4">
              {String(p2TotalVp).padStart(2, '0')}
            </Text>
            {!isCompactHud &&
              (scoreboardCollapsed ? (
                <IconChevronDown size={12} />
              ) : (
                <IconChevronUp size={12} />
              ))}
          </div>

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