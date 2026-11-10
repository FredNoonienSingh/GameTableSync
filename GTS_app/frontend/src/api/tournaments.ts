import { API_BASE_URL } from './client';

export interface TournamentParticipantData {
  id: number;
  user_id: number;
  display_name: string;
  army_list_id: number | null;
  army_list_name: string | null;
  is_disqualified: boolean;
}

export interface TournamentMatchData {
  id: number;
  round_number: number;
  player1_id: number | null;
  player1_name: string | null;
  player2_id: number | null;
  player2_name: string | null;
  score_player1: number | null;
  score_player2: number | null;
  hand_in_by: string | null;
  p1_submitted: boolean;
  p2_submitted: boolean;
  winner_id: number | null;
  status: string;
}

export interface TournamentData {
  id: number;
  name: string;
  system: string;
  format_type: string;
  max_players: number;
  round_duration_days: number;
  status: string;
  start_date: string;
  participants_count: number;
  participants?: TournamentParticipantData[];
  matches?: TournamentMatchData[];
}

export type TournamentDetailData = Required<TournamentData>;

export interface PodiumCounts {
  first: number;
  second: number;
  third: number;
}

export interface RankedPlayerEntry {
  rank: number;
  user_id: number;
  display_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  podiums: PodiumCounts;
}

export interface UnrankedPlayerEntry {
  user_id: number;
  display_name: string;
  matches_played: number;
  podiums: PodiumCounts;
}

export interface SystemLeaderboard {
  ranked: RankedPlayerEntry[];
  unranked: UnrankedPlayerEntry[];
}

export type LeaderboardResponse = Record<string, SystemLeaderboard>;

export const fetchLeaderboard = async (): Promise<LeaderboardResponse> => {
  const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
  if (!res.ok) return {};
  return res.json();
};

export const completeTournament = async (tournamentId: number, token: string) => {
  return fetch(`${API_BASE_URL}/api/admin/tournaments/${tournamentId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const fetchTournaments = async (): Promise<TournamentData[]> => {
  const res = await fetch(`${API_BASE_URL}/api/tournaments`);
  if (!res.ok) return [];
  return res.json();
};

export const fetchTournamentDetail = async (id: number): Promise<TournamentDetailData | null> => {
  const res = await fetch(`${API_BASE_URL}/api/tournaments/${id}`);
  if (!res.ok) return null;
  return res.json();
};

export const registerTournament = async (tournamentId: number, armyListId: number | null, token: string) => {
  return fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ army_list_id: armyListId })
  });
};

export const unregisterTournament = async (tournamentId: number, token: string) => {
  return fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/register`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const generateSwissRound = async (tournamentId: number, token: string, handInBy?: string) => {
  return fetch(`${API_BASE_URL}/api/admin/tournaments/${tournamentId}/generate-round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(handInBy ? { hand_in_by: handInBy } : {})
  });
};