// packages/ui/components/game/BattleCompanionMtg.tsx
'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  Paper,
  Group,
  Stack,
  Text,
  SegmentedControl,
  ScrollArea,
  Box,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconSwords,
  IconFlame,
  IconTrophy,
  IconSun,
  IconMoon,
  IconSparkles,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { BattleLandscapeGuard, BattleDiceRollerModal } from './battle-hud';
import { DEFAULT_MTG_SETTINGS, type GameMtgSettings } from './GameMtgSetupModal';
import {
  MtgTopBar,
  MtgPlayerSeatCard,
  MtgDecklistModal,
  createInitialSeatMap,
  isMtgSeatEliminated,
  type MtgManaColor,
  type MtgPhaseId,
  type MtgMobileTab,
  type MtgDeckCardEntry,
  type MtgPlayerInput,
  type MtgSeatLiveState,
} from './mtg-hud';

export type { MtgManaColor, MtgPhaseId, MtgDeckCardEntry, MtgPlayerInput };

export interface BattleCompanionMtgProps {
  players: MtgPlayerInput[];
  settings?: GameMtgSettings;
  onBack?: () => void;
  backLabel?: string;
  onOpenSettings?: () => void;
}

const MTG_PHASES: MtgPhaseId[] = ['Beginning', 'Main1', 'Combat', 'Main2', 'Ending'];

const MTG_PHASE_ICONS: Record<MtgPhaseId, ReactNode> = {
  Beginning: <IconSun size={14} />,
  Main1: <IconSparkles size={14} />,
  Combat: <IconSwords size={14} />,
  Main2: <IconSparkles size={14} />,
  Ending: <IconMoon size={14} />,
};

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

  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [activeSeatIdx, setActiveSeatIdx] = useState<number>(0);
  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [stormCount, setStormCount] = useState<number>(0);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [monarchPlayerId, setMonarchPlayerId] = useState<string | null>(null);
  const [initiativePlayerId, setInitiativePlayerId] = useState<string | null>(null);
  const [deckModalPlayer, setDeckModalPlayer] = useState<MtgPlayerInput | null>(null);
  const [diceModalOpen, setDiceModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeSeatIdx >= settings.playerCount) {
      setActiveSeatIdx(0);
    }
  }, [settings.playerCount, activeSeatIdx]);

  const safeSeatIdx = activeSeatIdx >= activePlayers.length ? 0 : activeSeatIdx;

  const [seatStates, setSeatStates] = useState<Record<string, MtgSeatLiveState>>(() =>
    createInitialSeatMap(players, settings.startingLife)
  );

  useEffect(() => {
    setSeatStates(createInitialSeatMap(players, settings.startingLife));
  }, [players, settings.startingLife]);

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

  const [battleLog, setBattleLog] = useState<string[]>([
    `${settings.format} (${settings.startingLife} LP) — ${activePlayers[0]?.playerName ?? ''} Priority.`,
  ]);

  const appendLog = (entry: string) => {
    setBattleLog((prev) => [entry, ...prev.slice(0, 29)]);
  };

  const phaseItems = useMemo(
    () =>
      MTG_PHASES.map((p) => ({
        id: p,
        label: t(`phases.${p.toLowerCase()}` as any),
        icon: MTG_PHASE_ICONS[p],
      })),
    [t]
  );

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

  return (
    <Box className="gts-battle-hud">
      <BattleLandscapeGuard
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onBack={onBack}
        backLabel={backLabel}
      />

      <MtgTopBar
        turnNumber={turnNumber}
        onChangeTurnNumber={setTurnNumber}
        activeSeatIdx={safeSeatIdx}
        activePlayerName={activePlayers[safeSeatIdx]?.playerName}
        onPassTurn={handlePassTurn}
        phases={phaseItems}
        phaseIdx={phaseIdx}
        onSelectPhase={setPhaseIdx}
        onAdvancePhase={handleAdvancePhase}
        stormCount={stormCount}
        onChangeStormCount={setStormCount}
        isNight={isNight}
        onToggleNight={() => {
          setIsNight((n) => !n);
          appendLog(!isNight ? `🌙 ${t('night')}` : `☀️ ${t('day')}`);
        }}
        onRollD20={() => setDiceModalOpen(true)}
        clockEnabled={settings.clockMode !== 'off'}
        clockRunning={clockRunning}
        onToggleClock={() => setClockRunning((r) => !r)}
        onResetGame={handleResetGame}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isPhone={Boolean(isPhone)}
        onOpenSettings={onOpenSettings}
        onBack={onBack}
        backLabel={backLabel}
      />

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
            const opponents = activePlayers.filter((p) => p.id !== player.id);

            return (
              <MtgPlayerSeatCard
                key={player.id}
                player={player}
                seatIdx={seatIdx}
                totalSeats={settings.playerCount}
                state={st}
                opponents={opponents}
                isTurn={safeSeatIdx === seatIdx}
                eliminated={isMtgSeatEliminated(st, isCommanderMode)}
                isCommanderMode={isCommanderMode}
                trackMonarchAndInitiative={settings.trackMonarchAndInitiative}
                isMonarch={monarchPlayerId === player.id}
                onToggleMonarch={() =>
                  setMonarchPlayerId((id) => (id === player.id ? null : player.id))
                }
                hasInitiative={initiativePlayerId === player.id}
                onToggleInitiative={() =>
                  setInitiativePlayerId((id) => (id === player.id ? null : player.id))
                }
                clockEnabled={settings.clockMode !== 'off'}
                clockRunning={clockRunning}
                secondsRemaining={seatSeconds[player.id] ?? 0}
                isPhone={Boolean(isPhone)}
                onOpenDeckModal={() => setDeckModalPlayer(player)}
                onAdjustLife={(delta) => adjustLife(player, delta)}
                onAdjustCounter={(field, delta) => adjustCounter(player, field, delta)}
                onAdjustCommanderDamage={(sourceOpp, delta) =>
                  adjustCommanderDamage(player, sourceOpp, delta)
                }
              />
            );
          })}
        </div>
      )}

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

      <MtgDecklistModal
        player={deckModalPlayer}
        opened={deckModalPlayer !== null}
        onClose={() => setDeckModalPlayer(null)}
      />

      <BattleDiceRollerModal
        opened={diceModalOpen}
        onClose={() => setDiceModalOpen(false)}
        initialDiceType="D20"
        initialCount={1}
        onRollComplete={(res) =>
          appendLog(
            `🎲 ${res.count}×${res.diceType}: [${res.rolls.join(', ')}] (Total: ${res.total})`
          )
        }
      />
    </Box>
  );
}