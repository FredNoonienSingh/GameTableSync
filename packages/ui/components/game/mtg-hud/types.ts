import type { ReactNode } from 'react';

export type MtgManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
export type MtgPhaseId = 'Beginning' | 'Main1' | 'Combat' | 'Main2' | 'Ending';
export type MtgMobileTab = 'table' | 'log';

export interface MtgPhaseItem {
  id: MtgPhaseId;
  label: string;
  icon: ReactNode;
}

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

export interface MtgSeatLiveState {
  life: number;
  poison: number;
  commanderTax: number;
  gameWins: number;
  commanderDamageFrom: Record<string, number>;
}

export function createInitialSeatMap(
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

export function isMtgSeatEliminated(
  st: MtgSeatLiveState,
  isCommanderMode: boolean
): boolean {
  if (st.life <= 0 || st.poison >= 10) return true;
  if (isCommanderMode) {
    return Object.values(st.commanderDamageFrom).some((dmg) => dmg >= 21);
  }
  return false;
}
