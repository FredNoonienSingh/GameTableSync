// packages/ui/components/game/battle-hud/types.ts
import type { ReactNode } from 'react';
import type { ArmyMetadata, ParsedUnit } from '../../army-viewer/armyParser';

export type MobileHudTab = 'units' | 'score' | 'strats';

export interface HudPhaseItem {
  id: string;
  label: string;
  icon: ReactNode;
}

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

export interface UnitLiveStatus {
  currentModels: number;
  maxModels: number;
  currentWounds: number;
  maxWounds: number;
  woundsPerModel: number;
  battleShocked: boolean;
  destroyed: boolean;
}

export interface QuickActionItem {
  id: string;
  name: string;
  cost: number;
  phase: string;
}

export function createInitialUnitStatus(unit: ParsedUnit): UnitLiveStatus {
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

export function formatBattleClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}