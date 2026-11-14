// packages/ui/components/game/mtg-hud/MtgPlayerSeatCard.tsx
'use client';

import { Group, Badge, Button, ActionIcon, Text, Tooltip } from '@mantine/core';
import {
  IconCrown,
  IconShield,
  IconListDetails,
  IconClock,
  IconMinus,
  IconPlus,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { formatBattleClock } from '../battle-hud';
import type { MtgPlayerInput, MtgSeatLiveState } from './types';

export interface MtgPlayerSeatCardProps {
  player: MtgPlayerInput;
  seatIdx: number;
  totalSeats: 2 | 4;
  state: MtgSeatLiveState;
  opponents: MtgPlayerInput[];
  isTurn: boolean;
  eliminated: boolean;
  isCommanderMode: boolean;
  trackMonarchAndInitiative: boolean;
  isMonarch: boolean;
  onToggleMonarch: () => void;
  hasInitiative: boolean;
  onToggleInitiative: () => void;
  clockEnabled: boolean;
  clockRunning: boolean;
  secondsRemaining: number;
  isPhone: boolean;
  onOpenDeckModal: () => void;
  onAdjustLife: (delta: number) => void;
  onAdjustCounter: (field: 'poison' | 'commanderTax' | 'gameWins', delta: number) => void;
  onAdjustCommanderDamage: (sourceOpponent: MtgPlayerInput, delta: number) => void;
}

export function MtgPlayerSeatCard({
  player,
  seatIdx,
  totalSeats,
  state,
  opponents,
  isTurn,
  eliminated,
  isCommanderMode,
  trackMonarchAndInitiative,
  isMonarch,
  onToggleMonarch,
  hasInitiative,
  onToggleInitiative,
  clockEnabled,
  clockRunning,
  secondsRemaining,
  isPhone,
  onOpenDeckModal,
  onAdjustLife,
  onAdjustCounter,
  onAdjustCommanderDamage,
}: MtgPlayerSeatCardProps) {
  const t = useTranslations('BattleCompanionMtg');

  return (
    <div
      className="gts-mtg-seat-card"
      data-seat={seatIdx}
      data-seats={totalSeats}
      data-active-turn={isTurn ? 'true' : undefined}
      data-eliminated={eliminated ? 'true' : undefined}
    >
      {/* Seat Header: Truncated Name on Left, Uncrowded Controls on Right */}
      <Group justify="space-between" wrap="nowrap" gap={6}>
        <Group gap={6} wrap="nowrap" miw={0}>
          <Text
            size="sm"
            fw={800}
            className="brand-logo gts-army-title"
            td={eliminated ? 'line-through' : undefined}
            truncate="end"
          >
            {player.playerName.toUpperCase()}
          </Text>

          {!isPhone && totalSeats === 2 && (
            <Group gap={2} wrap="nowrap">
              {player.colorIdentity.map((mana) => (
                <span key={mana} className="gts-mtg-mana-dot" data-mana={mana}>
                  {mana}
                </span>
              ))}
            </Group>
          )}

          {eliminated && (
            <Badge size="xs" color="red" variant="filled">
              {t('defeated')}
            </Badge>
          )}
        </Group>

        <Group gap={4} wrap="nowrap">
          {trackMonarchAndInitiative && (
            <>
              <Tooltip label={t('monarch')}>
                <ActionIcon
                  size="xs"
                  color={isMonarch ? 'yellow' : 'gray'}
                  variant={isMonarch ? 'filled' : 'default'}
                  onClick={onToggleMonarch}
                >
                  <IconCrown size={11} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('initiative')}>
                <ActionIcon
                  size="xs"
                  color={hasInitiative ? 'teal' : 'gray'}
                  variant={hasInitiative ? 'filled' : 'default'}
                  onClick={onToggleInitiative}
                >
                  <IconShield size={11} />
                </ActionIcon>
              </Tooltip>
            </>
          )}

          {isPhone ? (
            <Tooltip label={t('decklist')}>
              <ActionIcon
                size="xs"
                variant="light"
                onClick={onOpenDeckModal}
              >
                <IconListDetails size={12} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button
              size="compact-xs"
              variant="light"
              leftSection={<IconListDetails size={11} />}
              className="brand-logo"
              onClick={onOpenDeckModal}
            >
              {t('decklist')}
            </Button>
          )}

          {clockEnabled && (
            <div
              className="gts-battle-clock"
              data-running={clockRunning && isTurn ? 'true' : undefined}
            >
              <Group gap={3} wrap="nowrap">
                <IconClock size={10} />
                <span>{formatBattleClock(secondsRemaining)}</span>
              </Group>
            </div>
          )}
        </Group>
      </Group>

      {/* Main Life Total Bar (-5, -1, LIFE, +1, +5) */}
      <div className="gts-mtg-life-strip">
        <Group gap={4} wrap="nowrap">
          <button
            type="button"
            className="gts-mtg-life-step-btn"
            onClick={() => onAdjustLife(-5)}
          >
            -5
          </button>
          <button
            type="button"
            className="gts-mtg-life-step-btn"
            onClick={() => onAdjustLife(-1)}
          >
            -1
          </button>
        </Group>

        <div className="gts-mtg-life-val">{state.life}</div>

        <Group gap={4} wrap="nowrap">
          <button
            type="button"
            className="gts-mtg-life-step-btn"
            onClick={() => onAdjustLife(1)}
          >
            +1
          </button>
          <button
            type="button"
            className="gts-mtg-life-step-btn"
            onClick={() => onAdjustLife(5)}
          >
            +5
          </button>
        </Group>
      </div>

      {/* 2-Column Counter Row (Poison + Commander Tax OR Game Wins) */}
      <div className="gts-mtg-bottom-grid">
        <div className="gts-mtg-counter-pill">
          <Text size="9px" fw={700} className="brand-logo" c="teal.4" truncate="end">
            {t('poison')} (10)
          </Text>
          <Group gap={3} wrap="nowrap">
            <button
              type="button"
              className="gts-mtg-mini-step-btn"
              onClick={() => onAdjustCounter('poison', -1)}
            >
              <IconMinus size={10} />
            </button>
            <span className="gts-mtg-counter-pill-val">{state.poison}</span>
            <button
              type="button"
              className="gts-mtg-mini-step-btn"
              onClick={() => onAdjustCounter('poison', 1)}
            >
              <IconPlus size={10} />
            </button>
          </Group>
        </div>

        {isCommanderMode ? (
          <div className="gts-mtg-counter-pill">
            <Text size="9px" fw={700} className="brand-logo" c="yellow.4" truncate="end">
              {t('cmdTax')} (+{state.commanderTax * 2})
            </Text>
            <Group gap={3} wrap="nowrap">
              <button
                type="button"
                className="gts-mtg-mini-step-btn"
                onClick={() => onAdjustCounter('commanderTax', -1)}
              >
                <IconMinus size={10} />
              </button>
              <span className="gts-mtg-counter-pill-val">
                {state.commanderTax}x
              </span>
              <button
                type="button"
                className="gts-mtg-mini-step-btn"
                onClick={() => onAdjustCounter('commanderTax', 1)}
              >
                <IconPlus size={10} />
              </button>
            </Group>
          </div>
        ) : (
          <div className="gts-mtg-counter-pill">
            <Text size="9px" fw={700} className="brand-logo" c="yellow.4" truncate="end">
              {t('gameWins')}
            </Text>
            <Group gap={3} wrap="nowrap">
              <button
                type="button"
                className="gts-mtg-mini-step-btn"
                onClick={() => onAdjustCounter('gameWins', -1)}
              >
                <IconMinus size={10} />
              </button>
              <span className="gts-mtg-counter-pill-val">{state.gameWins}</span>
              <button
                type="button"
                className="gts-mtg-mini-step-btn"
                onClick={() => onAdjustCounter('gameWins', 1)}
              >
                <IconPlus size={10} />
              </button>
            </Group>
          </div>
        )}
      </div>

      {/* Commander Damage Row */}
      {isCommanderMode && opponents.length > 0 && (
        <div className="gts-mtg-cmd-dmg-row">
          {opponents.map((opp) => {
            const dmg = state.commanderDamageFrom[opp.id] ?? 0;
            const isLethal = dmg >= 21;
            return (
              <div
                key={opp.id}
                className="gts-mtg-cmd-dmg-box"
                data-lethal={isLethal ? 'true' : undefined}
              >
                <Text size="9px" fw={700} truncate="end">
                  ⚔ {opp.playerName}
                </Text>
                <Group gap={2} wrap="nowrap">
                  <button
                    type="button"
                    className="gts-mtg-mini-step-btn"
                    onClick={() => onAdjustCommanderDamage(opp, -1)}
                  >
                    <IconMinus size={9} />
                  </button>
                  <Badge
                    size="xs"
                    color={isLethal ? 'red' : dmg >= 15 ? 'orange' : 'gray'}
                    variant={dmg > 0 ? 'filled' : 'outline'}
                    miw={34}
                    ta="center"
                  >
                    {dmg}
                  </Badge>
                  <button
                    type="button"
                    className="gts-mtg-mini-step-btn"
                    onClick={() => onAdjustCommanderDamage(opp, 1)}
                  >
                    <IconPlus size={9} />
                  </button>
                </Group>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}