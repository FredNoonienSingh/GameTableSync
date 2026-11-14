// packages/ui/components/game/BattleCompanionMtg.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import {
  Paper,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  ActionIcon,
  SegmentedControl,
  ScrollArea,
  Box,
  Tooltip,
  Modal,
  Table,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconSwords,
  IconBolt,
  IconClock,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlus,
  IconMinus,
  IconRefresh,
  IconChevronRight,
  IconCrown,
  IconFlame,
  IconListDetails,
  IconSettings,
  IconArrowLeft,
  IconMaximize,
  IconMinimize,
  IconTrophy,
  IconSun,
  IconMoon,
  IconDice,
  IconShield,
  IconSparkles,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { BattleLandscapeGuard, formatBattleClock } from './battle-hud';
import { DEFAULT_MTG_SETTINGS, type GameMtgSettings } from './GameMtgSetupModal';

export type MtgManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
export type MtgPhaseId = 'Beginning' | 'Main1' | 'Combat' | 'Main2' | 'Ending';
type MtgMobileTab = 'table' | 'log';

export interface MtgDeckCardEntry {
  name: string;
  quantity: number;
  manaCost?: string;
  typeLine: string;
  section: 'Commander' | 'Mainboard' | 'Sideboard';
}

export interface MtgPlayerInput {
  id: string;
  playerName: string;
  deckName: string;
  commanderName?: string;
  colorIdentity: MtgManaColor[];
  cards: MtgDeckCardEntry[];
}

export interface BattleCompanionMtgProps {
  players: MtgPlayerInput[];
  settings?: GameMtgSettings;
  onBack?: () => void;
  backLabel?: string;
  onOpenSettings?: () => void;
}

interface MtgSeatLiveState {
  life: number;
  poison: number;
  commanderTax: number;
  gameWins: number;
  commanderDamageFrom: Record<string, number>;
}

const MTG_PHASES: MtgPhaseId[] = ['Beginning', 'Main1', 'Combat', 'Main2', 'Ending'];

const MTG_PHASE_ICONS: Record<MtgPhaseId, ReactNode> = {
  Beginning: <IconSun size={14} />,
  Main1: <IconSparkles size={14} />,
  Combat: <IconSwords size={14} />,
  Main2: <IconSparkles size={14} />,
  Ending: <IconMoon size={14} />,
};

function createInitialSeatMap(
  players: MtgPlayerInput[],
  startingLife: number
): Record<string, MtgSeatLiveState> {
  const map: Record<string, MtgSeatLiveState> = {};
  players.forEach((p) => {
    const cmdDmg: Record<string, number> = {};
    players.forEach((opp) => {
      if (opp.id !== p.id) cmdDmg[opp.id] = 0;
    });
    map[p.id] = {
      life: startingLife,
      poison: 0,
      commanderTax: 0,
      gameWins: 0,
      commanderDamageFrom: cmdDmg,
    };
  });
  return map;
}

export function BattleCompanionMtg({
  players,
  settings = DEFAULT_MTG_SETTINGS,
  onBack,
  backLabel,
  onOpenSettings,
}: BattleCompanionMtgProps) {
  const t = useTranslations('BattleCompanionMtg');
  const isCompactHud = useMediaQuery('(max-width: 64em), (max-height: 520px)');
  const isPhone = useMediaQuery('(max-width: 56em), (max-height: 520px)');

  const activePlayers = players.slice(0, settings.playerCount);
  const isCommanderMode =
    settings.format === 'Commander / EDH' || settings.trackCommanderDamage;

  const [mobileTab, setMobileTab] = useState<MtgMobileTab>('table');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        if (
          typeof screen !== 'undefined' &&
          'orientation' in screen &&
          typeof (screen.orientation as any).unlock === 'function'
        ) {
          (screen.orientation as any).unlock();
        }
      } else {
        await document.documentElement.requestFullscreen();
        if (
          typeof screen !== 'undefined' &&
          'orientation' in screen &&
          typeof (screen.orientation as any).lock === 'function'
        ) {
          await (screen.orientation as any).lock('landscape');
        }
      }
    } catch {
      // Ignored if browser blocks orientation lock
    }
  };

  // Turn, Phase & Global Table Designations
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [activeSeatIdx, setActiveSeatIdx] = useState<number>(0);
  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [stormCount, setStormCount] = useState<number>(0);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [monarchPlayerId, setMonarchPlayerId] = useState<string | null>(null);
  const [initiativePlayerId, setInitiativePlayerId] = useState<string | null>(null);
  const [deckModalPlayer, setDeckModalPlayer] = useState<MtgPlayerInput | null>(null);

  // Clamp activeSeatIdx when switching from 4 players to 2 players so the button never loses its label!
  useEffect(() => {
    if (activeSeatIdx >= settings.playerCount) {
      setActiveSeatIdx(0);
    }
  }, [settings.playerCount, activeSeatIdx]);

  const safeSeatIdx = activeSeatIdx >= activePlayers.length ? 0 : activeSeatIdx;

  // Per-Seat Live State
  const [seatStates, setSeatStates] = useState<Record<string, MtgSeatLiveState>>(() =>
    createInitialSeatMap(players, settings.startingLife)
  );

  useEffect(() => {
    setSeatStates(createInitialSeatMap(players, settings.startingLife));
  }, [players, settings.startingLife]);

  // Per-Seat Chess Clock
  const [clockRunning, setClockRunning] = useState<boolean>(false);
  const [seatSeconds, setSeatSeconds] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    players.forEach((p) => {
      m[p.id] = settings.clockMinutesPerPlayer * 60;
    });
    return m;
  });

  useEffect(() => {
    const m: Record<string, number> = {};
    players.forEach((p) => {
      m[p.id] = settings.clockMinutesPerPlayer * 60;
    });
    setSeatSeconds(m);
  }, [players, settings.clockMinutesPerPlayer]);

  useEffect(() => {
    if (!clockRunning || settings.clockMode === 'off') return;
    const activePlayer = activePlayers[safeSeatIdx];
    if (!activePlayer) return;

    const timer = setInterval(() => {
      setSeatSeconds((prev) => ({
        ...prev,
        [activePlayer.id]: Math.max(0, (prev[activePlayer.id] ?? 0) - 1),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [clockRunning, safeSeatIdx, activePlayers, settings.clockMode]);

  // Match Log
  const [battleLog, setBattleLog] = useState<string[]>([
    `${settings.format} (${settings.startingLife} LP) — ${activePlayers[0]?.playerName ?? ''} Priority.`,
  ]);

  const appendLog = (entry: string) => {
    setBattleLog((prev) => [entry, ...prev.slice(0, 29)]);
  };

  const phaseLabels: Record<MtgPhaseId, string> = {
    Beginning: t('phases.beginning'),
    Main1: t('phases.main1'),
    Combat: t('phases.combat'),
    Main2: t('phases.main2'),
    Ending: t('phases.ending'),
  };

  const handlePassTurn = () => {
    const nextSeat = (safeSeatIdx + 1) % activePlayers.length;
    const nextTurn = nextSeat === 0 ? turnNumber + 1 : turnNumber;
    setPhaseIdx(0);
    setStormCount(0);
    setActiveSeatIdx(nextSeat);
    setTurnNumber(nextTurn);
    appendLog(`[T${nextTurn}] → ${activePlayers[nextSeat]?.playerName ?? ''}`);
  };

  const handleAdvancePhase = () => {
    if (phaseIdx < MTG_PHASES.length - 1) {
      setPhaseIdx(phaseIdx + 1);
    } else {
      handlePassTurn();
    }
  };

  const adjustLife = (player: MtgPlayerInput, delta: number) => {
    setSeatStates((prev) => {
      const cur = prev[player.id];
      if (!cur) return prev;
      return {
        ...prev,
        [player.id]: { ...cur, life: cur.life + delta },
      };
    });
    appendLog(`${player.playerName}: ${delta > 0 ? `+${delta}` : delta} LP`);
  };

  const adjustCounter = (
    player: MtgPlayerInput,
    field: 'poison' | 'commanderTax' | 'gameWins',
    delta: number
  ) => {
    setSeatStates((prev) => {
      const cur = prev[player.id];
      if (!cur) return prev;
      const nextVal = Math.max(0, cur[field] + delta);
      return {
        ...prev,
        [player.id]: { ...cur, [field]: nextVal },
      };
    });
  };

  const adjustCommanderDamage = (
    victim: MtgPlayerInput,
    source: MtgPlayerInput,
    delta: number
  ) => {
    setSeatStates((prev) => {
      const cur = prev[victim.id];
      if (!cur) return prev;
      const prevDmg = cur.commanderDamageFrom[source.id] ?? 0;
      const nextDmg = Math.max(0, prevDmg + delta);
      const actualDelta = nextDmg - prevDmg;
      if (actualDelta === 0) return prev;
      return {
        ...prev,
        [victim.id]: {
          ...cur,
          life: cur.life - actualDelta,
          commanderDamageFrom: {
            ...cur.commanderDamageFrom,
            [source.id]: nextDmg,
          },
        },
      };
    });
    if (delta > 0) {
      appendLog(`${source.playerName} → ${victim.playerName}: +${delta} Cmdr Dmg`);
    }
  };

  const handleRollD20 = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    appendLog(`D20 Roll: [${roll}]`);
  };

  const handleResetGame = () => {
    setSeatStates(createInitialSeatMap(players, settings.startingLife));
    setTurnNumber(1);
    setActiveSeatIdx(0);
    setPhaseIdx(0);
    setStormCount(0);
    setMonarchPlayerId(null);
    setInitiativePlayerId(null);
    appendLog(`=== ${t('resetGame')} (${settings.startingLife} LP) ===`);
  };

  const isSeatEliminated = (st: MtgSeatLiveState): boolean => {
    if (st.life <= 0 || st.poison >= 10) return true;
    if (isCommanderMode) {
      return Object.values(st.commanderDamageFrom).some((dmg) => dmg >= 21);
    }
    return false;
  };

  return (
    <Box className="gts-battle-hud">
      {/* 0. PORTRAIT PHONE BLOCKER */}
      <BattleLandscapeGuard
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onBack={onBack}
        backLabel={backLabel}
      />

      {/* 1. SINGLE-ROW TOP HUD BAR */}
      <Paper
        px="xs"
        py={4}
        radius="md"
        className="gts-battle-topbar gts-mtg-topbar-seat-color"
        data-active-seat={safeSeatIdx}
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
                  onClick={() => setTurnNumber((n) => Math.max(1, n - 1))}
                >
                  <IconMinus size={10} />
                </ActionIcon>
                <Text size="xs" fw={900} className="brand-logo">
                  {turnNumber}
                </Text>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => setTurnNumber((n) => n + 1)}
                >
                  <IconPlus size={10} />
                </ActionIcon>
              </Group>
            </div>

            <Button
              size="compact-xs"
              variant="filled"
              color={
                safeSeatIdx === 0
                  ? 'brandBlue.6'
                  : safeSeatIdx === 1
                    ? 'red.6'
                    : safeSeatIdx === 2
                      ? 'teal.6'
                      : 'yellow.6'
              }
              className="brand-logo"
              onClick={handlePassTurn}
            >
              {activePlayers[safeSeatIdx]?.playerName} →
            </Button>
          </Group>

          <div className="gts-battle-phase-scroll">
            {MTG_PHASES.map((phase, idx) => (
              <Tooltip key={phase} label={phaseLabels[phase]}>
                <button
                  type="button"
                  className="brand-logo gts-battle-phase-step"
                  data-active={idx === phaseIdx ? 'true' : undefined}
                  onClick={() => setPhaseIdx(idx)}
                >
                  {MTG_PHASE_ICONS[phase]}
                  <span className="gts-battle-phase-label">{phaseLabels[phase]}</span>
                </button>
              </Tooltip>
            ))}

            <ActionIcon
              size="sm"
              variant="default"
              className="gts-game-cta-join"
              onClick={handleAdvancePhase}
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
                  onClick={() => setStormCount((s) => Math.max(0, s - 1))}
                >
                  <IconMinus size={10} />
                </ActionIcon>
                <Text size="xs" fw={900} className="brand-logo">
                  {stormCount}
                </Text>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => setStormCount((s) => s + 1)}
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
                onClick={() => {
                  setIsNight((n) => !n);
                  appendLog(!isNight ? `🌙 ${t('night')}` : `☀️ ${t('day')}`);
                }}
              >
                {isNight ? <IconMoon size={13} /> : <IconSun size={13} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t('rollD20')}>
              <ActionIcon size="sm" variant="default" onClick={handleRollD20}>
                <IconDice size={14} />
              </ActionIcon>
            </Tooltip>

            {settings.clockMode !== 'off' && (
              <ActionIcon
                size="sm"
                variant="light"
                color={clockRunning ? 'teal' : 'gray'}
                onClick={() => setClockRunning((r) => !r)}
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
              <ActionIcon size="sm" variant="subtle" onClick={handleResetGame}>
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t('fullscreen')}>
              <ActionIcon
                size="sm"
                variant={isFullscreen ? 'filled' : 'subtle'}
                color={isFullscreen ? 'brandBlue.6' : undefined}
                onClick={handleToggleFullscreen}
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

      {/* 1B. COMPACT TAB SWITCHER */}
      {isCompactHud && (
        <SegmentedControl
          fullWidth
          size="xs"
          value={mobileTab}
          onChange={(val) => setMobileTab(val as MtgMobileTab)}
          className="brand-logo"
          data={[
            {
              label: (
                <Group gap={5} justify="center" wrap="nowrap">
                  <IconTrophy size={12} />
                  <span>
                    {t('tabs.battlefield')} ({settings.format})
                  </span>
                </Group>
              ),
              value: 'table',
            },
            {
              label: (
                <Group gap={5} justify="center" wrap="nowrap">
                  <IconFlame size={12} />
                  <span>{t('tabs.log')}</span>
                </Group>
              ),
              value: 'log',
            },
          ]}
        />
      )}

      {/* 2. MAIN WORKSPACE: 2-SEAT (1V1) OR 4-SEAT (COMMANDER POD) GRID */}
      {(!isCompactHud || mobileTab === 'table') && (
        <div className="gts-mtg-workspace" data-seats={settings.playerCount}>
          {activePlayers.map((player, seatIdx) => {
            const st = seatStates[player.id] ?? {
              life: settings.startingLife,
              poison: 0,
              commanderTax: 0,
              gameWins: 0,
              commanderDamageFrom: {},
            };
            const isTurn = safeSeatIdx === seatIdx;
            const eliminated = isSeatEliminated(st);
            const isMonarch = monarchPlayerId === player.id;
            const hasInitiative = initiativePlayerId === player.id;
            const opponents = activePlayers.filter((p) => p.id !== player.id);

            return (
              <div
                key={player.id}
                className="gts-mtg-seat-card"
                data-seat={seatIdx}
                data-seats={settings.playerCount}
                data-active-turn={isTurn ? 'true' : undefined}
                data-eliminated={eliminated ? 'true' : undefined}
              >
                {/* Seat Header */}
                <Group justify="space-between" wrap="nowrap" gap={6}>
                  <Group gap={5} wrap="nowrap" miw={0}>
                    <Title
                      order={6}
                      className="brand-logo gts-army-title"
                      td={eliminated ? 'line-through' : undefined}
                    >
                      {player.playerName.toUpperCase()}
                    </Title>
                    <Group gap={2} wrap="nowrap">
                      {player.colorIdentity.map((mana) => (
                        <span
                          key={mana}
                          className="gts-mtg-mana-dot"
                          data-mana={mana}
                        >
                          {mana}
                        </span>
                      ))}
                    </Group>
                    {!isPhone && (
                      <Badge
                        variant="outline"
                        size="xs"
                        className="gts-game-meta-tag"
                        maw={140}
                      >
                        {player.commanderName || player.deckName}
                      </Badge>
                    )}
                  </Group>

                  <Group gap={4} wrap="nowrap">
                    {eliminated && (
                      <Badge size="xs" color="red" variant="filled">
                        {t('defeated')}
                      </Badge>
                    )}

                    {settings.trackMonarchAndInitiative && (
                      <>
                        <Tooltip label={t('monarch')}>
                          <ActionIcon
                            size="xs"
                            color={isMonarch ? 'yellow' : 'gray'}
                            variant={isMonarch ? 'filled' : 'default'}
                            onClick={() =>
                              setMonarchPlayerId(isMonarch ? null : player.id)
                            }
                          >
                            <IconCrown size={11} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('initiative')}>
                          <ActionIcon
                            size="xs"
                            color={hasInitiative ? 'teal' : 'gray'}
                            variant={hasInitiative ? 'filled' : 'default'}
                            onClick={() =>
                              setInitiativePlayerId(
                                hasInitiative ? null : player.id
                              )
                            }
                          >
                            <IconShield size={11} />
                          </ActionIcon>
                        </Tooltip>
                      </>
                    )}

                    <Button
                      size="compact-xs"
                      variant="light"
                      leftSection={<IconListDetails size={11} />}
                      className="brand-logo"
                      onClick={() => setDeckModalPlayer(player)}
                    >
                      {t('decklist')}
                    </Button>

                    {settings.clockMode !== 'off' && (
                      <div
                        className="gts-battle-clock"
                        data-running={clockRunning && isTurn ? 'true' : undefined}
                      >
                        <Group gap={3} wrap="nowrap">
                          <IconClock size={10} />
                          <span>
                            {formatBattleClock(seatSeconds[player.id] ?? 0)}
                          </span>
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
                      onClick={() => adjustLife(player, -5)}
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      className="gts-mtg-life-step-btn"
                      onClick={() => adjustLife(player, -1)}
                    >
                      -1
                    </button>
                  </Group>

                  <div className="gts-mtg-life-val">{st.life}</div>

                  <Group gap={4} wrap="nowrap">
                    <button
                      type="button"
                      className="gts-mtg-life-step-btn"
                      onClick={() => adjustLife(player, 1)}
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      className="gts-mtg-life-step-btn"
                      onClick={() => adjustLife(player, 5)}
                    >
                      +5
                    </button>
                  </Group>
                </div>

                {/* Overflow-Proof 2-Column Counter Row (Poison + Commander Tax OR Bo3 Game Wins) */}
                <div className="gts-mtg-bottom-grid">
                  {/* Poison Counter (10 = Lethal in all formats) */}
                  <div className="gts-mtg-counter-pill">
                    <Text size="9px" fw={700} className="brand-logo" c="teal.4" truncate>
                      {t('poison')} (10)
                    </Text>
                    <Group gap={3} wrap="nowrap">
                      <button
                        type="button"
                        className="gts-mtg-mini-step-btn"
                        onClick={() => adjustCounter(player, 'poison', -1)}
                      >
                        <IconMinus size={10} />
                      </button>
                      <span className="gts-mtg-counter-pill-val">{st.poison}</span>
                      <button
                        type="button"
                        className="gts-mtg-mini-step-btn"
                        onClick={() => adjustCounter(player, 'poison', 1)}
                      >
                        <IconPlus size={10} />
                      </button>
                    </Group>
                  </div>

                  {/* Format-Specific Second Counter: Commander Tax (EDH) OR Games Won (1v1 Bo3) */}
                  {isCommanderMode ? (
                    <div className="gts-mtg-counter-pill">
                      <Text size="9px" fw={700} className="brand-logo" c="yellow.4" truncate>
                        {t('cmdTax')} (+{st.commanderTax * 2})
                      </Text>
                      <Group gap={3} wrap="nowrap">
                        <button
                          type="button"
                          className="gts-mtg-mini-step-btn"
                          onClick={() => adjustCounter(player, 'commanderTax', -1)}
                        >
                          <IconMinus size={10} />
                        </button>
                        <span className="gts-mtg-counter-pill-val">
                          {st.commanderTax}x
                        </span>
                        <button
                          type="button"
                          className="gts-mtg-mini-step-btn"
                          onClick={() => adjustCounter(player, 'commanderTax', 1)}
                        >
                          <IconPlus size={10} />
                        </button>
                      </Group>
                    </div>
                  ) : (
                    <div className="gts-mtg-counter-pill">
                      <Text size="9px" fw={700} className="brand-logo" c="yellow.4" truncate>
                        {t('gameWins')}
                      </Text>
                      <Group gap={3} wrap="nowrap">
                        <button
                          type="button"
                          className="gts-mtg-mini-step-btn"
                          onClick={() => adjustCounter(player, 'gameWins', -1)}
                        >
                          <IconMinus size={10} />
                        </button>
                        <span className="gts-mtg-counter-pill-val">
                          {st.gameWins}
                        </span>
                        <button
                          type="button"
                          className="gts-mtg-mini-step-btn"
                          onClick={() => adjustCounter(player, 'gameWins', 1)}
                        >
                          <IconPlus size={10} />
                        </button>
                      </Group>
                    </div>
                  )}
                </div>

                {/* Commander Damage Row (Only shown in Commander / EDH mode, fits without clipping!) */}
                {isCommanderMode && opponents.length > 0 && (
                  <div className="gts-mtg-cmd-dmg-row">
                    {opponents.map((opp) => {
                      const dmg = st.commanderDamageFrom[opp.id] ?? 0;
                      const isLethal = dmg >= 21;
                      return (
                        <div
                          key={opp.id}
                          className="gts-mtg-cmd-dmg-box"
                          data-lethal={isLethal ? 'true' : undefined}
                        >
                          <Text size="9px" fw={700} truncate>
                            ⚔ {opp.playerName}
                          </Text>
                          <Group gap={2} wrap="nowrap">
                            <button
                              type="button"
                              className="gts-mtg-mini-step-btn"
                              onClick={() => adjustCommanderDamage(player, opp, -1)}
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
                              onClick={() => adjustCommanderDamage(player, opp, 1)}
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
          })}
        </div>
      )}

      {/* 3. MOBILE / COMPACT MATCH LOG TAB */}
      {isCompactHud && mobileTab === 'log' && (
        <Paper p="sm" radius="md" className="gts-army-panel gts-battle-datasheet-scroll">
          <Group gap="xs" mb="xs">
            <IconFlame size={15} color="var(--gts-accent)" />
            <Text size="xs" fw={700} className="brand-logo">
              {t('tabs.log')}
            </Text>
          </Group>
          <ScrollArea h="100%">
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
      )}

      {/* 4. DECKLIST INSPECTOR MODAL */}
      <Modal
        opened={deckModalPlayer !== null}
        onClose={() => setDeckModalPlayer(null)}
        size="xl"
        centered
        title={
          <Group gap="xs">
            <IconListDetails size={18} color="var(--gts-accent)" />
            <Text fw={700} className="brand-logo">
              {deckModalPlayer?.deckName.toUpperCase()} —{' '}
              {deckModalPlayer?.playerName.toUpperCase()}
            </Text>
          </Group>
        }
        classNames={{
          content: 'gts-modal-content',
          header: 'gts-modal-header',
        }}
      >
        {deckModalPlayer && (
          <ScrollArea.Autosize mah="75dvh" offsetScrollbars>
            <Stack gap="md">
              {deckModalPlayer.commanderName && (
                <Paper p="sm" radius="md" className="gts-subsection-paper">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCrown size={16} color="#ffd43b" />
                      <Text size="xs" fw={700} className="brand-logo" c="dimmed">
                        COMMANDER:
                      </Text>
                      <Text size="sm" fw={800}>
                        {deckModalPlayer.commanderName}
                      </Text>
                    </Group>
                    <Group gap={4}>
                      {deckModalPlayer.colorIdentity.map((mana) => (
                        <span
                          key={mana}
                          className="gts-mtg-mana-dot"
                          data-mana={mana}
                        >
                          {mana}
                        </span>
                      ))}
                    </Group>
                  </Group>
                </Paper>
              )}

              <Table
                withRowBorders={true}
                classNames={{
                  thead: 'gts-army-table-head',
                  th: 'gts-army-table-th',
                  td: 'gts-army-table-td',
                }}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th ta="center" w={60}>
                      Qty
                    </Table.Th>
                    <Table.Th>Card Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th ta="center">Mana</Table.Th>
                    <Table.Th ta="right">Section</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {deckModalPlayer.cards.map((card, i) => (
                    <Table.Tr key={`${card.name}-${i}`}>
                      <Table.Td ta="center" fw={700}>
                        {card.quantity}x
                      </Table.Td>
                      <Table.Td fw={700}>{card.name}</Table.Td>
                      <Table.Td>{card.typeLine}</Table.Td>
                      <Table.Td ta="center">{card.manaCost || '-'}</Table.Td>
                      <Table.Td ta="right">
                        <Badge size="xs" variant="outline">
                          {card.section}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Modal>
    </Box>
  );
}