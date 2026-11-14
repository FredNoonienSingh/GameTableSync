// packages/ui/components/game/BattleCompanion40k.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Grid,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  ActionIcon,
  Progress,
  SegmentedControl,
  Switch,
  ScrollArea,
  Box,
  Tooltip,
  Modal,
  Select,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconSwords,
  IconShield,
  IconBolt,
  IconClock,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlus,
  IconMinus,
  IconAlertTriangle,
  IconRefresh,
  IconTrash,
  IconCheck,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconArrowsLeftRight,
  IconCrown,
  IconFlame,
  IconListDetails,
  IconSettings,
  IconArrowLeft,
  IconDeviceMobileRotated,
  IconMaximize,
  IconMinimize,
  IconTrophy,
  IconUsers,
  IconHeartFilled,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { ArmyMetadata, ParsedUnit } from '../army-viewer/armyParser';
import { ArmyHeaderCard, ArmyRosterTable } from '../army-viewer/ArmyRosterOverview';
import { ArmyUnitDatasheet, ArmyRulesGlossary } from '../army-viewer/ArmyUnitDatasheet';
import { DEFAULT_40K_SETTINGS, type Game40kSettings } from './Game40kSetupModal';

export type BattlePhase40k = 'Command' | 'Movement' | 'Shooting' | 'Charge' | 'Fight';
type MobileHudTab = 'units' | 'score' | 'strats';

export interface SecondaryMissionCard {
  id: string;
  name: string;
  maxVp: number;
  scoredVp: number;
  completed?: boolean;
}

export interface BattleCompanionArmyInput {
  playerName: string;
  metadata: ArmyMetadata;
  units: ParsedUnit[];
  armyRules?: { name: string; description: string }[];
  initialSecondaries?: SecondaryMissionCard[];
}

export interface BattleCompanion40kProps {
  playerArmy: BattleCompanionArmyInput;
  opponentArmy: BattleCompanionArmyInput;
  settings?: Game40kSettings;
  onBack?: () => void;
  backLabel?: string;
  onOpenSettings?: () => void;
  onInspectFullArmy?: (side: 'player' | 'opponent') => void;
}

interface UnitLiveStatus {
  currentModels: number;
  maxModels: number;
  currentWounds: number;
  maxWounds: number;
  woundsPerModel: number;
  battleShocked: boolean;
  destroyed: boolean;
}

const PHASES: BattlePhase40k[] = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight'];

const CORE_STRATAGEMS = [
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

function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function createInitialUnitStatus(unit: ParsedUnit): UnitLiveStatus {
  const maxModels = Math.max(1, unit.totalModels || 1);
  let maxWounds = unit.totalWounds || 0;
  if (maxWounds <= 0) {
    const wChar = unit.statProfiles?.[0]?.characteristics?.find(
      (c) => c.name.toUpperCase() === 'W' || c.name.toUpperCase() === 'WOUNDS'
    );
    const parsedW = Math.max(1, parseInt(String(wChar?.$text || '1'), 10) || 1);
    maxWounds = maxModels * parsedW;
  }
  const woundsPerModel = Math.max(1, Math.round(maxWounds / maxModels));
  return {
    currentModels: maxModels,
    maxModels,
    currentWounds: maxWounds,
    maxWounds,
    woundsPerModel,
    battleShocked: false,
    destroyed: false,
  };
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
  const isCompactHud = useMediaQuery('(max-width: 64em)');

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

  const phaseLabels: Record<BattlePhase40k, string> = {
    Command: t('phases.command'),
    Movement: t('phases.movement'),
    Shooting: t('phases.shooting'),
    Charge: t('phases.charge'),
    Fight: t('phases.fight'),
  };

  const handleAdvancePhase = () => {
    if (phaseIdx < PHASES.length - 1) {
      const nextPhase = phaseIdx + 1;
      setPhaseIdx(nextPhase);
      appendLog(
        `[R${battleRound}] ${activeSide === 'player' ? playerArmy.playerName : opponentArmy.playerName} → ${phaseLabels[PHASES[nextPhase]]}`
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

  // Deducting/Adding Wounds automatically sets destroyed = true when Wounds === 0
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

  // Deducting/Adding Models automatically sets destroyed = true when Models === 0
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

  const selectedPlayerUnit =
    playerArmy.units.find((u) => u.id === selectedPlayerUnitId) ?? playerArmy.units[0];
  const selectedOpponentUnit =
    opponentArmy.units.find((u) => u.id === selectedOpponentUnitId) ?? opponentArmy.units[0];

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

  const renderSidebarUnitRow = (side: 'player' | 'opponent', unit: ParsedUnit) => {
    const key = `${side}:${unit.id}`;
    const st = unitStatuses[key] ?? createInitialUnitStatus(unit);
    const isSelected =
      inspectorSide === side &&
      (side === 'player'
        ? selectedPlayerUnit?.id === unit.id
        : selectedOpponentUnit?.id === unit.id);
    const badgeColor = side === 'player' ? 'brandBlue.4' : 'red.4';

    return (
      <div
        key={unit.id}
        className="gts-battle-unit-row"
        data-side={side}
        data-selected={isSelected ? 'true' : undefined}
        data-destroyed={st.destroyed ? 'true' : undefined}
        data-shocked={st.battleShocked ? 'true' : undefined}
        onClick={() => {
          setInspectorSide(side);
          if (side === 'player') setSelectedPlayerUnitId(unit.id);
          else setSelectedOpponentUnitId(unit.id);
        }}
      >
        <Group justify="space-between" wrap="nowrap" mb={4}>
          <Group gap={5} wrap="nowrap" miw={0}>
            {unit.isWarlord && <IconCrown size={12} color="#ffd43b" />}
            <Text
              size="xs"
              fw={700}
              td={st.destroyed ? 'line-through' : undefined}
              truncate
            >
              {unit.name}
            </Text>
          </Group>

          {/* Fixed-width right slot: swaps in-place between Points, Shocked, or Destroyed */}
          <Group gap={4} wrap="nowrap">
            {st.destroyed ? (
              <Badge size="xs" color="red" variant="filled" miw={74} ta="center">
                {t('destroyed')}
              </Badge>
            ) : st.battleShocked ? (
              <Badge size="xs" color="yellow" variant="filled" miw={74} ta="center">
                {t('shocked')}
              </Badge>
            ) : (
              <Badge
                size="xs"
                variant="outline"
                className="gts-game-meta-tag"
                miw={74}
                ta="center"
              >
                {unit.points} PTS
              </Badge>
            )}
          </Group>
        </Group>

        <Group
          justify="space-between"
          wrap="nowrap"
          gap={4}
          onClick={(e) => e.stopPropagation()}
        >
          {st.maxModels > 1 ? (
            <Group gap={2} wrap="nowrap">
              <ActionIcon
                size="xs"
                variant="default"
                onClick={() => adjustUnitModels(side, unit, -1)}
              >
                <IconMinus size={10} />
              </ActionIcon>
              <Badge size="xs" variant="light" color="gray" miw={52} ta="center">
                {st.currentModels}/{st.maxModels} M
              </Badge>
              <ActionIcon
                size="xs"
                variant="default"
                onClick={() => adjustUnitModels(side, unit, 1)}
              >
                <IconPlus size={10} />
              </ActionIcon>
            </Group>
          ) : (
            <Badge size="xs" variant="outline" color="gray" miw={52} ta="center">
              1 M
            </Badge>
          )}

          <Group gap={2} wrap="nowrap">
            <ActionIcon
              size="xs"
              variant="default"
              onClick={() => adjustUnitWounds(side, unit, -1)}
            >
              <IconMinus size={10} />
            </ActionIcon>
            <Badge
              size="xs"
              variant="outline"
              color={
                st.destroyed
                  ? 'gray'
                  : st.currentWounds <= st.maxWounds / 2
                    ? 'orange'
                    : badgeColor
              }
              miw={58}
              ta="center"
            >
              {st.currentWounds}/{st.maxWounds} W
            </Badge>
            <ActionIcon
              size="xs"
              variant="default"
              onClick={() => adjustUnitWounds(side, unit, 1)}
            >
              <IconPlus size={10} />
            </ActionIcon>
          </Group>

          <ActionIcon
            size="xs"
            disabled={st.destroyed}
            color={st.battleShocked ? 'yellow' : 'gray'}
            variant={st.battleShocked ? 'filled' : 'default'}
            onClick={() => toggleUnitBattleShock(side, unit)}
            title={t('shocked')}
          >
            <IconAlertTriangle size={11} />
          </ActionIcon>
        </Group>

        <Progress
          mt={4}
          size={3}
          value={(st.currentWounds / st.maxWounds) * 100}
          color={st.destroyed ? 'gray' : side === 'player' ? 'brandBlue.5' : 'red.5'}
        />
      </div>
    );
  };

  return (
    <Box className="gts-battle-hud">
      {/* 0. PORTRAIT PHONE BLOCKER */}
      <div className="gts-landscape-guard">
        <IconDeviceMobileRotated size={68} className="gts-rotate-icon-anim" />
        <Badge variant="outline" size="lg" className="brand-logo gts-game-badge">
          {t('landscape.badge')}
        </Badge>
        <Title order={2} className="brand-logo gts-army-title" maw={420}>
          {t('landscape.title')}
        </Title>
        <Text size="sm" maw={380} c="dimmed">
          {t('landscape.description')}
        </Text>
        <Button
          size="md"
          variant="default"
          leftSection={isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
          className="brand-logo gts-game-cta-join"
          onClick={handleToggleFullscreen}
        >
          {t('landscape.lockBtn')}
        </Button>
        {onBack && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconArrowLeft size={14} />}
            onClick={onBack}
          >
            {backLabel || t('back')}
          </Button>
        )}
      </div>

      {/* 1. FIXED 3-COLUMN TOP HUD BAR */}
      <Paper px="sm" py={6} radius="md" className="gts-battle-topbar">
        <div className="gts-battle-topbar-grid">
          <Group gap={6} wrap="nowrap">
            {onBack && (
              <Tooltip label={backLabel || t('back')}>
                <ActionIcon
                  size="md"
                  variant="default"
                  className="gts-tournament-secondary-btn"
                  onClick={onBack}
                >
                  <IconArrowLeft size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            <div className="gts-battle-round-pill">
              <Group gap={4} justify="center" align="center" wrap="nowrap">
                <Text size="10px" fw={700} className="brand-logo" c="dimmed">
                  {t('round')}
                </Text>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => setBattleRound((r) => Math.max(1, r - 1))}
                >
                  <IconMinus size={10} />
                </ActionIcon>
                <Text size="sm" fw={900} className="brand-logo">
                  {battleRound}/5
                </Text>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => setBattleRound((r) => Math.min(5, r + 1))}
                >
                  <IconPlus size={10} />
                </ActionIcon>
              </Group>
            </div>

            <Badge
              size="sm"
              variant="filled"
              color={activeSide === 'player' ? 'brandBlue.6' : 'red.6'}
              className="brand-logo"
              maw={130}
            >
              {activeSide === 'player'
                ? playerArmy.playerName
                : opponentArmy.playerName}
            </Badge>

            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() =>
                setActiveSide((s) => (s === 'player' ? 'opponent' : 'player'))
              }
            >
              {t('swapTurn')}
            </Button>
          </Group>

          <div className="gts-battle-phase-scroll">
            {PHASES.map((phase, idx) => (
              <button
                key={phase}
                type="button"
                className="brand-logo gts-battle-phase-step"
                data-active={idx === phaseIdx ? 'true' : undefined}
                onClick={() => setPhaseIdx(idx)}
              >
                {idx + 1}. {phaseLabels[phase]}
              </button>
            ))}
            <Button
              size="compact-xs"
              variant="default"
              rightSection={<IconChevronRight size={12} />}
              className="brand-logo gts-game-cta-join"
              onClick={handleAdvancePhase}
            >
              {phaseIdx === PHASES.length - 1 ? t('endTurn') : t('nextPhase')}
            </Button>
          </div>

          <Group gap={6} justify="flex-end" wrap="nowrap">
            <div
              className="gts-battle-score-summary-pill"
              onClick={() => setScoreboardCollapsed((c) => !c)}
              title={t('toggleScoreboard')}
            >
              <Text size="xs" fw={900} className="brand-logo" c="var(--gts-primary)">
                {String(p1TotalVp).padStart(2, '0')} VP
              </Text>
              <Badge size="xs" variant="outline" className="brand-logo">
                WTC {p1Wtc}:{p2Wtc}
              </Badge>
              <Text size="xs" fw={900} className="brand-logo" c="red.4">
                {String(p2TotalVp).padStart(2, '0')} VP
              </Text>
              {scoreboardCollapsed ? (
                <IconChevronDown size={13} />
              ) : (
                <IconChevronUp size={13} />
              )}
            </div>

            {settings.clockMode !== 'off' && (
              <ActionIcon
                size="sm"
                variant="light"
                color={clockRunning ? 'teal' : 'gray'}
                onClick={() => setClockRunning((r) => !r)}
                title={t('toggleClock')}
              >
                {clockRunning ? (
                  <IconPlayerPause size={14} />
                ) : (
                  <IconPlayerPlay size={14} />
                )}
              </ActionIcon>
            )}

            <Tooltip label={t('fullscreen')}>
              <ActionIcon
                size="sm"
                variant={isFullscreen ? 'filled' : 'subtle'}
                color={isFullscreen ? 'brandBlue.6' : undefined}
                onClick={handleToggleFullscreen}
              >
                {isFullscreen ? <IconMinimize size={15} /> : <IconMaximize size={15} />}
              </ActionIcon>
            </Tooltip>

            {onOpenSettings && (
              <Tooltip label={t('settings')}>
                <ActionIcon size="sm" variant="subtle" onClick={onOpenSettings}>
                  <IconSettings size={15} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </div>
      </Paper>

      {/* 1B. MOBILE / TABLET 3-TAB VIEW SWITCHER */}
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
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconSwords size={13} />
                  <span>{t('tabs.units')}</span>
                </Group>
              ),
              value: 'units',
            },
            {
              label: (
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconTrophy size={13} />
                  <span>
                    {t('tabs.score')} ({p1TotalVp} : {p2TotalVp})
                  </span>
                </Group>
              ),
              value: 'score',
            },
            {
              label: (
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconBolt size={13} />
                  <span>{t('tabs.strats')}</span>
                </Group>
              ),
              value: 'strats',
            },
          ]}
        />
      )}

      {/* 2. COLLAPSIBLE DUAL COMMANDER SCOREBOARDS */}
      {((!isCompactHud && !scoreboardCollapsed) ||
        (isCompactHud && mobileTab === 'score')) && (
        <Box>
          <Grid gap="xs" align="stretch">
            {[
              {
                side: 'player' as const,
                army: playerArmy,
                cp: p1Cp,
                setCp: setP1Cp,
                primaryVp: p1PrimaryVp,
                setPrimaryVp: setP1PrimaryVp,
                secondaryVp: p1SecondaryVp,
                setSecondaryVp: setP1SecondaryVp,
                painted: p1Painted,
                setPainted: setP1Painted,
                totalVp: p1TotalVp,
                seconds: p1Seconds,
                secondaries: p1Secondaries,
              },
              {
                side: 'opponent' as const,
                army: opponentArmy,
                cp: p2Cp,
                setCp: setP2Cp,
                primaryVp: p2PrimaryVp,
                setPrimaryVp: setP2PrimaryVp,
                secondaryVp: p2SecondaryVp,
                setSecondaryVp: setP2SecondaryVp,
                painted: p2Painted,
                setPainted: setP2Painted,
                totalVp: p2TotalVp,
                seconds: p2Seconds,
                secondaries: p2Secondaries,
              },
            ].map((cmd) => {
              const isTurn = activeSide === cmd.side;
              const isAdMech = cmd.army.metadata.faction
                .toLowerCase()
                .includes('mechanicus');
              const isChaos = cmd.army.metadata.faction.toLowerCase().includes('chaos');

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
                            onClick={() => handleOpenArmyViewer(cmd.side)}
                          >
                            {t('armyViewer')}
                          </Button>

                          {settings.clockMode !== 'off' && (
                            <div
                              className="gts-battle-clock"
                              data-running={clockRunning && isTurn ? 'true' : undefined}
                            >
                              <Group gap={4} wrap="nowrap">
                                <IconClock size={11} />
                                <span>{formatClock(cmd.seconds)}</span>
                              </Group>
                            </div>
                          )}
                        </Group>
                      </Group>

                      {isAdMech && (
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
                                  appendLog(`${cmd.army.playerName}: [${doc} Imperative]`);
                                }}
                              >
                                {doc === 'Protector'
                                  ? 'Protector (+1 BS)'
                                  : 'Conqueror (+1 WS)'}
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
                                  appendLog(`${cmd.army.playerName}: [${cant}]`);
                                }}
                              >
                                {cant}
                              </button>
                            ))}
                          </div>
                        </Group>
                      )}

                      {isChaos && (
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
                              onClick={() =>
                                appendLog(`${cmd.army.playerName}: [Dark Pact: Lethal Hits]`)
                              }
                            >
                              Lethal Hits
                            </button>
                            <button
                              type="button"
                              className="gts-stance-pill"
                              onClick={() =>
                                appendLog(`${cmd.army.playerName}: [Dark Pact: Sustained 1]`)
                              }
                            >
                              Sustained 1
                            </button>
                            <button
                              type="button"
                              className="gts-stance-pill"
                              onClick={() =>
                                appendLog(`${cmd.army.playerName}: [Debt to Soulforge]`)
                              }
                            >
                              Soulforge (+1W/+2A)
                            </button>
                          </div>
                        </Group>
                      )}

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
                                onChange={(e) => cmd.setPainted(e.currentTarget.checked)}
                                title={`+10 ${t('painted')}`}
                              />
                            </Group>
                            <div className="gts-battle-metric-val">
                              {cmd.totalVp}
                            </div>
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
                                onClick={() => cmd.setCp((c) => Math.max(0, c - 1))}
                              >
                                <IconMinus size={10} />
                              </ActionIcon>
                              <span className="gts-battle-metric-val">{cmd.cp}</span>
                              <ActionIcon
                                size="xs"
                                variant="default"
                                onClick={() => cmd.setCp((c) => c + 1)}
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
                                onClick={() => cmd.setPrimaryVp((v) => Math.max(0, v - 5))}
                              >
                                <IconMinus size={10} />
                              </ActionIcon>
                              <span className="gts-battle-metric-val">{cmd.primaryVp}</span>
                              <ActionIcon
                                size="xs"
                                variant="default"
                                onClick={() => cmd.setPrimaryVp((v) => Math.min(50, v + 5))}
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
                                  cmd.setSecondaryVp((v) => Math.max(0, v - 2))
                                }
                              >
                                <IconMinus size={10} />
                              </ActionIcon>
                              <span className="gts-battle-metric-val">
                                {cmd.secondaryVp}
                              </span>
                              <ActionIcon
                                size="xs"
                                variant="default"
                                onClick={() =>
                                  cmd.setSecondaryVp((v) => Math.min(40, v + 2))
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
                                  onClick={() =>
                                    handleScoreSecondary(cmd.side, sec.id, 3)
                                  }
                                  title="+3 VP"
                                >
                                  <IconCheck size={10} />
                                </ActionIcon>
                                <Badge
                                  size="xs"
                                  color="teal"
                                  variant="outline"
                                  onClick={() =>
                                    handleScoreSecondary(cmd.side, sec.id, sec.maxVp)
                                  }
                                >
                                  +{sec.maxVp}
                                </Badge>
                                <ActionIcon
                                  size="xs"
                                  color="yellow"
                                  variant="subtle"
                                  onClick={() =>
                                    handleDiscardSecondaryForCp(cmd.side, sec.id)
                                  }
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
                            onClick={() => handleDrawSecondary(cmd.side)}
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
      )}

      {/* 3. INTERNAL-SCROLL WORKSPACE */}
      {(!isCompactHud || mobileTab === 'units') && (
        <div className="gts-battle-workspace">
          {/* LEFT: COLLAPSIBLE ROSTER SIDEBAR */}
          <div
            className="gts-battle-sidebar"
            data-collapsed={sidebarCollapsed ? 'true' : undefined}
          >
            <Group
              justify={sidebarCollapsed ? 'center' : 'space-between'}
              px="xs"
              py={6}
            >
              {!sidebarCollapsed && (
                <Text size="xs" fw={700} className="brand-logo">
                  {t('unitPane.roster')}
                </Text>
              )}
              <Tooltip
                label={
                  sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')
                }
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setSidebarCollapsed((c) => !c)}
                >
                  {sidebarCollapsed ? (
                    <IconLayoutSidebarLeftExpand size={16} />
                  ) : (
                    <IconLayoutSidebarLeftCollapse size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            </Group>

            {!sidebarCollapsed && (
              <div className="gts-battle-sidebar-scroll">
                <Stack gap="sm">
                  <div>
                    <button
                      type="button"
                      className="gts-battle-roster-header"
                      onClick={() => setOwnListOpen((o) => !o)}
                    >
                      <Group gap={6} wrap="nowrap">
                        <IconSwords size={14} color="var(--gts-primary)" />
                        <Text size="xs" fw={700} className="brand-logo">
                          {t('own')}: {playerArmy.metadata.faction.toUpperCase()} (
                          {playerArmy.units.length})
                        </Text>
                      </Group>
                      {ownListOpen ? (
                        <IconChevronUp size={14} />
                      ) : (
                        <IconChevronDown size={14} />
                      )}
                    </button>

                    {ownListOpen && (
                      <Stack gap={6} mt={6}>
                        {playerArmy.units.map((unit) =>
                          renderSidebarUnitRow('player', unit)
                        )}
                      </Stack>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      className="gts-battle-roster-header"
                      onClick={() => setEnemyListOpen((o) => !o)}
                    >
                      <Group gap={6} wrap="nowrap">
                        <IconShield size={14} color="var(--gts-danger)" />
                        <Text size="xs" fw={700} className="brand-logo">
                          {t('enemy')}: {opponentArmy.metadata.faction.toUpperCase()} (
                          {opponentArmy.units.length})
                        </Text>
                      </Group>
                      {enemyListOpen ? (
                        <IconChevronUp size={14} />
                      ) : (
                        <IconChevronDown size={14} />
                      )}
                    </button>

                    {enemyListOpen && (
                      <Stack gap={6} mt={6}>
                        {opponentArmy.units.map((unit) =>
                          renderSidebarUnitRow('opponent', unit)
                        )}
                      </Stack>
                    )}
                  </div>
                </Stack>
              </div>
            )}
          </div>

          {/* RIGHT: MAIN DATASHEET INSPECTOR + LIVE CASUALTY/WOUND CONTROL BAR */}
          <div className="gts-battle-main-pane">
            <Paper p="xs" radius="md" className="gts-army-panel">
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Group gap="xs" wrap="nowrap" miw={0}>
                  <SegmentedControl
                    size="xs"
                    value={inspectorSide}
                    onChange={(val) => setInspectorSide(val as 'player' | 'opponent')}
                    data={[
                      {
                        label: `${t('own')} (${playerArmy.units.length})`,
                        value: 'player',
                      },
                      {
                        label: `${t('enemy')} (${opponentArmy.units.length})`,
                        value: 'opponent',
                      },
                    ]}
                  />

                  <Select
                    size="xs"
                    searchable
                    w={260}
                    value={
                      inspectorSide === 'player'
                        ? selectedPlayerUnitId
                        : selectedOpponentUnitId
                    }
                    onChange={(val) => {
                      if (!val) return;
                      if (inspectorSide === 'player') setSelectedPlayerUnitId(val);
                      else setSelectedOpponentUnitId(val);
                    }}
                    data={
                      inspectorSide === 'player'
                        ? playerUnitSelectData
                        : opponentUnitSelectData
                    }
                  />
                </Group>

                <Group gap="xs" wrap="nowrap">
                  {!isCompactHud && (
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconBolt size={14} />}
                      onClick={() => setBottomTrayOpen((o) => !o)}
                    >
                      {t('tabs.strats')}
                    </Button>
                  )}

                  <Button
                    size="xs"
                    variant="default"
                    leftSection={<IconArrowsLeftRight size={14} />}
                    className="brand-logo gts-game-cta-join"
                    onClick={() => setCompareModalOpen(true)}
                  >
                    {t('vsCompare')}
                  </Button>
                </Group>
              </Group>
            </Paper>

            {activeInspectedUnit && activeInspectedStatus && (
              <div
                className="gts-unit-live-control-bar"
                data-side={inspectorSide}
              >
                <Group gap="xs" wrap="nowrap" miw={0}>
                  <Badge
                    size="sm"
                    variant="filled"
                    color={inspectorSide === 'player' ? 'brandBlue.6' : 'red.6'}
                    className="brand-logo"
                  >
                    {inspectorSide === 'player' ? t('own') : t('enemy')}
                  </Badge>
                  <Text
                    size="sm"
                    fw={800}
                    className="brand-logo"
                    td={activeInspectedStatus.destroyed ? 'line-through' : undefined}
                    c={activeInspectedStatus.destroyed ? 'red.4' : undefined}
                    truncate
                  >
                    {activeInspectedUnit.name.toUpperCase()}
                  </Text>
                </Group>

                <Group gap="sm" wrap="nowrap">
                  <Group gap={4} wrap="nowrap">
                    <IconUsers size={14} color="var(--gts-text-secondary)" />
                    <Text size="11px" fw={700} className="brand-logo" c="dimmed">
                      {t('modelsLabel')}:
                    </Text>
                    <ActionIcon
                      size="sm"
                      variant="default"
                      onClick={() =>
                        adjustUnitModels(inspectorSide, activeInspectedUnit, -1)
                      }
                    >
                      <IconMinus size={12} />
                    </ActionIcon>
                    <Badge size="md" variant="outline" w={68} ta="center">
                      {activeInspectedStatus.currentModels}/{activeInspectedStatus.maxModels}
                    </Badge>
                    <ActionIcon
                      size="sm"
                      variant="default"
                      onClick={() =>
                        adjustUnitModels(inspectorSide, activeInspectedUnit, 1)
                      }
                    >
                      <IconPlus size={12} />
                    </ActionIcon>
                  </Group>

                  <Group gap={4} wrap="nowrap">
                    <IconHeartFilled size={14} color="var(--gts-danger)" />
                    <Text size="11px" fw={700} className="brand-logo" c="dimmed">
                      {t('woundsLabel')}:
                    </Text>
                    <ActionIcon
                      size="sm"
                      variant="default"
                      onClick={() =>
                        adjustUnitWounds(inspectorSide, activeInspectedUnit, -1)
                      }
                    >
                      <IconMinus size={12} />
                    </ActionIcon>
                    <Badge
                      size="md"
                      variant="filled"
                      w={82}
                      ta="center"
                      color={
                        activeInspectedStatus.destroyed
                          ? 'gray'
                          : activeInspectedStatus.currentWounds <=
                              activeInspectedStatus.maxWounds / 2
                            ? 'orange'
                            : inspectorSide === 'player'
                              ? 'brandBlue.6'
                              : 'red.6'
                      }
                    >
                      {activeInspectedStatus.currentWounds}/{activeInspectedStatus.maxWounds} W
                    </Badge>
                    <ActionIcon
                      size="sm"
                      variant="default"
                      onClick={() =>
                        adjustUnitWounds(inspectorSide, activeInspectedUnit, 1)
                      }
                    >
                      <IconPlus size={12} />
                    </ActionIcon>
                  </Group>

                  {/* Fixed-width status slot: shows Destroyed badge at 0 W, or Shock toggle when alive */}
                  {activeInspectedStatus.destroyed ? (
                    <Badge
                      size="lg"
                      color="red"
                      variant="filled"
                      w={115}
                      ta="center"
                      className="brand-logo"
                    >
                      {t('destroyed')}
                    </Badge>
                  ) : (
                    <Button
                      size="compact-xs"
                      color={activeInspectedStatus.battleShocked ? 'yellow' : 'gray'}
                      variant={
                        activeInspectedStatus.battleShocked ? 'filled' : 'default'
                      }
                      leftSection={<IconAlertTriangle size={12} />}
                      w={115}
                      onClick={() =>
                        toggleUnitBattleShock(inspectorSide, activeInspectedUnit)
                      }
                    >
                      {t('shocked')}
                    </Button>
                  )}
                </Group>
              </div>
            )}

            <div className="gts-battle-datasheet-scroll">
              {activeInspectedUnit && (
                <ArmyUnitDatasheet unit={activeInspectedUnit} />
              )}
            </div>

            {!isCompactHud && bottomTrayOpen && (
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
                      {CORE_STRATAGEMS.map((strat) => {
                        const activeCp = activeSide === 'player' ? p1Cp : p2Cp;
                        return (
                          <Grid.Col key={strat.id} span={3}>
                            <button
                              type="button"
                              disabled={activeCp < strat.cost}
                              className="gts-battle-strat-btn"
                              onClick={() =>
                                handleUseStratagem(strat.name, strat.cost)
                              }
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
                        );
                      })}
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
            )}
          </div>
        </div>
      )}

      {/* 4. MOBILE / TABLET STRATAGEMS & LOG TAB */}
      {isCompactHud && mobileTab === 'strats' && (
        <Box className="gts-battle-datasheet-scroll">
          <Grid gap="sm" align="stretch">
            <Grid.Col span={{ base: 12, sm: 7 }}>
              <Paper p="sm" radius="md" className="gts-army-panel" h="100%">
                <Group gap="xs" mb="xs">
                  <IconBolt size={15} color="var(--gts-accent)" />
                  <Text size="xs" fw={700} className="brand-logo">
                    {t('coreStratagems')} (
                    {activeSide === 'player'
                      ? `${playerArmy.playerName}: ${p1Cp} CP`
                      : `${opponentArmy.playerName}: ${p2Cp} CP`}
                    )
                  </Text>
                </Group>
                <Grid gap="xs">
                  {CORE_STRATAGEMS.map((strat) => {
                    const activeCp = activeSide === 'player' ? p1Cp : p2Cp;
                    return (
                      <Grid.Col key={strat.id} span={{ base: 6, sm: 3 }}>
                        <button
                          type="button"
                          disabled={activeCp < strat.cost}
                          className="gts-battle-strat-btn"
                          onClick={() => handleUseStratagem(strat.name, strat.cost)}
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
                    );
                  })}
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
      )}

      {/* 5. DEDICATED SIDE-BY-SIDE VS UNIT COMPARISON MODAL */}
      <Modal
        opened={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        size="96%"
        centered
        title={
          <Group gap="xs">
            <IconArrowsLeftRight size={18} color="var(--gts-accent)" />
            <Text fw={700} className="brand-logo">
              {t('vsModalTitle')}
            </Text>
          </Group>
        }
        classNames={{
          content: 'gts-modal-content',
          header: 'gts-modal-header',
        }}
      >
        <Grid gap="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="sm">
              <Select
                label={`${t('selectOwnUnit')} (${playerArmy.metadata.faction})`}
                searchable
                value={selectedPlayerUnitId}
                onChange={(val) => val && setSelectedPlayerUnitId(val)}
                data={playerUnitSelectData}
                classNames={{
                  input: 'gts-input-field',
                  label: 'gts-input-label',
                }}
              />
              <ScrollArea.Autosize mah="72dvh" offsetScrollbars>
                {selectedPlayerUnit && (
                  <ArmyUnitDatasheet unit={selectedPlayerUnit} />
                )}
              </ScrollArea.Autosize>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="sm">
              <Select
                label={`${t('selectEnemyUnit')} (${opponentArmy.metadata.faction})`}
                searchable
                value={selectedOpponentUnitId}
                onChange={(val) => val && setSelectedOpponentUnitId(val)}
                data={opponentUnitSelectData}
                classNames={{
                  input: 'gts-input-field',
                  label: 'gts-input-label',
                }}
              />
              <ScrollArea.Autosize mah="72dvh" offsetScrollbars>
                {selectedOpponentUnit && (
                  <ArmyUnitDatasheet unit={selectedOpponentUnit} />
                )}
              </ScrollArea.Autosize>
            </Stack>
          </Grid.Col>
        </Grid>
      </Modal>

      {/* 6. FULL ARMY VIEWER MODAL */}
      <Modal
        opened={armyViewerModalSide !== null}
        onClose={() => setArmyViewerModalSide(null)}
        size="95%"
        centered
        title={
          <Group gap="xs">
            <IconListDetails size={18} color="var(--gts-accent)" />
            <Text fw={700} className="brand-logo">
              {t('armyViewer')} — {modalArmy?.metadata.name.toUpperCase()}
            </Text>
          </Group>
        }
        classNames={{
          content: 'gts-modal-content',
          header: 'gts-modal-header',
        }}
      >
        {modalArmy && (
          <ScrollArea.Autosize mah="80dvh" offsetScrollbars>
            <Stack gap="lg">
              <ArmyHeaderCard metadata={modalArmy.metadata} />
              <ArmyRosterTable
                units={modalArmy.units}
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
              {modalArmy.armyRules && modalArmy.armyRules.length > 0 && (
                <ArmyRulesGlossary rules={modalArmy.armyRules} />
              )}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Modal>
    </Box>
  );
}