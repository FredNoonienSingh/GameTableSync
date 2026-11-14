// packages/ui/components/game/BattleCompanion40k.tsx
'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Box, Group, SegmentedControl, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconSwords,
  IconBolt,
  IconChevronsRight,
  IconCrown,
  IconCrosshair,
  IconFlame,
  IconTrophy,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { ParsedUnit } from '../army-viewer/armyParser';
import { DEFAULT_40K_SETTINGS, type Game40kSettings } from './Game40kSetupModal';
import {
  BattleLandscapeGuard,
  BattleTopBar,
  BattleScoreboard,
  BattleRosterSidebar,
  BattleUnitInspector,
  BattleStratagemsLog,
  BattleCompareModal,
  BattleArmyViewerModal,
  createInitialUnitStatus,
  type MobileHudTab,
  type SecondaryMissionCard,
  type BattleCompanionArmyInput,
  type UnitLiveStatus,
  type QuickActionItem,
  type CommanderScoreState,
} from './battle-hud';

export type BattlePhase40k = 'Command' | 'Movement' | 'Shooting' | 'Charge' | 'Fight';
export type { SecondaryMissionCard, BattleCompanionArmyInput };

export interface BattleCompanion40kProps {
  playerArmy: BattleCompanionArmyInput;
  opponentArmy: BattleCompanionArmyInput;
  settings?: Game40kSettings;
  onBack?: () => void;
  backLabel?: string;
  onOpenSettings?: () => void;
  onInspectFullArmy?: (side: 'player' | 'opponent') => void;
}

const PHASES: BattlePhase40k[] = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight'];

const PHASE_ICONS: Record<BattlePhase40k, ReactNode> = {
  Command: <IconCrown size={14} />,
  Movement: <IconChevronsRight size={14} />,
  Shooting: <IconCrosshair size={14} />,
  Charge: <IconBolt size={14} />,
  Fight: <IconSwords size={14} />,
};

const CORE_STRATAGEMS: QuickActionItem[] = [
  { id: 'reroll', name: 'Command Re-roll', cost: 1, phase: 'Any' },
  { id: 'overwatch', name: 'Fire Overwatch', cost: 1, phase: 'Move / Charge' },
  { id: 'interrupt', name: 'Counter-Offensive', cost: 2, phase: 'Fight' },
  { id: 'insane', name: 'Insane Bravery', cost: 1, phase: 'Command' },
  { id: 'grenade', name: 'Grenade', cost: 1, phase: 'Shooting' },
  { id: 'tankshock', name: 'Tank Shock', cost: 1, phase: 'Charge' },
  { id: 'heroic', name: 'Heroic Intervention', cost: 1, phase: 'Charge' },
  { id: 'goToGround', name: 'Go to Ground', cost: 1, phase: 'Shooting' },
];

const TACTICAL_DECK_POOL: Omit<SecondaryMissionCard, 'scoredVp'>[] = [
  { id: 'assassination', name: 'Assassination', maxVp: 5 },
  { id: 'bring-it-down', name: 'Bring It Down', maxVp: 4 },
  { id: 'engage-all-fronts', name: 'Engage on All Fronts', maxVp: 4 },
  { id: 'behind-enemy-lines', name: 'Behind Enemy Lines', maxVp: 5 },
  { id: 'storm-hostile', name: 'Storm Hostile Objective', maxVp: 5 },
  { id: 'cleanse', name: 'Cleanse', maxVp: 5 },
  { id: 'area-denial', name: 'Area Denial', maxVp: 5 },
  { id: 'no-prisoners', name: 'No Prisoners', maxVp: 5 },
  { id: 'extend-battle-lines', name: 'Extend Battle Lines', maxVp: 5 },
  { id: 'marked-for-death', name: 'Marked for Death', maxVp: 5 },
];

function calculateWtcDifferential(p1Total: number, p2Total: number): [number, number] {
  const diff = Math.abs(p1Total - p2Total);
  let winnerWtc = 10;
  if (diff >= 6 && diff <= 10) winnerWtc = 11;
  else if (diff >= 11 && diff <= 15) winnerWtc = 12;
  else if (diff >= 16 && diff <= 20) winnerWtc = 13;
  else if (diff >= 21 && diff <= 25) winnerWtc = 14;
  else if (diff >= 26 && diff <= 30) winnerWtc = 15;
  else if (diff >= 31 && diff <= 35) winnerWtc = 16;
  else if (diff >= 36 && diff <= 40) winnerWtc = 17;
  else if (diff >= 41 && diff <= 45) winnerWtc = 18;
  else if (diff >= 46 && diff <= 50) winnerWtc = 19;
  else if (diff > 50) winnerWtc = 20;

  const loserWtc = 20 - winnerWtc;
  return p1Total >= p2Total ? [winnerWtc, loserWtc] : [loserWtc, winnerWtc];
}

export function BattleCompanion40k({
  playerArmy,
  opponentArmy,
  settings = DEFAULT_40K_SETTINGS,
  onBack,
  backLabel,
  onOpenSettings,
  onInspectFullArmy,
}: BattleCompanion40kProps) {
  const t = useTranslations('BattleCompanion40k');

  const isPhone = useMediaQuery('(max-width: 56em), (max-height: 520px)');
  const isCompactHud = useMediaQuery('(max-width: 64em), (max-height: 520px)');

  const [mobileTab, setMobileTab] = useState<MobileHudTab>('units');
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

  const [scoreboardCollapsed, setScoreboardCollapsed] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [ownListOpen, setOwnListOpen] = useState<boolean>(true);
  const [enemyListOpen, setEnemyListOpen] = useState<boolean>(true);
  const [bottomTrayOpen, setBottomTrayOpen] = useState<boolean>(false);

  const [battleRound, setBattleRound] = useState<number>(1);
  const [activeSide, setActiveSide] = useState<'player' | 'opponent'>(settings.firstTurnSide);
  const [phaseIdx, setPhaseIdx] = useState<number>(0);

  const [activeDoctrina, setActiveDoctrina] = useState<'Protector' | 'Conqueror'>('Protector');
  const [activeCanticle, setActiveCanticle] = useState<string>('Shroudpsalm');

  const [p1Cp, setP1Cp] = useState<number>(settings.startingCp + 1);
  const [p1PrimaryVp, setP1PrimaryVp] = useState<number>(0);
  const [p1SecondaryVp, setP1SecondaryVp] = useState<number>(0);
  const [p1Painted, setP1Painted] = useState<boolean>(settings.battleReadyPaintedPlayer);
  const [p1Secondaries, setP1Secondaries] = useState<SecondaryMissionCard[]>(
    playerArmy.initialSecondaries ?? [
      { id: 'engage-all-fronts', name: 'Engage on All Fronts', maxVp: 4, scoredVp: 0 },
      { id: 'cleanse', name: 'Cleanse', maxVp: 5, scoredVp: 0 },
    ]
  );

  const [p2Cp, setP2Cp] = useState<number>(settings.startingCp + 1);
  const [p2PrimaryVp, setP2PrimaryVp] = useState<number>(0);
  const [p2SecondaryVp, setP2SecondaryVp] = useState<number>(0);
  const [p2Painted, setP2Painted] = useState<boolean>(settings.battleReadyPaintedOpponent);
  const [p2Secondaries, setP2Secondaries] = useState<SecondaryMissionCard[]>(
    opponentArmy.initialSecondaries ?? [
      { id: 'assassination', name: 'Assassination', maxVp: 5, scoredVp: 0 },
      { id: 'bring-it-down', name: 'Bring It Down', maxVp: 4, scoredVp: 0 },
    ]
  );

  const [clockRunning, setClockRunning] = useState<boolean>(false);
  const [p1Seconds, setP1Seconds] = useState<number>(settings.clockMinutesPerPlayer * 60);
  const [p2Seconds, setP2Seconds] = useState<number>(settings.clockMinutesPerPlayer * 60);

  useEffect(() => {
    setP1Seconds(settings.clockMinutesPerPlayer * 60);
    setP2Seconds(settings.clockMinutesPerPlayer * 60);
  }, [settings.clockMinutesPerPlayer]);

  useEffect(() => {
    if (!clockRunning || settings.clockMode === 'off') return;
    const timer = setInterval(() => {
      if (activeSide === 'player') {
        setP1Seconds((s) => Math.max(0, s - 1));
      } else {
        setP2Seconds((s) => Math.max(0, s - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [clockRunning, activeSide, settings.clockMode]);

  const [unitStatuses, setUnitStatuses] = useState<Record<string, UnitLiveStatus>>(() => {
    const map: Record<string, UnitLiveStatus> = {};
    playerArmy.units.forEach((u) => {
      map[`player:${u.id}`] = createInitialUnitStatus(u);
    });
    opponentArmy.units.forEach((u) => {
      map[`opponent:${u.id}`] = createInitialUnitStatus(u);
    });
    return map;
  });

  useEffect(() => {
    const map: Record<string, UnitLiveStatus> = {};
    playerArmy.units.forEach((u) => {
      map[`player:${u.id}`] = createInitialUnitStatus(u);
    });
    opponentArmy.units.forEach((u) => {
      map[`opponent:${u.id}`] = createInitialUnitStatus(u);
    });
    setUnitStatuses(map);
  }, [playerArmy.units, opponentArmy.units]);

  const [inspectorSide, setInspectorSide] = useState<'player' | 'opponent'>('player');
  const [selectedPlayerUnitId, setSelectedPlayerUnitId] = useState<string>(
    playerArmy.units[0]?.id ?? ''
  );
  const [selectedOpponentUnitId, setSelectedOpponentUnitId] = useState<string>(
    opponentArmy.units[0]?.id ?? ''
  );

  useEffect(() => {
    if (!playerArmy.units.some((u) => u.id === selectedPlayerUnitId)) {
      setSelectedPlayerUnitId(playerArmy.units[0]?.id ?? '');
    }
  }, [playerArmy.units, selectedPlayerUnitId]);

  useEffect(() => {
    if (!opponentArmy.units.some((u) => u.id === selectedOpponentUnitId)) {
      setSelectedOpponentUnitId(opponentArmy.units[0]?.id ?? '');
    }
  }, [opponentArmy.units, selectedOpponentUnitId]);

  const [swipeDir, setSwipeDir] = useState<number>(0);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [armyViewerModalSide, setArmyViewerModalSide] = useState<'player' | 'opponent' | null>(
    null
  );

  const [battleLog, setBattleLog] = useState<string[]>([
    `11th Ed: ${settings.primaryMission} (${settings.deploymentMap})`,
    `R1 — ${settings.firstTurnSide === 'player' ? playerArmy.playerName : opponentArmy.playerName} (+1 CP)`,
  ]);

  const appendLog = (entry: string) => {
    setBattleLog((prev) => [entry, ...prev.slice(0, 24)]);
  };

  const p1TotalVp = Math.min(
    100,
    Math.min(50, p1PrimaryVp) + Math.min(40, p1SecondaryVp) + (p1Painted ? 10 : 0)
  );
  const p2TotalVp = Math.min(
    100,
    Math.min(50, p2PrimaryVp) + Math.min(40, p2SecondaryVp) + (p2Painted ? 10 : 0)
  );
  const [p1Wtc, p2Wtc] = useMemo(
    () => calculateWtcDifferential(p1TotalVp, p2TotalVp),
    [p1TotalVp, p2TotalVp]
  );

  const phaseItems = useMemo(
    () =>
      PHASES.map((p) => ({
        id: p,
        label: t(`phases.${p.toLowerCase()}` as any),
        icon: PHASE_ICONS[p],
      })),
    [t]
  );

  const handleAdvancePhase = () => {
    if (phaseIdx < PHASES.length - 1) {
      const nextPhase = phaseIdx + 1;
      setPhaseIdx(nextPhase);
      appendLog(
        `[R${battleRound}] ${activeSide === 'player' ? playerArmy.playerName : opponentArmy.playerName} → ${phaseItems[nextPhase].label}`
      );
    } else {
      setPhaseIdx(0);
      if (activeSide === 'player') {
        setActiveSide('opponent');
        setP1Cp((c) => c + 1);
        setP2Cp((c) => c + 1);
        appendLog(`[R${battleRound}] → ${opponentArmy.playerName} (+1 CP)`);
      } else {
        const nextRound = Math.min(5, battleRound + 1);
        setBattleRound(nextRound);
        setActiveSide('player');
        setP1Cp((c) => c + 1);
        setP2Cp((c) => c + 1);
        appendLog(`=== ${t('round')} ${nextRound} === (+1 CP)`);
      }
    }
  };

  const handleUseStratagem = (stratName: string, cost: number) => {
    if (activeSide === 'player') {
      if (p1Cp < cost) return;
      setP1Cp((c) => c - cost);
      appendLog(`${playerArmy.playerName}: [${stratName}] (-${cost} CP)`);
    } else {
      if (p2Cp < cost) return;
      setP2Cp((c) => c - cost);
      appendLog(`${opponentArmy.playerName}: [${stratName}] (-${cost} CP)`);
    }
  };

  const handleDrawSecondary = (side: 'player' | 'opponent') => {
    const current = side === 'player' ? p1Secondaries : p2Secondaries;
    if (current.length >= 2) return;
    const available = TACTICAL_DECK_POOL.filter(
      (card) => !current.some((c) => c.id === card.id)
    );
    if (available.length === 0) return;
    const picked = available[Math.floor(Math.random() * available.length)];
    const newCard: SecondaryMissionCard = { ...picked, scoredVp: 0 };
    if (side === 'player') {
      setP1Secondaries([...current, newCard]);
      appendLog(`${playerArmy.playerName}: +Card [${picked.name}]`);
    } else {
      setP2Secondaries([...current, newCard]);
      appendLog(`${opponentArmy.playerName}: +Card [${picked.name}]`);
    }
  };

  const handleScoreSecondary = (side: 'player' | 'opponent', cardId: string, pts: number) => {
    if (side === 'player') {
      const target = p1Secondaries.find((c) => c.id === cardId);
      setP1SecondaryVp((v) => Math.min(40, v + pts));
      if (settings.secondaryMode === 'Tactical') {
        setP1Secondaries((list) => list.filter((c) => c.id !== cardId));
      }
      appendLog(`${playerArmy.playerName}: +${pts} VP [${target?.name}]`);
    } else {
      const target = p2Secondaries.find((c) => c.id === cardId);
      setP2SecondaryVp((v) => Math.min(40, v + pts));
      if (settings.secondaryMode === 'Tactical') {
        setP2Secondaries((list) => list.filter((c) => c.id !== cardId));
      }
      appendLog(`${opponentArmy.playerName}: +${pts} VP [${target?.name}]`);
    }
  };

  const handleDiscardSecondaryForCp = (side: 'player' | 'opponent', cardId: string) => {
    if (side === 'player') {
      const target = p1Secondaries.find((c) => c.id === cardId);
      setP1Secondaries((list) => list.filter((c) => c.id !== cardId));
      setP1Cp((c) => c + 1);
      appendLog(`${playerArmy.playerName}: Discard [${target?.name}] (+1 CP)`);
    } else {
      const target = p2Secondaries.find((c) => c.id === cardId);
      setP2Secondaries((list) => list.filter((c) => c.id !== cardId));
      setP2Cp((c) => c + 1);
      appendLog(`${opponentArmy.playerName}: Discard [${target?.name}] (+1 CP)`);
    }
  };

  const adjustUnitWounds = (side: 'player' | 'opponent', unit: ParsedUnit, delta: number) => {
    const key = `${side}:${unit.id}`;
    setUnitStatuses((prev) => {
      const cur = prev[key] ?? createInitialUnitStatus(unit);
      const nextWounds = Math.max(0, Math.min(cur.maxWounds, cur.currentWounds + delta));
      const nextModels =
        nextWounds === 0
          ? 0
          : cur.maxModels === 1
            ? 1
            : Math.min(cur.maxModels, Math.max(1, Math.ceil(nextWounds / cur.woundsPerModel)));
      const isNowDestroyed = nextWounds === 0;
      return {
        ...prev,
        [key]: {
          ...cur,
          currentWounds: nextWounds,
          currentModels: nextModels,
          destroyed: isNowDestroyed,
          battleShocked: isNowDestroyed ? false : cur.battleShocked,
        },
      };
    });
  };

  const adjustUnitModels = (side: 'player' | 'opponent', unit: ParsedUnit, delta: number) => {
    const key = `${side}:${unit.id}`;
    setUnitStatuses((prev) => {
      const cur = prev[key] ?? createInitialUnitStatus(unit);
      const nextModels = Math.max(0, Math.min(cur.maxModels, cur.currentModels + delta));
      const nextWounds =
        nextModels === 0
          ? 0
          : Math.min(cur.maxWounds, Math.max(1, nextModels * cur.woundsPerModel));
      const isNowDestroyed = nextModels === 0;
      return {
        ...prev,
        [key]: {
          ...cur,
          currentModels: nextModels,
          currentWounds: nextWounds,
          destroyed: isNowDestroyed,
          battleShocked: isNowDestroyed ? false : cur.battleShocked,
        },
      };
    });
  };

  const toggleUnitBattleShock = (side: 'player' | 'opponent', unit: ParsedUnit) => {
    const key = `${side}:${unit.id}`;
    setUnitStatuses((prev) => {
      const cur = prev[key] ?? createInitialUnitStatus(unit);
      if (cur.destroyed || cur.currentWounds === 0) return prev;
      return {
        ...prev,
        [key]: { ...cur, battleShocked: !cur.battleShocked },
      };
    });
  };

  const handleOpenArmyViewer = (side: 'player' | 'opponent') => {
    if (onInspectFullArmy) {
      onInspectFullArmy(side);
    } else {
      setArmyViewerModalSide(side);
    }
  };

  const playerUnitIndex = Math.max(
    0,
    playerArmy.units.findIndex((u) => u.id === selectedPlayerUnitId)
  );
  const opponentUnitIndex = Math.max(
    0,
    opponentArmy.units.findIndex((u) => u.id === selectedOpponentUnitId)
  );

  const paginateUnit = (direction: number) => {
    setSwipeDir(direction);
    if (inspectorSide === 'player') {
      const list = playerArmy.units;
      if (list.length <= 1) return;
      let nextIdx = playerUnitIndex + direction;
      if (nextIdx < 0) nextIdx = list.length - 1;
      if (nextIdx >= list.length) nextIdx = 0;
      setSelectedPlayerUnitId(list[nextIdx].id);
    } else {
      const list = opponentArmy.units;
      if (list.length <= 1) return;
      let nextIdx = opponentUnitIndex + direction;
      if (nextIdx < 0) nextIdx = list.length - 1;
      if (nextIdx >= list.length) nextIdx = 0;
      setSelectedOpponentUnitId(list[nextIdx].id);
    }
  };

  const selectedPlayerUnit = playerArmy.units[playerUnitIndex] ?? playerArmy.units[0];
  const selectedOpponentUnit = opponentArmy.units[opponentUnitIndex] ?? opponentArmy.units[0];

  const activeInspectedUnit =
    inspectorSide === 'player' ? selectedPlayerUnit : selectedOpponentUnit;

  const activeInspectedStatus = activeInspectedUnit
    ? unitStatuses[`${inspectorSide}:${activeInspectedUnit.id}`] ??
      createInitialUnitStatus(activeInspectedUnit)
    : null;

  const modalArmy = armyViewerModalSide === 'player' ? playerArmy : opponentArmy;

  const playerUnitSelectData = useMemo(
    () =>
      playerArmy.units.map((u) => ({
        value: u.id,
        label: `${u.totalModels > 1 ? `(${u.totalModels}) ` : ''}${u.name} (${u.points} pts)`,
      })),
    [playerArmy.units]
  );

  const opponentUnitSelectData = useMemo(
    () =>
      opponentArmy.units.map((u) => ({
        value: u.id,
        label: `${u.totalModels > 1 ? `(${u.totalModels}) ` : ''}${u.name} (${u.points} pts)`,
      })),
    [opponentArmy.units]
  );

  const renderFactionStanceBar = (army: BattleCompanionArmyInput) => {
    const isAdMech = army.metadata.faction.toLowerCase().includes('mechanicus');
    const isChaos = army.metadata.faction.toLowerCase().includes('chaos');

    if (isAdMech) {
      return (
        <Group justify="space-between" wrap="wrap" gap={4}>
          <div className="gts-stance-pill-group">
            {(['Protector', 'Conqueror'] as const).map((doc) => (
              <button
                key={doc}
                type="button"
                className="gts-stance-pill"
                data-active={activeDoctrina === doc ? 'true' : undefined}
                onClick={() => {
                  setActiveDoctrina(doc);
                  appendLog(`${army.playerName}: [${doc} Imperative]`);
                }}
              >
                {doc === 'Protector' ? 'Protector (+1 BS)' : 'Conqueror (+1 WS)'}
              </button>
            ))}
          </div>
          <div className="gts-stance-pill-group">
            {['Shroudpsalm', 'Mantra (+1 OC)', 'Vengeance'].map((cant) => (
              <button
                key={cant}
                type="button"
                className="gts-stance-pill"
                data-active={activeCanticle === cant ? 'true' : undefined}
                onClick={() => {
                  setActiveCanticle(cant);
                  appendLog(`${army.playerName}: [${cant}]`);
                }}
              >
                {cant}
              </button>
            ))}
          </div>
        </Group>
      );
    }

    if (isChaos) {
      return (
        <Group justify="space-between" wrap="wrap" gap={4}>
          <Group gap={4}>
            <IconFlame size={12} color="var(--gts-danger)" />
            <Text size="10px" fw={700} className="brand-logo">
              DARK PACTS:
            </Text>
          </Group>
          <div className="gts-stance-pill-group">
            <button
              type="button"
              className="gts-stance-pill"
              onClick={() => appendLog(`${army.playerName}: [Dark Pact: Lethal Hits]`)}
            >
              Lethal Hits
            </button>
            <button
              type="button"
              className="gts-stance-pill"
              onClick={() => appendLog(`${army.playerName}: [Dark Pact: Sustained 1]`)}
            >
              Sustained 1
            </button>
            <button
              type="button"
              className="gts-stance-pill"
              onClick={() => appendLog(`${army.playerName}: [Debt to Soulforge]`)}
            >
              Soulforge (+1W/+2A)
            </button>
          </div>
        </Group>
      );
    }

    return null;
  };

  const commanders: [CommanderScoreState, CommanderScoreState] = [
    {
      side: 'player',
      army: playerArmy,
      cp: p1Cp,
      onChangeCp: setP1Cp,
      primaryVp: p1PrimaryVp,
      onChangePrimaryVp: setP1PrimaryVp,
      secondaryVp: p1SecondaryVp,
      onChangeSecondaryVp: setP1SecondaryVp,
      painted: p1Painted,
      onChangePainted: setP1Painted,
      totalVp: p1TotalVp,
      seconds: p1Seconds,
      secondaries: p1Secondaries,
      factionExtraBar: renderFactionStanceBar(playerArmy),
    },
    {
      side: 'opponent',
      army: opponentArmy,
      cp: p2Cp,
      onChangeCp: setP2Cp,
      primaryVp: p2PrimaryVp,
      onChangePrimaryVp: setP2PrimaryVp,
      secondaryVp: p2SecondaryVp,
      onChangeSecondaryVp: setP2SecondaryVp,
      painted: p2Painted,
      onChangePainted: setP2Painted,
      totalVp: p2TotalVp,
      seconds: p2Seconds,
      secondaries: p2Secondaries,
      factionExtraBar: renderFactionStanceBar(opponentArmy),
    },
  ];

  return (
    <Box className="gts-battle-hud">
      <BattleLandscapeGuard
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onBack={onBack}
        backLabel={backLabel}
      />

      <BattleTopBar
        battleRound={battleRound}
        maxRounds={5}
        onChangeRound={setBattleRound}
        activeSide={activeSide}
        onSwapSide={() => setActiveSide((s) => (s === 'player' ? 'opponent' : 'player'))}
        phases={phaseItems}
        phaseIdx={phaseIdx}
        onSelectPhase={setPhaseIdx}
        onAdvancePhase={handleAdvancePhase}
        p1TotalVp={p1TotalVp}
        p2TotalVp={p2TotalVp}
        scoreBadgeText={`${p1Wtc}:${p2Wtc}`}
        isCompactHud={Boolean(isCompactHud)}
        scoreboardCollapsed={scoreboardCollapsed}
        onToggleScoreboard={() => {
          if (isCompactHud) {
            setMobileTab((tab) => (tab === 'score' ? 'units' : 'score'));
          } else {
            setScoreboardCollapsed((c) => !c);
          }
        }}
        clockEnabled={settings.clockMode !== 'off'}
        clockRunning={clockRunning}
        onToggleClock={() => setClockRunning((r) => !r)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenSettings={onOpenSettings}
        onBack={onBack}
        backLabel={backLabel}
      />

      {isCompactHud && (
        <SegmentedControl
          fullWidth
          size="xs"
          value={mobileTab}
          onChange={(val) => setMobileTab(val as MobileHudTab)}
          className="brand-logo"
          data={[
            {
              label: (
                <Group gap={5} justify="center" wrap="nowrap">
                  <IconSwords size={12} />
                  <span>{t('tabs.units')}</span>
                </Group>
              ),
              value: 'units',
            },
            {
              label: (
                <Group gap={5} justify="center" wrap="nowrap">
                  <IconTrophy size={12} />
                  <span>
                    {t('tabs.score')} ({p1TotalVp}:{p2TotalVp})
                  </span>
                </Group>
              ),
              value: 'score',
            },
            {
              label: (
                <Group gap={5} justify="center" wrap="nowrap">
                  <IconBolt size={12} />
                  <span>{t('tabs.strats')}</span>
                </Group>
              ),
              value: 'strats',
            },
          ]}
        />
      )}

      {((!isCompactHud && !scoreboardCollapsed) ||
        (isCompactHud && mobileTab === 'score')) && (
        <BattleScoreboard
          commanders={commanders}
          activeSide={activeSide}
          clockEnabled={settings.clockMode !== 'off'}
          clockRunning={clockRunning}
          isCompactHud={Boolean(isCompactHud)}
          onOpenArmyViewer={handleOpenArmyViewer}
          onScoreSecondary={handleScoreSecondary}
          onDiscardSecondary={handleDiscardSecondaryForCp}
          onDrawSecondary={handleDrawSecondary}
        />
      )}

      {(!isCompactHud || mobileTab === 'units') && (
        <div className="gts-battle-workspace">
          {!isPhone && (
            <BattleRosterSidebar
              playerArmy={playerArmy}
              opponentArmy={opponentArmy}
              unitStatuses={unitStatuses}
              inspectorSide={inspectorSide}
              selectedPlayerUnitId={selectedPlayerUnitId}
              selectedOpponentUnitId={selectedOpponentUnitId}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
              ownListOpen={ownListOpen}
              onToggleOwnList={() => setOwnListOpen((o) => !o)}
              enemyListOpen={enemyListOpen}
              onToggleEnemyList={() => setEnemyListOpen((o) => !o)}
              onSelectUnit={(side, unitId) => {
                setInspectorSide(side);
                if (side === 'player') setSelectedPlayerUnitId(unitId);
                else setSelectedOpponentUnitId(unitId);
              }}
              onAdjustModels={adjustUnitModels}
              onAdjustWounds={adjustUnitWounds}
              onToggleShock={toggleUnitBattleShock}
            />
          )}

          <BattleUnitInspector
            inspectorSide={inspectorSide}
            onChangeInspectorSide={(side) => {
              setSwipeDir(0);
              setInspectorSide(side);
            }}
            playerUnitIndex={playerUnitIndex}
            playerUnitCount={playerArmy.units.length}
            opponentUnitIndex={opponentUnitIndex}
            opponentUnitCount={opponentArmy.units.length}
            selectedUnitId={
              inspectorSide === 'player' ? selectedPlayerUnitId : selectedOpponentUnitId
            }
            onSelectUnitId={(val) => {
              if (inspectorSide === 'player') setSelectedPlayerUnitId(val);
              else setSelectedOpponentUnitId(val);
            }}
            unitSelectData={
              inspectorSide === 'player' ? playerUnitSelectData : opponentUnitSelectData
            }
            onPaginateUnit={paginateUnit}
            swipeDir={swipeDir}
            activeUnit={activeInspectedUnit}
            activeStatus={activeInspectedStatus}
            onAdjustModels={(delta) =>
              activeInspectedUnit &&
              adjustUnitModels(inspectorSide, activeInspectedUnit, delta)
            }
            onAdjustWounds={(delta) =>
              activeInspectedUnit &&
              adjustUnitWounds(inspectorSide, activeInspectedUnit, delta)
            }
            onToggleShock={() =>
              activeInspectedUnit &&
              toggleUnitBattleShock(inspectorSide, activeInspectedUnit)
            }
            isPhone={Boolean(isPhone)}
            isCompactHud={Boolean(isCompactHud)}
            onToggleBottomTray={() => setBottomTrayOpen((o) => !o)}
            onOpenCompareModal={() => setCompareModalOpen(true)}
            bottomTrayNode={
              !isCompactHud && bottomTrayOpen ? (
                <BattleStratagemsLog
                  actions={CORE_STRATAGEMS}
                  activeCp={activeSide === 'player' ? p1Cp : p2Cp}
                  battleLog={battleLog}
                  onUseAction={handleUseStratagem}
                  compactDrawer={true}
                />
              ) : undefined
            }
          />
        </div>
      )}

      {isCompactHud && mobileTab === 'strats' && (
        <BattleStratagemsLog
          actions={CORE_STRATAGEMS}
          activeCp={activeSide === 'player' ? p1Cp : p2Cp}
          activePlayerLabel={
            activeSide === 'player'
              ? `${playerArmy.playerName}: ${p1Cp} CP`
              : `${opponentArmy.playerName}: ${p2Cp} CP`
          }
          battleLog={battleLog}
          onUseAction={handleUseStratagem}
        />
      )}

      {!isPhone && (
        <BattleCompareModal
          opened={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          playerFaction={playerArmy.metadata.faction}
          opponentFaction={opponentArmy.metadata.faction}
          selectedPlayerUnitId={selectedPlayerUnitId}
          onSelectPlayerUnitId={setSelectedPlayerUnitId}
          playerUnitSelectData={playerUnitSelectData}
          selectedPlayerUnit={selectedPlayerUnit}
          selectedOpponentUnitId={selectedOpponentUnitId}
          onSelectOpponentUnitId={setSelectedOpponentUnitId}
          opponentUnitSelectData={opponentUnitSelectData}
          selectedOpponentUnit={selectedOpponentUnit}
        />
      )}

      <BattleArmyViewerModal
        army={modalArmy}
        opened={armyViewerModalSide !== null}
        onClose={() => setArmyViewerModalSide(null)}
        onSelectUnit={(unitId) => {
          if (armyViewerModalSide === 'player') {
            setInspectorSide('player');
            setSelectedPlayerUnitId(unitId);
          } else {
            setInspectorSide('opponent');
            setSelectedOpponentUnitId(unitId);
          }
          setArmyViewerModalSide(null);
          if (isCompactHud) {
            setMobileTab('units');
          }
        }}
      />
    </Box>
  );
}