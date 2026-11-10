import { API_BASE_URL } from './client';

export interface GamePlayer {
  user_id: number;
  display_name: string;
  discord_account?: string | null;
  army: string;
  team?: string | null;
  faction_id?: number | null;
  custom_army?: string | null;
  army_list_id?: number | null;
  army_list_name?: string | null;
}

export interface GameData {
  id: number;
  system: string;
  is_structured?: boolean;
  is_open_list: boolean;
  format_type: string;
  points: number | null;
  description: string | null;
  start_time: string;
  status: string;
  is_virtual: boolean;
  is_approved: boolean;
  created_by_id: number;
  players: GamePlayer[];
}

export const fetchPublicGames = async (): Promise<GameData[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/games`);
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch games", error);
    return [];
  }
};

export const deleteGame = async (gameId: number, token: string) => {
  return fetch(`${API_BASE_URL}/api/games/${gameId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const leaveGame = async (gameId: number, token: string) => {
  return fetch(`${API_BASE_URL}/api/games/${gameId}/leave`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const toggleApproveGame = async (gameId: number, token: string) => {
  return fetch(`${API_BASE_URL}/api/admin/games/${gameId}/approve`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export async function fetchFactionsStructure() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/factions/structure`);
    if (!res.ok) throw new Error('Fehler beim Laden der Fraktionen');
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch factions structure", error);
    return {};
  }
}