import { API_BASE_URL } from './client';

export interface ArmyListSummary {
  id: number;
  name: string;
  system: string;
  faction: string;
  points: number;
  points_limit: number;
  created_at: string;
}

export const fetchArmyLists = async (token: string): Promise<ArmyListSummary[]> => {
  const res = await fetch(`${API_BASE_URL}/api/armylists`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch army lists');
  return await res.json();
};

export const uploadArmyList = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE_URL}/api/armylists`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
};

export const deleteArmyList = async (id: number, token: string) => {
  return fetch(`${API_BASE_URL}/api/armylists/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const updateDiscordAccount = async (discordAccount: string, token: string) => {
  return fetch(`${API_BASE_URL}/api/account/discord`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ discord_account: discordAccount })
  });
};