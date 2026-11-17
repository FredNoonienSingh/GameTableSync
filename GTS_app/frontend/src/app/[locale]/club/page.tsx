'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Table,
  TextInput,
  Textarea,
  Select,
  Switch,
  SimpleGrid,
  Divider,
  NumberInput,
  Alert,
  ActionIcon,
  Box,
  Tabs,
  FileButton,
  Avatar,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconLock,
  IconBrandDiscord,
  IconCheck,
  IconAlertTriangle,
  IconLayoutGrid,
  IconCalendarEvent,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
  IconBan,
  IconUsers,
  IconExternalLink,
  IconUpload,
} from '@tabler/icons-react';
import { TacticalTableGrid, type TacticalTableProps } from '@gts/ui';
import {
  useClubManagement,
  getClubAuthHeaders,
  type ClubTableDto,
} from '../../../context/ClubManagementContext';


interface TableReservationItem {
  id: string;
  source: 'reservation' | 'game';
  club_id: string;
  table_id: string | null;
  table_name: string;
  user_id: string;
  user_name: string;
  system: string;
  start_time: string;
  end_time: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  is_approved: boolean;
  note: string | null;
}

interface ClubMemberItem {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  discord_account: string | null;
  status: 'Pending' | 'Approved';
  created_at: string | null;
}

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const WEEKDAY_ROWS = [
  { key: '0', label: 'Montag' },
  { key: '1', label: 'Dienstag' },
  { key: '2', label: 'Mittwoch' },
  { key: '3', label: 'Donnerstag' },
  { key: '4', label: 'Freitag' },
  { key: '5', label: 'Samstag' },
  { key: '6', label: 'Sonntag' },
];

const DEFAULT_OPENING_HOURS: Record<
  string,
  { is_open: boolean; open: string; close: string }
> = {
  '0': { is_open: true, open: '14:00', close: '22:00' },
  '1': { is_open: true, open: '14:00', close: '22:00' },
  '2': { is_open: true, open: '14:00', close: '22:00' },
  '3': { is_open: true, open: '14:00', close: '22:00' },
  '4': { is_open: true, open: '14:00', close: '23:00' },
  '5': { is_open: true, open: '10:00', close: '22:00' },
  '6': { is_open: false, open: '12:00', close: '18:00' },
};

export default function ClubOverviewPage() {
  const locale = useLocale();
  const {
    clubDetail,
    selectedClubId,
    licenses,
    isOwner,
    isKeymaster,
    refreshClubData,
    refreshSession,
  } = useClubManagement();

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Create Club Form (when user has an unassigned license)
  const [newClubName, setNewClubName] = useState('');
  const [newClubCity, setNewClubCity] = useState('');
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const [creatingClub, setCreatingClub] = useState(false);

  // Settings, Global Opening Hours, Privacy & Theme Form
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editCountry, setEditCountry] = useState('DE');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editStoreUrl, setEditStoreUrl] = useState('');
  const [editGuildId, setEditGuildId] = useState('');
  const [editInviteUrl, setEditInviteUrl] = useState('');
  const [editForumChannelId, setEditForumChannelId] = useState('');
  const [editCustomBotName, setEditCustomBotName] = useState('');
  const [openingHours, setOpeningHours] = useState<
    Record<string, { is_open: boolean; open: string; close: string }>
  >(DEFAULT_OPENING_HOURS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Table Creation State
  const [tableName, setTableName] = useState('');
  const [tableDims, setTableDims] = useState('60" x 44"');
  const [tableMaxPlayers, setTableMaxPlayers] = useState<number>(4);
  const [tableSupportsTT, setTableSupportsTT] = useState(true);
  const [tableSupportsTCG, setTableSupportsTCG] = useState(false);
  const [tableSupportsRPG, setTableSupportsRPG] = useState(false);

  // Table Planner Calendar & Blocker State
  const [plannerMonth, setPlannerMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [blockerTarget, setBlockerTarget] = useState<string>('ALL');
  const [blockerStart, setBlockerStart] = useState('14:00');
  const [blockerEnd, setBlockerEnd] = useState('22:00');
  const [blockerNote, setBlockerNote] = useState('');
  const [addingBlocker, setAddingBlocker] = useState(false);

  const [reservations, setReservations] = useState<TableReservationItem[]>([]);
  const [members, setMembers] = useState<ClubMemberItem[]>([]);

  useEffect(() => {
    if (clubDetail) {
      setEditName(clubDetail.name || '');
      setEditDesc(clubDetail.description || '');
      setEditIsPrivate(Boolean(clubDetail.is_private));
      setEditStreet(clubDetail.address?.street || '');
      setEditCity(clubDetail.address?.city || '');
      setEditZip(clubDetail.address?.postal_code || '');
      setEditCountry(clubDetail.address?.country || 'DE');
      setEditEmail(clubDetail.contact?.email || '');
      setEditPhone(clubDetail.contact?.phone || '');
      setEditWebsite(clubDetail.contact?.website_url || '');
      setEditStoreUrl(clubDetail.contact?.online_store_url || '');
      setEditGuildId(clubDetail.discord?.guild_id || '');
      setEditInviteUrl(clubDetail.discord?.invite_url || '');
      setEditForumChannelId(clubDetail.discord?.config?.forum_channel_id || '');
      setEditCustomBotName(clubDetail.discord?.config?.custom_bot_name || '');
      setOpeningHours({
        ...DEFAULT_OPENING_HOURS,
        ...(clubDetail.opening_hours || {}),
      });
    }
  }, [clubDetail]);

  const loadReservationsAndMembers = useCallback(async () => {
    if (!selectedClubId) return;
    const headers = getClubAuthHeaders();
    try {
      const [resResp, memResp] = await Promise.all([
        fetch(`/api/clubs/${selectedClubId}/reservations`, { headers }),
        fetch(`/api/clubs/${selectedClubId}/members`, { headers }),
      ]);
      if (resResp.ok) {
        setReservations(await resResp.json());
      }
      if (memResp.ok) {
        setMembers(await memResp.json());
      }
    } catch {
      // ignore
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadReservationsAndMembers();
  }, [loadReservationsAndMembers]);

  const unassignedLicenses = useMemo(
    () => licenses.filter((l) => !l.club_id && l.status === 'active'),
    [licenses]
  );

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    setCreatingClub(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: getClubAuthHeaders(),
        body: JSON.stringify({
          name: newClubName.trim(),
          address_city: newClubCity.trim() || null,
          license_id: selectedLicenseId || unassignedLicenses[0]?.id || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Gründen.' });
        return;
      }
      setStatusBanner({ type: 'success', msg: data.msg });
      setNewClubName('');
      setNewClubCity('');
      await refreshSession();
    } finally {
      setCreatingClub(false);
    }
  };

  const handleUploadLogo = async (file: File | null) => {
    if (!file || !selectedClubId) return;
    setUploadingLogo(true);
    setStatusBanner(null);

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('gts_token');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/clubs/${selectedClubId}/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner({ type: 'success', msg: data.msg });
        await refreshClubData();
      } else {
        setStatusBanner({ type: 'error', msg: data.msg || 'Logo-Upload fehlgeschlagen.' });
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveClubSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId) return;
    setSavingSettings(true);
    setStatusBanner(null);

    const botLevel = clubDetail?.tier_limits?.discord_bot_access_level || 'basic';
    const discordConfigPayload: Record<string, any> = {};
    if (botLevel !== 'basic') {
      discordConfigPayload.forum_channel_id = editForumChannelId.trim() || null;
      discordConfigPayload.custom_bot_name = editCustomBotName.trim() || null;
    }

    try {
      const res = await fetch(`/api/clubs/${selectedClubId}`, {
        method: 'PUT',
        headers: getClubAuthHeaders(),
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          is_private: editIsPrivate,
          address_street: editStreet.trim(),
          address_city: editCity.trim(),
          address_postal_code: editZip.trim(),
          address_country: editCountry.trim(),
          contact_email: editEmail.trim(),
          contact_phone: editPhone.trim(),
          website_url: editWebsite.trim(),
          online_store_url: editStoreUrl.trim(),
          discord_guild_id: editGuildId.trim() || null,
          discord_invite_url: editInviteUrl.trim() || null,
          opening_hours: openingHours,
          ...(Object.keys(discordConfigPayload).length > 0
            ? { discord_config: discordConfigPayload }
            : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner({ type: 'success', msg: data.msg });
        await refreshClubData();
      } else {
        setStatusBanner({ type: 'error', msg: data.msg || 'Speichern fehlgeschlagen.' });
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !tableName.trim()) return;
    setStatusBanner(null);

    const res = await fetch(`/api/clubs/${selectedClubId}/tables`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({
        name: tableName.trim(),
        dimensions: tableDims.trim(),
        max_players: tableMaxPlayers,
        supports_tabletop: tableSupportsTT,
        supports_tcg: tableSupportsTCG,
        supports_rpg: tableSupportsRPG,
        is_active: true,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setTableName('');
      await refreshClubData();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Tisch konnte nicht angelegt werden.' });
    }
  };

  const handleToggleTableActive = async (table: ClubTableDto) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/tables/${table.id}`, {
      method: 'PUT',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({ is_active: !table.is_active }),
    });
    if (res.ok) {
      await refreshClubData();
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/tables/${tableId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      await refreshClubData();
    }
  };

  const handleAddBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubDetail || !selectedDate || !blockerStart || !blockerEnd) return;
    setAddingBlocker(true);
    setStatusBanner(null);

    try {
      const targetTables =
        blockerTarget === 'ALL'
          ? clubDetail.tables
          : clubDetail.tables.filter((t) => t.id === blockerTarget);

      await Promise.all(
        targetTables.map((t) =>
          fetch(`/api/clubs/tables/${t.id}/schedules`, {
            method: 'POST',
            headers: getClubAuthHeaders(),
            body: JSON.stringify({
              specific_date: selectedDate,
              open_time: blockerStart,
              close_time: blockerEnd,
              is_blocked: true,
              note: blockerNote.trim() || 'Blocker',
            }),
          })
        )
      );

      setStatusBanner({ type: 'success', msg: 'Tisch-Blocker eingetragen!' });
      setBlockerNote('');
      await refreshClubData();
    } finally {
      setAddingBlocker(false);
    }
  };

  const handleDeleteBlocker = async (tableId: string, scheduleId: string) => {
    const res = await fetch(`/api/clubs/tables/${tableId}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      await refreshClubData();
    }
  };

  const handleUpdateReservationStatus = async (
    item: TableReservationItem,
    newStatus: 'Approved' | 'Rejected' | 'Pending' | 'Deleted'
  ) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/reservations/${item.id}/status`, {
      method: 'PUT',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({ status: newStatus, source: item.source }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadReservationsAndMembers();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg });
    }
  };

  const handleUpdateMemberStatus = async (memberId: string, newStatus: 'Approved' | 'Deleted') => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/members/${memberId}`, {
      method: newStatus === 'Deleted' ? 'DELETE' : 'PUT',
      headers: getClubAuthHeaders(),
      body: newStatus === 'Deleted' ? undefined : JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadReservationsAndMembers();
    }
  };

  // Monthly Calendar Cells for Table Planner
  const calendarDays = useMemo(() => {
    const year = plannerMonth.getFullYear();
    const month = plannerMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDay.getDate();

    const cells: { dateStr: string; dayNum: number; weekdayKey: string }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ dateStr: '', dayNum: 0, weekdayKey: '0' });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const wk = String((dt.getDay() + 6) % 7);
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr: ds, dayNum: d, weekdayKey: wk });
    }
    return cells;
  }, [plannerMonth]);

  const allBlockers = useMemo(() => {
    if (!clubDetail?.tables) return [];
    return clubDetail.tables.flatMap((t) =>
      (t.schedules || [])
        .filter((s) => s.is_blocked && s.specific_date)
        .map((s) => ({
          ...s,
          table_id: t.id,
          table_name: t.name,
        }))
    );
  }, [clubDetail?.tables]);

  if (!clubDetail) {
    return (
      <Stack gap="lg" maw={1100}>
        <Paper p="xl" radius="md" withBorder className="gts-panel-header gts-form">
          <Badge variant="outline" className="gts-tier-badge" mb="xs">
            STORE ONBOARDING
          </Badge>
          <Title order={2} className="brand-logo gts-army-title" mb="md">
            CLUB ODER STORE EINRICHTEN
          </Title>

          {statusBanner && (
            <Alert
              className="gts-alert"
              data-tone={statusBanner.type === 'success' ? 'success' : 'danger'}
              mb="md"
            >
              {statusBanner.msg}
            </Alert>
          )}

          <form onSubmit={handleCreateClub}>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md" className="gts-align-end">
              <TextInput
                label="Name"
                placeholder="z.B. Citadel Tabletop Store"
                required
                value={newClubName}
                onChange={(e) => setNewClubName(e.currentTarget.value)}
              />
              <TextInput
                label="Stadt"
                placeholder="Berlin"
                value={newClubCity}
                onChange={(e) => setNewClubCity(e.currentTarget.value)}
              />
              {unassignedLicenses.length > 0 && (
                <Select
                  label="Lizenz"
                  value={selectedLicenseId || unassignedLicenses[0]?.id}
                  onChange={setSelectedLicenseId}
                  data={unassignedLicenses.map((l) => ({
                    value: l.id,
                    label: `${l.tier_details?.name || l.tier} (${
                      l.license_type === 'combined' ? 'Multi-Store' : 'Einzel'
                    })`,
                  }))}
                />
              )}
            </SimpleGrid>
            <Button
              type="submit"
              variant="default"
              className="gts-btn-primary"
              loading={creatingClub}
              leftSection={<IconPlus size={16} />}
            >
              Club erstellen
            </Button>
          </form>
        </Paper>
      </Stack>
    );
  }

  const tierLimits = clubDetail.tier_limits;
  const currentTablesCount = clubDetail.tables?.length || 0;
  const maxTables = tierLimits?.max_tables ?? 4;
  const isAtTableLimit = currentTablesCount >= maxTables;
  const botAccessLevel = tierLimits?.discord_bot_access_level || 'basic';
  const isCitadelOrAbove =
    clubDetail.tier === 'tier_3' ||
    clubDetail.tier === 'tier_4' ||
    Boolean((tierLimits as any)?.can_edit_logo_and_description);

  const tacticalTableItems: TacticalTableProps[] = (clubDetail.tables || []).map((t) => {
    const now = new Date();
    const activeRes = reservations.find(
      (r) =>
        r.table_id === t.id &&
        r.is_approved &&
        new Date(r.start_time) <= now &&
        new Date(r.end_time) >= now
    );
    return {
      id: t.id,
      name: t.name,
      category: t.supports_tabletop ? 'wargaming' : 'card_board',
      status: activeRes ? 'occupied' : 'free',
      occupiedUntil: activeRes?.end_time || null,
      dimensionsLabel: t.dimensions || (t.supports_tabletop ? '60" × 44"' : 'TCG / RPG Pod'),
    };
  });

  const selectedDayReservations = reservations.filter((r) =>
    r.start_time.startsWith(selectedDate)
  );
  const selectedDayBlockers = allBlockers.filter(
    (b) => b.specific_date === selectedDate
  );
  const pendingReservationsCount = reservations.filter((r) => !r.is_approved).length;
  const pendingMembersCount = members.filter((m) => m.status === 'Pending').length;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <Stack gap="lg" maw={1100}>
      <Paper p="lg" radius="md" withBorder className="gts-panel-header">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <Title order={2} className="brand-logo gts-army-title">
              {clubDetail.name.toUpperCase()}
            </Title>
            <Badge variant="outline" size="sm" className="brand-logo gts-tier-badge">
              {tierLimits?.display_label || clubDetail.tier}
            </Badge>
            <Badge
              variant="outline"
              size="sm"
              className="gts-status-badge"
              data-tone={isAtTableLimit ? 'danger' : 'success'}
            >
              {currentTablesCount} / {maxTables} TISCHE
            </Badge>
            {clubDetail.is_private && (
              <Badge variant="outline" className="gts-status-badge" data-tone="muted">
                PRIVAT
              </Badge>
            )}
          </Group>

          <Group gap="xs">
            {pendingMembersCount > 0 && (
              <Badge variant="outline" className="gts-status-badge" data-tone="warning">
                {pendingMembersCount} BEITRITTSANFRAGEN
              </Badge>
            )}
            <Button
              component={Link}
              href={`/${locale}/club/public-page`}
              size="xs"
              variant="default"
              className="gts-btn-ghost"
              leftSection={<IconSettings size={14} />}
            >
              Seite einrichten & Vorschau
            </Button>
            <Button
              component={Link}
              href={`/${locale}/s/${clubDetail.slug}`}
              size="xs"
              variant="default"
              className="gts-btn-secondary"
              rightSection={<IconExternalLink size={14} />}
            >
              Öffentliche Seite
            </Button>
          </Group>
        </Group>
      </Paper>

      {statusBanner && (
        <Alert
          className="gts-alert"
          data-tone={statusBanner.type === 'success' ? 'success' : 'danger'}
          icon={
            statusBanner.type === 'success' ? (
              <IconCheck size={18} />
            ) : (
              <IconAlertTriangle size={18} />
            )
          }
          withCloseButton
          onClose={() => setStatusBanner(null)}
        >
          {statusBanner.msg}
        </Alert>
      )}

      <Tabs defaultValue="planner" variant="pills" className="gts-pill-tabs" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="planner" leftSection={<IconCalendarEvent size={16} />}>
            Tisch-Planer & Kalender
          </Tabs.Tab>
          <Tabs.Tab value="tables" leftSection={<IconLayoutGrid size={16} />}>
            Tische ({currentTablesCount}/{maxTables})
          </Tabs.Tab>
          {isKeymaster && (
            <Tabs.Tab value="members" leftSection={<IconUsers size={16} />}>
              Mitglieder & Beitrittsanfragen ({members.length})
            </Tabs.Tab>
          )}
          {isOwner && (
            <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
              Store-Einstellungen & Öffnungszeiten
            </Tabs.Tab>
          )}
        </Tabs.List>

        {/* =========================================================
            TAB 1: CALENDAR VIEW IN THE TABLE PLANNER (BLOCKERS + LFG APPROVALS)
           ========================================================= */}
        <Tabs.Panel value="planner">
          <Stack gap="lg">
            <Paper p="lg" radius="md" withBorder className="gts-panel-card gts-form">
              <Group justify="space-between" mb="md" wrap="wrap">
                <Group gap="xs">
                  <IconCalendarEvent size={18} className="gts-section-icon" />
                  <Text className="gts-section-heading">TISCH-KALENDER & BLOCKER</Text>
                </Group>

                <Group gap="xs">
                  <ActionIcon
                    variant="default"
                    className="gts-icon-btn"
                    onClick={() =>
                      setPlannerMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                  >
                    <IconChevronLeft size={16} />
                  </ActionIcon>
                  <Badge size="md" variant="outline" className="brand-logo gts-tier-badge">
                    {plannerMonth.toLocaleDateString('de-DE', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Badge>
                  <ActionIcon
                    variant="default"
                    className="gts-icon-btn"
                    onClick={() =>
                      setPlannerMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                  >
                    <IconChevronRight size={16} />
                  </ActionIcon>
                </Group>
              </Group>

              {isKeymaster && clubDetail.tables.length > 0 && (
                <form onSubmit={handleAddBlocker}>
                  <SimpleGrid cols={{ base: 1, sm: 6 }} spacing="sm" mb="md" className="gts-align-end">
                    <Select
                      label="Tisch"
                      size="xs"
                      value={blockerTarget}
                      onChange={(v) => setBlockerTarget(v || 'ALL')}
                      data={[
                        { value: 'ALL', label: 'Alle Tische sperren' },
                        ...clubDetail.tables.map((t) => ({ value: t.id, label: t.name })),
                      ]}
                    />
                    <TextInput
                      label="Datum"
                      type="date"
                      size="xs"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.currentTarget.value)}
                    />
                    <TextInput
                      label="Von"
                      type="time"
                      size="xs"
                      required
                      value={blockerStart}
                      onChange={(e) => setBlockerStart(e.currentTarget.value)}
                    />
                    <TextInput
                      label="Bis"
                      type="time"
                      size="xs"
                      required
                      value={blockerEnd}
                      onChange={(e) => setBlockerEnd(e.currentTarget.value)}
                    />
                    <TextInput
                      label="Grund"
                      placeholder="Turnier / Event"
                      size="xs"
                      value={blockerNote}
                      onChange={(e) => setBlockerNote(e.currentTarget.value)}
                    />
                    <Button
                      type="submit"
                      size="xs"
                      variant="default"
                      className="gts-btn-danger"
                      loading={addingBlocker}
                      leftSection={<IconBan size={14} />}
                    >
                      Blocker setzen
                    </Button>
                  </SimpleGrid>
                </form>
              )}

              <Box>
                <div className="gts-calendar-grid">
                  {WEEKDAY_HEADERS.map((w) => (
                    <div key={w} className="gts-calendar-weekday">
                      {w}
                    </div>
                  ))}
                </div>

                <div className="gts-calendar-grid">
                  {calendarDays.map((cell, idx) => {
                    if (!cell.dateStr) {
                      return (
                        <div key={`empty-${idx}`} className="gts-calendar-cell" data-empty="true" />
                      );
                    }

                    const dayHourCfg = openingHours[cell.weekdayKey] || {
                      is_open: true,
                      open: '14:00',
                      close: '22:00',
                    };
                    const dayBlockers = allBlockers.filter(
                      (b) => b.specific_date === cell.dateStr
                    );
                    const dayRes = reservations.filter((r) =>
                      r.start_time.startsWith(cell.dateStr)
                    );
                    const isSelected = selectedDate === cell.dateStr;

                    return (
                      <div
                        key={cell.dateStr}
                        className="gts-calendar-cell"
                        data-closed={!dayHourCfg.is_open}
                        data-selected={isSelected}
                        data-today={cell.dateStr === todayStr}
                        data-has-blocker={dayBlockers.length > 0}
                        data-has-pending={dayRes.some((r) => !r.is_approved)}
                        onClick={() => setSelectedDate(cell.dateStr)}
                      >
                        <div className="gts-calendar-cell-head">
                          <span className="gts-calendar-daynum">{cell.dayNum}</span>
                          <span className="gts-calendar-hours">
                            {dayHourCfg.is_open
                              ? `${dayHourCfg.open}–${dayHourCfg.close}`
                              : 'Geschl.'}
                          </span>
                        </div>

                        <div className="gts-calendar-entries">
                          {dayBlockers.map((b) => (
                            <span key={b.id} className="gts-calendar-dot" data-kind="blocker">
                              🔒 {b.table_name}: {b.open_time}–{b.close_time}
                            </span>
                          ))}

                          {dayRes.map((r) => (
                            <span
                              key={`${r.source}-${r.id}`}
                              className="gts-calendar-dot"
                              data-kind={r.is_approved ? 'approved' : 'pending'}
                            >
                              {r.table_name}: {r.user_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Box>
            </Paper>

            <Paper p="lg" radius="md" withBorder className="gts-panel-card">
              <Group justify="space-between" mb="md" wrap="wrap">
                <Text className="gts-section-heading">
                  TAGESÜBERSICHT ({new Date(selectedDate).toLocaleDateString('de-DE')})
                </Text>
                <Badge variant="outline" className="gts-game-meta-tag">
                  {selectedDayBlockers.length} BLOCKER • {selectedDayReservations.length} SPIELER-RESERVIERUNGEN
                </Badge>
              </Group>

              {selectedDayBlockers.length > 0 && (
                <Stack gap="xs" mb="md">
                  {selectedDayBlockers.map((b) => (
                    <Group
                      key={b.id}
                      justify="space-between"
                      p="xs"
                      className="gts-subcard-accent"
                      data-tone="danger"
                    >
                      <Group gap="sm">
                        <Badge size="xs" variant="outline" className="gts-status-badge" data-tone="danger">
                          BLOCKER
                        </Badge>
                        <Text size="xs" fw={700} className="gts-text-heading">
                          {b.table_name}
                        </Text>
                        <Text size="xs" className="gts-text-muted">
                          {b.open_time} – {b.close_time} {b.note ? `• ${b.note}` : ''}
                        </Text>
                      </Group>
                      {isKeymaster && (
                        <ActionIcon
                          size="sm"
                          variant="default"
                          className="gts-icon-btn-danger"
                          onClick={() => handleDeleteBlocker(b.table_id, b.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                </Stack>
              )}

              {selectedDayReservations.length === 0 ? (
                <div className="gts-empty-state">Keine Spieler-Reservierungen an diesem Tag.</div>
              ) : (
                <Table striped highlightOnHover className="gts-data-table">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tisch</Table.Th>
                      <Table.Th>Uhrzeit</Table.Th>
                      <Table.Th>Spieler</Table.Th>
                      <Table.Th>System</Table.Th>
                      <Table.Th>Status</Table.Th>
                      {isKeymaster && <Table.Th>Freigabe</Table.Th>}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedDayReservations.map((r) => (
                      <Table.Tr key={`${r.source}-${r.id}`}>
                        <Table.Td fw={700}>{r.table_name}</Table.Td>
                        <Table.Td>
                          {new Date(r.start_time).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          –{' '}
                          {new Date(r.end_time).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Table.Td>
                        <Table.Td>{r.user_name}</Table.Td>
                        <Table.Td>{r.system}</Table.Td>
                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="outline"
                            className="gts-status-badge"
                            data-tone={r.is_approved ? 'success' : 'warning'}
                          >
                            {r.is_approved ? 'Bestätigt' : 'Wartend'}
                          </Badge>
                        </Table.Td>
                        {isKeymaster && (
                          <Table.Td>
                            <Group gap={6} wrap="nowrap">
                              {!r.is_approved ? (
                                <Button
                                  size="xs"
                                  variant="default"
                                  className="gts-btn-success"
                                  onClick={() => handleUpdateReservationStatus(r, 'Approved')}
                                >
                                  Freigeben
                                </Button>
                              ) : (
                                <Button
                                  size="xs"
                                  variant="default"
                                  className="gts-btn-ghost"
                                  onClick={() => handleUpdateReservationStatus(r, 'Pending')}
                                >
                                  Pausieren
                                </Button>
                              )}
                              {r.source === 'reservation' && (
                                <ActionIcon
                                  variant="default"
                                  className="gts-icon-btn-danger"
                                  size="sm"
                                  onClick={() => handleUpdateReservationStatus(r, 'Deleted')}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              )}
                            </Group>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* =========================================================
            TAB 2: TABLES & LIVE FLOOR PLAN
           ========================================================= */}
        <Tabs.Panel value="tables">
          <Stack gap="lg">
            <Paper p="lg" radius="md" withBorder className="gts-panel-card gts-form">
              <Group gap="xs" mb="md">
                <IconLayoutGrid size={18} className="gts-section-icon" />
                <Text className="gts-section-heading">
                  SPIELTISCHE ({currentTablesCount} / {maxTables})
                </Text>
              </Group>

              {isOwner && (
                <form onSubmit={handleCreateTable}>
                  <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="md" className="gts-align-end">
                    <TextInput
                      label="Tischname"
                      placeholder="Tisch 1"
                      required
                      disabled={isAtTableLimit}
                      value={tableName}
                      onChange={(e) => setTableName(e.currentTarget.value)}
                    />
                    <TextInput
                      label="Maße"
                      placeholder='60" x 44"'
                      disabled={isAtTableLimit}
                      value={tableDims}
                      onChange={(e) => setTableDims(e.currentTarget.value)}
                    />
                    <NumberInput
                      label="Max. Spieler"
                      min={2}
                      max={16}
                      disabled={isAtTableLimit}
                      value={tableMaxPlayers}
                      onChange={(v) => setTableMaxPlayers(Number(v) || 4)}
                    />
                    <Button
                      type="submit"
                      variant="default"
                      className="gts-btn-primary"
                      disabled={isAtTableLimit}
                      leftSection={<IconPlus size={14} />}
                    >
                      {isAtTableLimit ? 'Tier-Limit erreicht' : 'Tisch anlegen'}
                    </Button>
                  </SimpleGrid>

                  <Group gap="lg" mb="md">
                    <Switch
                      size="xs"
                      label="Tabletop"
                      disabled={isAtTableLimit}
                      checked={tableSupportsTT}
                      onChange={(e) => setTableSupportsTT(e.currentTarget.checked)}
                    />
                    <Switch
                      size="xs"
                      label="TCG"
                      disabled={isAtTableLimit}
                      checked={tableSupportsTCG}
                      onChange={(e) => setTableSupportsTCG(e.currentTarget.checked)}
                    />
                    <Switch
                      size="xs"
                      label="RPG"
                      disabled={isAtTableLimit}
                      checked={tableSupportsRPG}
                      onChange={(e) => setTableSupportsRPG(e.currentTarget.checked)}
                    />
                  </Group>
                </form>
              )}

              {tacticalTableItems.length > 0 && (
                <Box my="md" data-gts-theme={clubDetail.theme_config?.preset || 'gts'}>
                  <TacticalTableGrid tables={tacticalTableItems} />
                </Box>
              )}

              {clubDetail.tables.length > 0 && (
                <Table striped highlightOnHover className="gts-data-table">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tisch</Table.Th>
                      <Table.Th>Kategorien</Table.Th>
                      <Table.Th>Maße</Table.Th>
                      <Table.Th>Status</Table.Th>
                      {isOwner && <Table.Th>Löschen</Table.Th>}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {clubDetail.tables.map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td fw={700}>{t.name}</Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {t.supports_tabletop && (
                              <Badge size="xs" variant="outline" className="gts-status-badge">
                                Tabletop
                              </Badge>
                            )}
                            {t.supports_tcg && (
                              <Badge
                                size="xs"
                                variant="outline"
                                className="gts-status-badge"
                                data-tone="accent"
                              >
                                TCG
                              </Badge>
                            )}
                            {t.supports_rpg && (
                              <Badge
                                size="xs"
                                variant="outline"
                                className="gts-status-badge"
                                data-tone="gold"
                              >
                                RPG
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {t.dimensions || 'Standard'} ({t.max_players} Spieler)
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            size="xs"
                            checked={t.is_active}
                            disabled={!isOwner}
                            onChange={() => handleToggleTableActive(t)}
                            label={t.is_active ? 'Aktiv' : 'Pausiert'}
                          />
                        </Table.Td>
                        {isOwner && (
                          <Table.Td>
                            <ActionIcon
                              variant="default"
                              className="gts-icon-btn-danger"
                              onClick={() => handleDeleteTable(t.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* =========================================================
            TAB 3: MEMBERS & JOIN REQUEST APPROVALS (OUTPOST / PRIVATE)
           ========================================================= */}
        {isKeymaster && (
          <Tabs.Panel value="members">
            <Paper p="lg" radius="md" withBorder className="gts-panel-card">
              <Group gap="xs" mb="md">
                <IconUsers size={18} className="gts-section-icon" />
                <Text className="gts-section-heading">
                  MITGLIEDER & BEITRITTSANFRAGEN ({members.length})
                </Text>
              </Group>

              {members.length === 0 ? (
                <div className="gts-empty-state">Noch keine Mitglieder oder Beitrittsanfragen.</div>
              ) : (
                <Table striped highlightOnHover className="gts-data-table">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Spieler</Table.Th>
                      <Table.Th>Discord</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Aktion</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {members.map((m) => (
                      <Table.Tr key={m.id}>
                        <Table.Td fw={700}>{m.display_name}</Table.Td>
                        <Table.Td>{m.discord_account || '—'}</Table.Td>
                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="outline"
                            className="gts-status-badge"
                            data-tone={m.status === 'Approved' ? 'success' : 'warning'}
                          >
                            {m.status === 'Approved' ? 'Mitglied' : 'Anfrage offen'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {m.status === 'Pending' && (
                              <Button
                                size="xs"
                                variant="default"
                                className="gts-btn-success"
                                onClick={() => handleUpdateMemberStatus(m.id, 'Approved')}
                              >
                                Bestätigen
                              </Button>
                            )}
                            <ActionIcon
                              variant="default"
                              className="gts-icon-btn-danger"
                              size="sm"
                              onClick={() => handleUpdateMemberStatus(m.id, 'Deleted')}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Tabs.Panel>
        )}

        {/* =========================================================
            TAB 4: STORE SETTINGS, PRIVACY, CITADEL LOGO, GLOBAL OPENING HOURS & DISCORD
           ========================================================= */}
        {isOwner && (
          <Tabs.Panel value="settings">
            <Paper
              component="form"
              onSubmit={handleSaveClubSettings}
              p="lg"
              radius="md"
              withBorder
              className="gts-panel-card gts-form"
            >
              <Stack gap="md">
                {/* Privacy Toggle & Public Subdomain / URL */}
                <Group justify="space-between" align="center" wrap="wrap">
                  <Group gap="md">
                    <Switch
                      size="sm"
                      label="Seite auf Privat stellen (Nur bestätigte Mitglieder sehen Inhalte)"
                      checked={editIsPrivate}
                      onChange={(e) => setEditIsPrivate(e.currentTarget.checked)}
                    />
                  </Group>
                  <Badge
                    variant="outline"
                    className="gts-status-badge"
                    data-tone={isCitadelOrAbove ? 'accent' : 'muted'}
                  >
                    {isCitadelOrAbove
                      ? `${clubDetail.slug}.gametablesync.com`
                      : `gametablesync.com/${locale}/s/${clubDetail.slug}`}
                  </Badge>
                </Group>

                <Divider className="gts-divider" label="Store-Logo & Beschreibung" labelPosition="left" />

                {/* Citadel+ Logo Upload & Description */}
                <Group gap="lg" align="center" wrap="wrap">
                  <Avatar
                    src={clubDetail.logo_url || null}
                    size={64}
                    radius="md"
                    className={clubDetail.logo_url ? 'gts-logo-frame' : 'gts-logo-fallback'}
                  >
                    {clubDetail.name.slice(0, 2).toUpperCase()}
                  </Avatar>

                  {isCitadelOrAbove ? (
                    <FileButton
                      onChange={handleUploadLogo}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                    >
                      {(props) => (
                        <Button
                          {...props}
                          size="xs"
                          variant="default"
                          className="gts-btn-secondary"
                          loading={uploadingLogo}
                          leftSection={<IconUpload size={14} />}
                        >
                          Store-Logo hochladen (Citadel)
                        </Button>
                      )}
                    </FileButton>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gts-status-badge"
                      data-tone="muted"
                      leftSection={<IconLock size={12} />}
                    >
                      Eigenes Store-Logo & Subdomain ab Citadel (Tier 3)
                    </Badge>
                  )}
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Name"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.currentTarget.value)}
                  />
                  <TextInput label="Slug" value={clubDetail.slug} disabled />
                </SimpleGrid>

                <Textarea
                  label="Beschreibung"
                  minRows={2}
                  disabled={!isCitadelOrAbove && clubDetail.tier !== 'tier_1'}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.currentTarget.value)}
                />

                <Divider className="gts-divider" label="Globale Store-Öffnungszeiten" labelPosition="left" />

                <Stack gap="xs">
                  {WEEKDAY_ROWS.map((day) => {
                    const cfg = openingHours[day.key] || {
                      is_open: true,
                      open: '14:00',
                      close: '22:00',
                    };
                    return (
                      <SimpleGrid
                        key={day.key}
                        cols={{ base: 1, sm: 4 }}
                        spacing="sm"
                        className="gts-subcard gts-hours-row gts-align-center"
                        data-closed={!cfg.is_open}
                      >
                        <Text size="xs" fw={700} className="gts-text-heading">
                          {day.label}
                        </Text>
                        <Switch
                          size="xs"
                          label={cfg.is_open ? 'Geöffnet' : 'Geschlossen'}
                          checked={cfg.is_open}
                          onChange={(e) => {
                            const checked = e.currentTarget.checked;
                            setOpeningHours((prev) => ({
                              ...prev,
                              [day.key]: { ...cfg, is_open: checked },
                            }));
                          }}
                        />
                        <TextInput
                          size="xs"
                          type="time"
                          disabled={!cfg.is_open}
                          value={cfg.open}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            setOpeningHours((prev) => ({
                              ...prev,
                              [day.key]: { ...cfg, open: val },
                            }));
                          }}
                        />
                        <TextInput
                          size="xs"
                          type="time"
                          disabled={!cfg.is_open}
                          value={cfg.close}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            setOpeningHours((prev) => ({
                              ...prev,
                              [day.key]: { ...cfg, close: val },
                            }));
                          }}
                        />
                      </SimpleGrid>
                    );
                  })}
                </Stack>

                <Divider className="gts-divider" label="Adresse & Kontakt" labelPosition="left" />

                <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
                  <TextInput
                    label="Straße"
                    value={editStreet}
                    onChange={(e) => setEditStreet(e.currentTarget.value)}
                  />
                  <TextInput
                    label="PLZ"
                    value={editZip}
                    onChange={(e) => setEditZip(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Stadt"
                    value={editCity}
                    onChange={(e) => setEditCity(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Land"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.currentTarget.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
                  <TextInput
                    label="E-Mail"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Telefon"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Website"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Online-Shop"
                    value={editStoreUrl}
                    onChange={(e) => setEditStoreUrl(e.currentTarget.value)}
                  />
                </SimpleGrid>

                <Divider
                  className="gts-divider"
                  label={`Discord (${botAccessLevel.toUpperCase()})`}
                  labelPosition="left"
                />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Server / Guild ID"
                    value={editGuildId}
                    onChange={(e) => setEditGuildId(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Invite-Link"
                    value={editInviteUrl}
                    onChange={(e) => setEditInviteUrl(e.currentTarget.value)}
                  />
                </SimpleGrid>

                {botAccessLevel === 'basic' ? (
                  <Alert className="gts-alert" data-tone="warning" icon={<IconLock size={16} />}>
                    <Text size="xs">
                      Forum-Threads & Custom Bot-Name ab Stronghold (Tier 2).
                    </Text>
                  </Alert>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <TextInput
                      label="Turnier-Forum Channel ID"
                      leftSection={<IconBrandDiscord size={16} />}
                      value={editForumChannelId}
                      onChange={(e) => setEditForumChannelId(e.currentTarget.value)}
                    />
                    <TextInput
                      label="Custom Bot-Name"
                      value={editCustomBotName}
                      onChange={(e) => setEditCustomBotName(e.currentTarget.value)}
                    />
                  </SimpleGrid>
                )}

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    variant="default"
                    className="gts-btn-primary"
                    loading={savingSettings}
                    leftSection={<IconDeviceFloppy size={18} />}
                  >
                    Speichern
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
}
