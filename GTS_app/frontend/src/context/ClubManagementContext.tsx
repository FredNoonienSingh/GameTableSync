'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

export interface TierConfig {
  key?: string;
  rank?: number;
  name: string;
  display_label: string;
  is_commercial?: boolean;
  allow_in_combined?: boolean;
  purchase_mode?: 'checkout' | 'contact_only';
  monthly_price_eur: number;
  yearly_monthly_price_eur?: number;
  yearly_total_eur?: number;
  stripe_price_id: string;
  max_active_signup_tournaments: number;
  max_tables: number;
  can_schedule_employees: boolean;
  discord_bot_access_level: 'basic' | 'standard' | 'full';
  custom_theming: boolean;
  custom_theme?: boolean;
  custom_subdomain?: boolean;
  can_edit_logo_and_description?: boolean;
  max_galleries?: number;
}

export interface ClubRoleSummary {
  club_id: string;
  club_name: string;
  club_slug: string;
  tier: string;
  tier_limits: TierConfig;
  is_owner: boolean;
  role_title?: string;
  is_keymaster: boolean;
  can_manage_tournaments: boolean;
  can_manage_events: boolean;
}

export interface ClubScheduleDto {
  id: string;
  day_of_week: number | null;
  specific_date: string | null;
  open_time: string | null;
  close_time: string | null;
  is_blocked: boolean;
  note: string | null;
}

export interface ClubTableDto {
  id: string;
  name: string;
  supports_tabletop: boolean;
  supports_tcg: boolean;
  supports_rpg: boolean;
  dimensions: string | null;
  max_players: number;
  is_active: boolean;
  schedules?: ClubScheduleDto[];
}

export interface ClubEmployeeDto {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  role_title: string;
  weekly_hours: number;
  is_keymaster: boolean;
  can_manage_tournaments: boolean;
  can_manage_events: boolean;
}

export type OpeningHoursMap = Record<
  string,
  { is_open: boolean; open: string; close: string }
>;

export interface ClubManageDetailDto {
  id: string;
  owner_id: string;
  license_id?: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url?: string | null;
  is_private?: boolean;
  tier: string;
  tier_limits: TierConfig;
  address: {
    street: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  };
  contact: {
    email: string | null;
    phone: string | null;
    website_url: string | null;
    online_store_url: string | null;
    social_links: Record<string, string>;
  };
  discord: {
    guild_id: string | null;
    invite_url: string | null;
    bot_access_level: 'basic' | 'standard' | 'full';
    config?: Record<string, any>;
  };
  theme_config: {
    primary_color?: string;
    accent_color?: string;
    background_style?: string;
    logo_s3_key?: string | null;
    banner_s3_key?: string | null;
    preset?: string;
    galleries?: string[];
  };
  opening_hours?: Record<
    string,
    { is_open: boolean; open: string; close: string }
  >;
  tables: ClubTableDto[];
  employees?: ClubEmployeeDto[];
}

export interface ClubLicenseDto {
  id: string;
  tier: string;
  tier_rank: number;
  tier_details?: TierConfig;
  status: string;
  license_type: 'single' | 'combined';
  bundle_id: string | null;
  is_primary_slot: boolean;
  billing_cycle: 'monthly' | 'yearly';
  discount_percent: number;
  price_eur: number;
  is_mock: boolean;
  stripe_subscription_id: string | null;
  club_id: string | null;
  club_name: string | null;
  valid_until: string | null;
  created_at: string | null;
}

export function getClubAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('gts_token');
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

interface ClubManagementContextType {
  authorized: boolean | null;
  isAppAdmin: boolean;
  clubRoles: ClubRoleSummary[];
  selectedClubId: string | null;
  setSelectedClubId: (id: string) => void;
  clubDetail: ClubManageDetailDto | null;
  licenses: ClubLicenseDto[];
  tiersMap: Record<string, TierConfig>;
  isOwner: boolean;
  isKeymaster: boolean;
  canManageTournaments: boolean;
  canManageEvents: boolean;
  loadingClub: boolean;
  refreshClubData: () => Promise<void>;
  refreshClubDetail: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const ClubManagementContext = createContext<ClubManagementContextType | undefined>(undefined);

export function ClubManagementProvider({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [clubRoles, setClubRoles] = useState<ClubRoleSummary[]>([]);
  const [selectedClubId, setSelectedClubIdState] = useState<string | null>(null);
  const [clubDetail, setClubDetail] = useState<ClubManageDetailDto | null>(null);
  const [licenses, setLicenses] = useState<ClubLicenseDto[]>([]);
  const [tiersMap, setTiersMap] = useState<Record<string, TierConfig>>({});
  const [loadingClub, setLoadingClub] = useState(false);

  const loadClubDetail = useCallback(async (clubId: string) => {
    setLoadingClub(true);
    try {
      const headers = getClubAuthHeaders();
      const [manageRes, licRes] = await Promise.all([
        fetch(`/api/clubs/${clubId}/manage`, { headers }),
        fetch('/api/billing/licenses', { headers }),
      ]);
      if (manageRes.ok) {
        setClubDetail(await manageRes.json());
      }
      if (licRes.ok) {
        setLicenses(await licRes.json());
      }
    } catch {
      // ignore
    } finally {
      setLoadingClub(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const headers = getClubAuthHeaders();
      const [meRes, tiersRes] = await Promise.all([
        fetch('/api/account/me', { headers }),
        fetch('/api/billing/tiers'),
      ]);

      if (tiersRes.ok) {
        setTiersMap(await tiersRes.json());
      }

      if (!meRes.ok) {
        setAuthorized(false);
        return;
      }

      const data = await meRes.json();
      const roles: ClubRoleSummary[] = Array.isArray(data.club_roles) ? data.club_roles : [];
      const appAdmin = Boolean(data.user?.is_app_admin);

      const licRes = await fetch('/api/billing/licenses', { headers });
      const userLicenses: ClubLicenseDto[] = licRes.ok ? await licRes.json() : [];
      setLicenses(userLicenses);

      if (roles.length === 0 && !appAdmin && userLicenses.length === 0) {
        setAuthorized(false);
        return;
      }

      if (data.user) {
        localStorage.setItem('gts_user', JSON.stringify(data.user));
      }
      localStorage.setItem('gts_club_roles', JSON.stringify(roles));
      window.dispatchEvent(new Event('gts-user-updated'));

      setIsAppAdmin(appAdmin);
      setClubRoles(roles);
      setAuthorized(true);

      const savedClubId = localStorage.getItem('gts_selected_club_id');
      const targetClubId =
        roles.find((r) => r.club_id === savedClubId)?.club_id ||
        roles[0]?.club_id ||
        null;

      setSelectedClubIdState(targetClubId);
      if (targetClubId) {
        await loadClubDetail(targetClubId);
      } else {
        setClubDetail(null);
      }
    } catch {
      setAuthorized(false);
    }
  }, [loadClubDetail]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const setSelectedClubId = useCallback(
    (id: string) => {
      setSelectedClubIdState(id);
      localStorage.setItem('gts_selected_club_id', id);
      loadClubDetail(id);
    },
    [loadClubDetail]
  );

  const refreshClubData = useCallback(async () => {
    if (selectedClubId) {
      await loadClubDetail(selectedClubId);
    } else {
      await refreshSession();
    }
  }, [selectedClubId, loadClubDetail, refreshSession]);

  const activeRole = useMemo(() => {
    if (!selectedClubId) return null;
    return clubRoles.find((r) => r.club_id === selectedClubId) || null;
  }, [clubRoles, selectedClubId]);

  const isOwner = Boolean(activeRole?.is_owner || isAppAdmin);
  const isKeymaster = Boolean(isOwner || activeRole?.is_keymaster);
  const canManageTournaments = Boolean(isKeymaster || activeRole?.can_manage_tournaments);
  const canManageEvents = Boolean(isKeymaster || activeRole?.can_manage_events);

  return (
    <ClubManagementContext.Provider
      value={{
        authorized,
        isAppAdmin,
        clubRoles,
        selectedClubId,
        setSelectedClubId,
        clubDetail,
        licenses,
        tiersMap,
        isOwner,
        isKeymaster,
        canManageTournaments,
        canManageEvents,
        loadingClub,
        refreshClubData,
        refreshClubDetail: refreshClubData,
        refreshSession,
      }}
    >
      {children}
    </ClubManagementContext.Provider>
  );
}

export function useClubManagement() {
  const ctx = useContext(ClubManagementContext);
  if (!ctx) {
    throw new Error('useClubManagement must be used within a ClubManagementProvider');
  }
  return ctx;
}
