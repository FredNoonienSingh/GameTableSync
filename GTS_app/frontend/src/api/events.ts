import { API_BASE_URL } from './client';

export interface Attendee {
  id: number;
  display_name: string;
  discord_account?: string | null;
}

export interface EventData {
  id: number;
  title: string;
  start_time: string;
  description: string;
  attendees: Attendee[]; 
}

export const fetchPublicEvents = async (): Promise<EventData[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`);
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch public events", error);
    return [];
  }
};

export const fetchAdminEvents = async (token: string): Promise<EventData[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/events`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch admin events", error);
    return [];
  }
};