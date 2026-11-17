'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Grid,
  SimpleGrid,
  Divider,
  Avatar,
  Center,
  Loader,
  Alert,
  Modal,
  Tabs,
  Box,
  TextInput,
  Select,
  NumberInput,
  SegmentedControl,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconMapPin,
  IconMail,
  IconPhone,
  IconWorld,
  IconShoppingBag,
  IconBrandDiscord,
  IconCalendarEvent,
  IconTrophy,
  IconUsers,
  IconLock,
  IconCheck,
  IconClock,
  IconUserPlus,
  IconUserCheck,
  IconSwords,
  IconCards,
  IconLayoutGrid,
} from '@tabler/icons-react';
import {
  AnimatedBackground,
  AppHeader,
  GalleryShowcase,
  TacticalTableGrid,
  TournamentCard,
  TournamentBracketGraphic,
  SwissTournamentGraphic,
  TournamentStandingsTable,
  type TacticalTableProps,
  type BracketRound,
  type SwissRound,
} from '@gts/ui';
import { useAuth } from '../../../../context/AuthContext';

const THEME_PRESET_KEYS = ['gts', 'ember', 'gold', 'crimson', 'emerald', 'violet', 'steel'] as const;
type ThemePresetKey = (typeof THEME_PRESET_KEYS)[number];

const resolveThemePreset = (value: unknown): ThemePresetKey =>
  (THEME_PRESET_KEYS as readonly string[]).includes(value as string)
    ? (value as ThemePresetKey)
    : 'gts';

const WEEKDAY_NAMES: Record<string, string> = {
  '0': 'Mo',
  '1': 'Di',
  '2': 'Mi',
  '3': 'Do',
  '4': 'Fr',
  '5': 'Sa',
  '6': 'So',
};

export default function PublicClubStorePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const locale = useLocale();
  const { token, openLogin } = useAuth();

  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Tournament Bracket / Swiss Animation Modal
  const [activeTourneyCategory, setActiveTourneyCategory] = useState<'tabletop' | 'tcg'>('tabletop');
  const [inspectedTourney, setInspectedTourney] = useState<any | null>(null);

  // Table Status & Reservation State
  const [tableTimeMode, setTableTimeMode] = useState<'live' | 'schedule'>('live');
  const [resDate, setResDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [resStartTime, setResStartTime] = useState<string>('16:00');
  const [resDurationHours, setResDurationHours] = useState<number>(3);
  const [resTableId, setResTableId] = useState<string | null>(null);
  const [resSystem, setResSystem] = useState<string>('Warhammer 40k');
  const [resNote, setResNote] = useState<string>('');
  const [resSubmitting, setResSubmitting] = useState(false);

  const loadPublicPage = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    const activeToken =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`/api/clubs/${encodeURIComponent(slug)}/public`, {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Seite nicht gefunden.');
        return;
      }
      setClub(data);
    } catch {
      setError('Server nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPublicPage();
  }, [loadPublicPage]);

  const handleJoinOrAssociate = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      openLogin();
      return;
    }
    setJoining(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/clubs/${encodeURIComponent(slug)}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.msg);
        await loadPublicPage();
      } else {
        setActionMsg(data.msg || 'Aktion fehlgeschlagen.');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveClub = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/clubs/${encodeURIComponent(slug)}/join`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        await loadPublicPage();
      }
    } finally {
      setJoining(false);
    }
  };

  const handleToggleEventAttendance = async (eventId: string) => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      openLogin();
      return;
    }
    const res = await fetch(`/api/events/${eventId}/attend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const data = await res.json();
    if (res.ok) {
      setActionMsg(data.msg);
      await loadPublicPage();
    }
  };

  const handleRegisterTournament = async (tournamentId: string | number) => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      openLogin();
      return;
    }
    const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok) {
      setActionMsg(data.msg);
      await loadPublicPage();
    } else {
      setActionMsg(data.msg);
    }
  };

  const handleRequestTableReservation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      openLogin();
      return;
    }
    if (!club?.id || !resTableId || !resDate || !resStartTime) return;
    setResSubmitting(true);
    setActionMsg(null);
    try {
      const startIso = `${resDate}T${resStartTime}:00`;
      const startDt = new Date(startIso);
      const endDt = new Date(startDt.getTime() + (resDurationHours || 3) * 3600 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      const endIso = `${endDt.getFullYear()}-${pad(endDt.getMonth() + 1)}-${pad(
        endDt.getDate()
      )}T${pad(endDt.getHours())}:${pad(endDt.getMinutes())}:00`;

      const res = await fetch(`/api/clubs/${club.id}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          table_id: resTableId,
          system: resSystem,
          start_time: startIso,
          end_time: endIso,
          note: resNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(
          data.status === 'Approved'
            ? 'Tisch-Reservierung bestätigt!'
            : 'Reservierungsanfrage gesendet (wartet auf Freigabe durch Keymaster).'
        );
        setResNote('');
        await loadPublicPage();
      } else {
        setActionMsg(data.msg || 'Reservierung fehlgeschlagen.');
      }
    } finally {
      setResSubmitting(false);
    }
  };

  // Build visual Swiss / KO rounds for inspectedTourney
  const inspectedSwissRounds: SwissRound[] = useMemo(() => {
    if (!inspectedTourney) return [];
    const byRound = new Map<number, any[]>();
    for (const m of inspectedTourney.matches || []) {
      const list = byRound.get(m.round_number) || [];
      list.push(m);
      byRound.set(m.round_number, list);
    }
    return Array.from(byRound.entries()).map(([rNum, rMatches]) => ({
      id: `round-${rNum}`,
      title: `RUNDE ${rNum}`,
      status: rMatches.every((m) => m.status === 'Completed') ? 'completed' : 'active',
      matches: rMatches.map((m, idx) => ({
        id: `${rNum}.${idx + 1}`,
        status: m.status === 'Completed' ? 'finished' : 'open',
        top: {
          id: m.player1_id,
          name: m.player1_name || 'TBD',
          score: m.score_player1 !== null ? String(m.score_player1) : null,
          isWinner: m.winner_id !== null && m.winner_id === m.player1_id,
        },
        bottom: {
          id: m.player2_id,
          name: m.player2_name || 'BYE',
          score: m.score_player2 !== null ? String(m.score_player2) : null,
          isWinner: m.winner_id !== null && m.winner_id === m.player2_id,
        },
      })),
    }));
  }, [inspectedTourney]);

  const inspectedBracketRounds: BracketRound[] = useMemo(() => {
    if (!inspectedTourney) return [];
    const byRound = new Map<number, any[]>();
    for (const m of inspectedTourney.matches || []) {
      const list = byRound.get(m.round_number) || [];
      list.push(m);
      byRound.set(m.round_number, list);
    }
    return Array.from(byRound.entries()).map(([rNum, rMatches]) => ({
      id: `ko-${rNum}`,
      title: `KO RUNDE ${rNum}`,
      matches: rMatches.map((m, idx) => ({
        id: `${rNum}.${idx + 1}`,
        status: m.status === 'Completed' ? 'finished' : 'open',
        top: {
          id: m.player1_id,
          name: m.player1_name || 'TBD',
          score: m.score_player1 !== null ? String(m.score_player1) : null,
          isWinner: m.winner_id !== null && m.winner_id === m.player1_id,
        },
        bottom: {
          id: m.player2_id,
          name: m.player2_name || 'BYE',
          score: m.score_player2 !== null ? String(m.score_player2) : null,
          isWinner: m.winner_id !== null && m.winner_id === m.player2_id,
        },
      })),
    }));
  }, [inspectedTourney]);

  if (loading) {
    return (
      <Center mih="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !club) {
    return (
      <Box className="gts-page-root">
        <AnimatedBackground />
        <AppHeader locale={locale} />
        <Container size="sm" py={80} className="gts-relative-layer">
          <Paper p="xl" radius="md" className="gts-panel-header">
            <Title order={3} className="brand-logo" mb="xs">
              CLUB / STORE NICHT GEFUNDEN
            </Title>
            <Text size="sm" className="gts-text-muted">
              {error}
            </Text>
          </Paper>
        </Container>
      </Box>
    );
  }

  const themePreset = resolveThemePreset(club.theme_config?.preset);
  const isOutpost = Boolean(club.is_outpost || club.tier === 'tier_1');
  const isRestricted = Boolean(club.restricted_view);
  const membershipStatus = club.membership_status; // null | 'Pending' | 'Approved'

  const groupedGalleries = (() => {
    const map = new Map<string, { src: string; alt: string }[]>();
    const configuredOrder: string[] = Array.isArray(club.theme_config?.galleries)
      ? club.theme_config.galleries
      : [];
    for (const gName of configuredOrder) {
      map.set(gName, []);
    }
    for (const p of club.pictures || []) {
      const gName = p.gallery_name || 'IMPRESSIONEN // GALERIE';
      const list = map.get(gName) || [];
      list.push({ src: p.url, alt: p.title || club.name });
      map.set(gName, list);
    }
    return Array.from(map.entries())
      .map(([name, images]) => ({ name, images }))
      .filter((g) => g.images.length > 0);
  })();

  const tournamentsList = Array.isArray(club.tournaments) ? club.tournaments : [];
  const filteredTournaments = tournamentsList.filter(
    (t: any) => (t.category || 'tabletop').toLowerCase() === activeTourneyCategory
  );

  // Compute animated TacticalTableProps for either "Live Now" or the selected Date & Time window
  const tacticalTables: TacticalTableProps[] = (() => {
    const rawTables: any[] = Array.isArray(club.tables) ? club.tables : [];
    const bookings: any[] = Array.isArray(club.table_bookings) ? club.table_bookings : [];

    const checkStart =
      tableTimeMode === 'schedule' && resDate && resStartTime
        ? new Date(`${resDate}T${resStartTime}:00`)
        : new Date();
    const checkEnd =
      tableTimeMode === 'schedule'
        ? new Date(checkStart.getTime() + (resDurationHours || 3) * 3600 * 1000)
        : checkStart;

    return rawTables.map((t) => {
      let isOccupied = false;
      let occupiedUntil: string | null = null;

      if (tableTimeMode === 'live') {
        isOccupied = t.status === 'occupied';
        occupiedUntil = t.occupied_until || null;
      } else {
        // Check overlapping bookings
        for (const b of bookings) {
          if (b.table_id === t.id) {
            const bStart = new Date(b.start_time);
            const bEnd = new Date(b.end_time);
            if (checkStart < bEnd && checkEnd > bStart) {
              isOccupied = true;
              occupiedUntil = b.end_time;
              break;
            }
          }
        }
        // Check store blockers on that specific date
        if (!isOccupied && Array.isArray(t.blockers)) {
          for (const blk of t.blockers) {
            if (blk.specific_date === resDate && blk.is_blocked) {
              if (!blk.open_time || !blk.close_time) {
                isOccupied = true;
                break;
              }
              const blkStart = new Date(`${resDate}T${blk.open_time}:00`);
              const blkEnd = new Date(`${resDate}T${blk.close_time}:00`);
              if (checkStart < blkEnd && checkEnd > blkStart) {
                isOccupied = true;
                occupiedUntil = `${resDate}T${blk.close_time}:00`;
                break;
              }
            }
          }
        }
      }

      const category = t.supports_tabletop ? 'wargaming' : 'card_board';
      const isSelected = resTableId === t.id;
      return {
        id: t.id,
        name: t.name,
        category,
        status: isOccupied ? 'occupied' : 'free',
        occupiedUntil,
        dimensionsLabel:
          t.dimensions ||
          (category === 'wargaming'
            ? `60" × 44" • Max ${t.max_players || 2}P`
            : `TCG / RPG Pod • Max ${t.max_players || 4}P`),
        isSelected,
      };
    });
  })();

  return (
    <Box className="gts-page-root" data-gts-theme={themePreset}>
      <AnimatedBackground />
      <AppHeader locale={locale} />

      <Container size="xl" pt={{ base: 32, md: 48 }} className="gts-relative-layer">
        {/* =========================================================
            HERO HEADER (WITH SIDE LOGO FOR CITADEL+ & JOIN / ASSOCIATE BUTTON)
           ========================================================= */}
        <Paper p={{ base: 'lg', md: 'xl' }} radius="md" mb="xl" className="gts-store-hero">
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Group gap="lg" wrap="nowrap" className="gts-store-hero-identity">
              {/* Citadel+ Side Logo */}
              {club.logo_url ? (
                <Avatar
                  src={club.logo_url}
                  alt={club.name}
                  size={88}
                  radius="md"
                  className="gts-logo-frame"
                />
              ) : (
                <Avatar size={72} radius="md" className="gts-logo-fallback gts-store-logo">
                  <IconBuildingStore size={34} />
                </Avatar>
              )}

              <Stack gap={6} className="gts-grow">
                <Group gap="xs">
                  {club.is_private && (
                    <Badge
                      variant="outline"
                      className="gts-status-badge"
                      data-tone="muted"
                      leftSection={<IconLock size={12} />}
                    >
                      PRIVAT
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="gts-game-meta-tag"
                    leftSection={<IconUsers size={12} />}
                  >
                    {club.members_count || 1} Mitglieder
                  </Badge>
                </Group>

                <Title order={1} className="brand-logo gts-army-title">
                  {club.name.toUpperCase()}
                </Title>

                {club.description && (
                  <Text size="sm" className="gts-text-secondary" maw={760}>
                    {club.description}
                  </Text>
                )}
              </Stack>
            </Group>

            {/* Join / Associate CTA */}
            <Stack gap="xs" align="flex-end">
              {membershipStatus === 'Approved' ? (
                <Group gap="xs">
                  <Badge
                    size="lg"
                    variant="outline"
                    className="gts-status-badge"
                    data-tone="success"
                    leftSection={<IconUserCheck size={16} />}
                  >
                    {isOutpost ? 'Mitglied' : 'Verbundener Store'}
                  </Badge>
                  {!club.is_owner_or_staff && (
                    <Button
                      size="xs"
                      variant="default"
                      className="gts-btn-danger"
                      loading={joining}
                      onClick={handleLeaveClub}
                    >
                      Verlassen
                    </Button>
                  )}
                </Group>
              ) : membershipStatus === 'Pending' ? (
                <Badge size="lg" variant="outline" className="gts-status-badge" data-tone="warning">
                  Beitrittsanfrage wartet auf Freigabe
                </Badge>
              ) : (
                <Button
                  size="md"
                  variant="default"
                  loading={joining}
                  leftSection={<IconUserPlus size={18} />}
                  className="brand-logo gts-btn-primary"
                  onClick={handleJoinOrAssociate}
                >
                  {isOutpost ? 'Beitritt anfragen' : 'Mit Store verbinden'}
                </Button>
              )}
            </Stack>
          </Group>
        </Paper>

        {actionMsg && (
          <Alert
            className="gts-alert"
            data-tone="success"
            mb="lg"
            icon={<IconCheck size={18} />}
            withCloseButton
            onClose={() => setActionMsg(null)}
          >
            {actionMsg}
          </Alert>
        )}

        {/* =========================================================
            RESTRICTED VIEW (OUTPOST NON-MEMBERS OR PRIVATE PAGES)
           ========================================================= */}
        {isRestricted ? (
          <Paper p="xl" radius="md" className="gts-restricted-panel">
            <Stack align="center" gap="sm" py="lg">
              <IconLock size={36} className="gts-restricted-icon" />
              <Title order={3} className="gts-section-heading-lg">
                {club.restriction_reason === 'private'
                  ? 'DIESE SEITE IST PRIVAT'
                  : 'INTERNER VEREINSBEREICH'}
              </Title>
              <Text size="sm" className="gts-text-muted" maw={520}>
                {club.restriction_reason === 'private'
                  ? 'Termine, Turniere und Standortdaten sind nur für freigeschaltete Mitglieder sichtbar.'
                  : 'Events und Turniere dieses Clubs sind nur für bestätigte Vereinsmitglieder sichtbar. Sende eine Beitrittsanfrage oben rechts.'}
              </Text>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="xl" w="100%">
            {/* 0. LOCATION, CONTACT & GLOBAL OPENING HOURS ROW (Full width 2-col row) */}
            {!isOutpost && (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Paper p="lg" radius="md" className="gts-panel-card">
                  <Stack gap="sm">
                    <Text className="gts-section-heading">STANDORT & KONTAKT</Text>

                    {club.address &&
                      (club.address.street || club.address.city || club.address.postal_code) && (
                        <Group gap="xs" align="flex-start" wrap="nowrap">
                          <IconMapPin size={16} className="gts-section-icon gts-store-icon-offset" />
                          <Box>
                            {club.address.street && (
                              <Text size="xs" className="gts-text-heading">
                                {club.address.street}
                              </Text>
                            )}
                            <Text size="xs" className="gts-text-muted">
                              {club.address.postal_code} {club.address.city}{' '}
                              {club.address.country ? `(${club.address.country})` : ''}
                            </Text>
                          </Box>
                        </Group>
                      )}

                    {club.contact?.email && (
                      <Group gap="xs">
                        <IconMail size={16} className="gts-section-icon" />
                        <Text
                          size="xs"
                          component="a"
                          href={`mailto:${club.contact.email}`}
                          className="gts-link"
                        >
                          {club.contact.email}
                        </Text>
                      </Group>
                    )}

                    {club.contact?.phone && (
                      <Group gap="xs">
                        <IconPhone size={16} className="gts-section-icon" />
                        <Text size="xs" className="gts-text-secondary">
                          {club.contact.phone}
                        </Text>
                      </Group>
                    )}

                    {club.contact?.website_url && (
                      <Group gap="xs">
                        <IconWorld size={16} className="gts-section-icon" />
                        <Text
                          size="xs"
                          component="a"
                          href={club.contact.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gts-link"
                        >
                          Website öffnen
                        </Text>
                      </Group>
                    )}

                    <Group gap="xs" mt={4}>
                      {club.contact?.online_store_url && (
                        <Button
                          component="a"
                          href={club.contact.online_store_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="default"
                          className="gts-btn-secondary"
                          size="xs"
                          leftSection={<IconShoppingBag size={14} />}
                        >
                          Zum Online-Shop
                        </Button>
                      )}

                      {club.discord?.invite_url && (
                        <Button
                          component="a"
                          href={club.discord.invite_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="default"
                          className="gts-btn-discord"
                          size="xs"
                          leftSection={<IconBrandDiscord size={15} />}
                        >
                          Discord beitreten
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Paper>

                {club.opening_hours && (
                  <Paper p="lg" radius="md" className="gts-panel-card">
                    <Group gap="xs" mb="sm">
                      <IconClock size={16} className="gts-section-icon" />
                      <Text className="gts-section-heading">ÖFFNUNGSZEITEN</Text>
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                      {(['0', '1', '2', '3', '4', '5', '6'] as const).map((dKey) => {
                        const cfg = club.opening_hours[dKey];
                        if (!cfg) return null;
                        return (
                          <Group key={dKey} justify="space-between" className="gts-store-hours-row">
                            <Text size="xs" fw={600} className="gts-text-secondary">
                              {WEEKDAY_NAMES[dKey]}
                            </Text>
                            <Text
                              size="xs"
                              className={cfg.is_open ? 'gts-text-body' : 'gts-text-muted'}
                            >
                              {cfg.is_open ? `${cfg.open} – ${cfg.close}` : 'Geschlossen'}
                            </Text>
                          </Group>
                        );
                      })}
                    </SimpleGrid>
                  </Paper>
                )}
              </SimpleGrid>
            )}

            {/* 1. GALLERIES (Rendered via GalleryShowcase from @gts/ui if pictures exist) */}
            {groupedGalleries.map((gal) => (
              <GalleryShowcase
                key={gal.name}
                images={gal.images}
                title={gal.name}
                height={420}
              />
            ))}

            {/* 1.5. TACTICAL TABLES & RESERVATION REQUESTS (TacticalTableGrid from @gts/ui) */}
            {tacticalTables.length > 0 && (
              <Paper p="lg" radius="md" className="gts-panel-card">
                <Stack gap="md">
                  <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                    <Group gap="xs">
                      <IconLayoutGrid size={20} className="gts-section-icon" />
                      <Title order={3} className="brand-logo gts-army-title">
                        SPIELTISCHE & RESERVIERUNG ({tacticalTables.length})
                      </Title>
                    </Group>

                    <SegmentedControl
                      size="xs"
                      className="gts-segmented"
                      value={tableTimeMode}
                      onChange={(v) => setTableTimeMode(v as 'live' | 'schedule')}
                      data={[
                        { label: 'Live-Status (Jetzt)', value: 'live' },
                        { label: 'Zeitpunkt prüfen & reservieren', value: 'schedule' },
                      ]}
                    />
                  </Group>

                  {tableTimeMode === 'schedule' && (
                    <Paper
                      component="form"
                      onSubmit={handleRequestTableReservation}
                      p="md"
                      radius="md"
                      className="gts-reservation-panel gts-form"
                    >
                      <Stack gap="sm">
                        <SimpleGrid
                          cols={{ base: 1, sm: 4 }}
                          spacing="sm"
                          className="gts-align-end"
                        >
                          <TextInput
                            label="Datum"
                            type="date"
                            size="xs"
                            value={resDate}
                            onChange={(e) => setResDate(e.currentTarget.value)}
                          />
                          <TextInput
                            label="Startzeit"
                            type="time"
                            size="xs"
                            value={resStartTime}
                            onChange={(e) => setResStartTime(e.currentTarget.value)}
                          />
                          <NumberInput
                            label="Dauer (Std.)"
                            size="xs"
                            min={1}
                            max={10}
                            value={resDurationHours}
                            onChange={(v) => setResDurationHours(Number(v) || 3)}
                          />
                          <TextInput
                            label="Spielsystem"
                            size="xs"
                            placeholder="Warhammer 40k / MTG"
                            value={resSystem}
                            onChange={(e) => setResSystem(e.currentTarget.value)}
                          />
                        </SimpleGrid>

                        <SimpleGrid
                          cols={{ base: 1, sm: 3 }}
                          spacing="sm"
                          className="gts-align-end"
                        >
                          <Select
                            label="Tisch auswählen"
                            size="xs"
                            placeholder="Freien Tisch wählen (oder Karte anklicken)"
                            value={resTableId}
                            onChange={setResTableId}
                            data={tacticalTables.map((t) => ({
                              value: t.id,
                              label: `${t.name} (${
                                t.status === 'occupied' ? 'Belegt' : 'Frei'
                              })`,
                              disabled: t.status === 'occupied',
                            }))}
                          />
                          <TextInput
                            label="Notiz (optional)"
                            size="xs"
                            placeholder="z.B. 2000 Pkt. Match"
                            value={resNote}
                            onChange={(e) => setResNote(e.currentTarget.value)}
                          />
                          <Button
                            type="submit"
                            size="xs"
                            variant="default"
                            className="gts-btn-primary"
                            disabled={!resTableId}
                            loading={resSubmitting}
                          >
                            Tisch-Reservierung anfragen
                          </Button>
                        </SimpleGrid>
                      </Stack>
                    </Paper>
                  )}

                  <TacticalTableGrid
                    tables={tacticalTables}
                    onSelectTable={(tableId) => {
                      setTableTimeMode('schedule');
                      const clicked = tacticalTables.find((t) => t.id === tableId);
                      if (clicked && clicked.status === 'free') {
                        setResTableId(tableId);
                      }
                    }}
                  />
                </Stack>
              </Paper>
            )}

            {/* 2. UPCOMING EVENTS */}
            <Paper p="lg" radius="md" className="gts-panel-card">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconCalendarEvent size={20} className="gts-section-icon" />
                  <Title order={3} className="brand-logo gts-army-title">
                    ANSTEHENDE EVENTS ({club.events?.length || 0})
                  </Title>
                </Group>
              </Group>

              {(club.events || []).length === 0 ? (
                <Text size="xs" className="gts-empty-state">
                  Aktuell keine öffentlichen Events geplant.
                </Text>
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {club.events.map((ev: any) => (
                    <Paper key={ev.id} p="md" radius="md" className="gts-store-event-card">
                      <Stack justify="space-between" h="100%" gap="sm">
                        <div>
                          <Badge
                            size="xs"
                            variant="outline"
                            className="gts-status-badge"
                            data-tone="accent"
                            mb={4}
                          >
                            {new Date(ev.start_time).toLocaleString('de-DE', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </Badge>
                          <Text fw={700} size="sm" className="gts-text-heading">
                            {ev.title}
                          </Text>
                          {ev.description && (
                            <Text size="xs" className="gts-text-muted" mt={4}>
                              {ev.description}
                            </Text>
                          )}
                        </div>

                        <Group justify="space-between" align="center">
                          <Text size="xs" className="gts-text-muted">
                            {ev.attendees_count} Teilnehmer
                          </Text>
                          <Button
                            size="xs"
                            variant="default"
                            className={ev.is_attending ? 'gts-btn-ghost' : 'gts-btn-primary'}
                            onClick={() => handleToggleEventAttendance(ev.id)}
                          >
                            {ev.is_attending ? 'Abmelden' : 'Teilnehmen'}
                          </Button>
                        </Group>
                      </Stack>
                    </Paper>
                  ))}
                </SimpleGrid>
              )}
            </Paper>

            {/* 3. TOURNAMENTS (FULL WIDTH WITH EMBEDDED BRACKET / SWISS ANIMATIONS) */}
            <Paper p="lg" radius="md" className="gts-panel-card">
              <Group justify="space-between" mb="md" wrap="wrap">
                <Group gap="xs">
                  <IconTrophy size={20} className="gts-section-icon" />
                  <Title order={3} className="brand-logo gts-army-title">
                    TURNIERE ({tournamentsList.length})
                  </Title>
                </Group>

                <Tabs
                  value={activeTourneyCategory}
                  onChange={(v) =>
                    setActiveTourneyCategory((v as 'tabletop' | 'tcg') || 'tabletop')
                  }
                  variant="pills"
                  className="gts-pill-tabs"
                  radius="md"
                >
                  <Tabs.List>
                    <Tabs.Tab value="tabletop" leftSection={<IconSwords size={14} />}>
                      Tabletop
                    </Tabs.Tab>
                    <Tabs.Tab value="tcg" leftSection={<IconCards size={14} />}>
                      TCG
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              </Group>

              {filteredTournaments.length === 0 ? (
                <Text size="xs" className="gts-empty-state">
                  Keine {activeTourneyCategory === 'tcg' ? 'TCG' : 'Tabletop'}-Turniere
                  ausgeschrieben.
                </Text>
              ) : (
                <Stack gap="lg">
                  {filteredTournaments.map((t: any) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      isAuthenticated={Boolean(token)}
                      onRegisterClick={() => handleRegisterTournament(t.id)}
                      onViewDetails={() => setInspectedTourney(t)}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}
      </Container>

      {/* ANIMATED TOURNAMENT BRACKET / SWISS MODAL */}
      <Modal
        opened={Boolean(inspectedTourney)}
        onClose={() => setInspectedTourney(null)}
        size="xl"
        data-gts-theme={themePreset}
        title={
          <Group gap="xs">
            <Text fw={700} className="brand-logo">
              {inspectedTourney?.name?.toUpperCase()}
            </Text>
            <Badge size="xs" variant="outline" className="gts-status-badge">
              {inspectedTourney?.pairing_system === 'ko' ? 'KO BRACKET' : 'SWISS'}
            </Badge>
          </Group>
        }
        classNames={{
          content: 'gts-modal-content',
          header: 'gts-modal-header',
          title: 'gts-modal-title',
        }}
      >
        {inspectedTourney && (
          <Stack gap="lg">
            {inspectedTourney.pairing_system === 'ko' ? (
              inspectedBracketRounds.length > 0 ? (
                <TournamentBracketGraphic rounds={inspectedBracketRounds} />
              ) : (
                <Text size="xs" className="gts-empty-state">
                  Die Paarungen für dieses KO-Turnier wurden noch nicht ausgelost.
                </Text>
              )
            ) : inspectedSwissRounds.length > 0 ? (
              <SwissTournamentGraphic rounds={inspectedSwissRounds} />
            ) : (
              <Text size="xs" className="gts-empty-state">
                Runde 1 wurde noch nicht gestartet.
              </Text>
            )}

            {(inspectedTourney.standings || []).length > 0 && (
              <>
                <Divider label="Tabelle" labelPosition="left" className="gts-divider" />
                <TournamentStandingsTable standings={inspectedTourney.standings} />
              </>
            )}
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
