'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  FileButton,
  Grid,
  Group,
  Image as MantineImage,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBrandDiscord,
  IconBuildingStore,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconDeviceFloppy,
  IconExternalLink,
  IconEye,
  IconLock,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPhoto,
  IconPlus,
  IconSwords,
  IconTrash,
  IconTrophy,
  IconUpload,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
  IconWorld,
  IconLayoutGrid,
} from '@tabler/icons-react';
import {
  GalleryShowcase,
  TacticalTableGrid,
  TournamentCard,
  TournamentBracketGraphic,
  SwissTournamentGraphic,
  type TacticalTableProps,
  type BracketRound,
  type SwissRound,
} from '@gts/ui';
import {
  useClubManagement,
  getClubAuthHeaders,
  type OpeningHoursMap,
} from '../../../../context/ClubManagementContext';

const DEFAULT_GALLERY_NAME = 'IMPRESSIONEN // GALERIE';

const WEEKDAY_ROWS = [
  { key: '0', label: 'Montag' },
  { key: '1', label: 'Dienstag' },
  { key: '2', label: 'Mittwoch' },
  { key: '3', label: 'Donnerstag' },
  { key: '4', label: 'Freitag' },
  { key: '5', label: 'Samstag' },
  { key: '6', label: 'Sonntag' },
];

type ThemePresetKey = 'gts' | 'ember' | 'gold' | 'crimson' | 'emerald' | 'violet' | 'steel';

const THEME_PRESETS: { key: ThemePresetKey; label: string }[] = [
  { key: 'gts', label: 'GTS Blau' },
  { key: 'ember', label: 'Ember' },
  { key: 'gold', label: 'Gold' },
  { key: 'crimson', label: 'Crimson' },
  { key: 'emerald', label: 'Emerald' },
  { key: 'violet', label: 'Violet' },
  { key: 'steel', label: 'Steel' },
];

const isThemePresetKey = (value: unknown): value is ThemePresetKey =>
  THEME_PRESETS.some((p) => p.key === value);

const DEFAULT_OPENING_HOURS: OpeningHoursMap = {
  '0': { is_open: true, open: '14:00', close: '22:00' },
  '1': { is_open: true, open: '14:00', close: '22:00' },
  '2': { is_open: true, open: '14:00', close: '22:00' },
  '3': { is_open: true, open: '14:00', close: '22:00' },
  '4': { is_open: true, open: '14:00', close: '23:00' },
  '5': { is_open: true, open: '10:00', close: '22:00' },
  '6': { is_open: false, open: '12:00', close: '18:00' },
};

export default function ClubPublicPageSetup() {
  const params = useParams();
  const locale = (params?.locale as string) || 'de';

  const { selectedClubId, clubDetail, isOwner, isKeymaster, refreshClubData } =
    useClubManagement();

  // Editor / Preview Layout Mode
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  // Preview Perspective: 'outsider' (Non-Member / Visitor) vs 'member' (Approved Member / Connected Player)
  const [previewAs, setPreviewAs] = useState<'outsider' | 'member'>('outsider');

  // Form Draft State (feeds live into the preview)
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostal, setEditPostal] = useState('');
  const [editCountry, setEditCountry] = useState('DE');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editStoreUrl, setEditStoreUrl] = useState('');
  const [editDiscordInvite, setEditDiscordInvite] = useState('');
  const [themePreset, setThemePreset] = useState<ThemePresetKey>('gts');
  const [openingHours, setOpeningHours] = useState<OpeningHoursMap>(DEFAULT_OPENING_HOURS);

  // Gallery Builder State
  const [customGalleries, setCustomGalleries] = useState<string[]>([DEFAULT_GALLERY_NAME]);
  const [selectedGallery, setSelectedGallery] = useState<string>(DEFAULT_GALLERY_NAME);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [picTitle, setPicTitle] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Live content from public endpoint (pictures, events, tournaments) for realistic preview
  const [publicPayload, setPublicPayload] = useState<any | null>(null);
  const [previewTourneyTab, setPreviewTourneyTab] = useState<string>('tabletop');
  const [inspectedTourney, setInspectedTourney] = useState<any | null>(null);

  useEffect(() => {
    if (!clubDetail) return;
    setEditName(clubDetail.name || '');
    setEditDesc(clubDetail.description || '');
    setEditIsPrivate(Boolean(clubDetail.is_private));
    setLogoPreviewUrl(clubDetail.logo_url || null);
    setEditStreet(clubDetail.address?.street || '');
    setEditCity(clubDetail.address?.city || '');
    setEditPostal(clubDetail.address?.postal_code || '');
    setEditCountry(clubDetail.address?.country || 'DE');
    setEditEmail(clubDetail.contact?.email || '');
    setEditPhone(clubDetail.contact?.phone || '');
    setEditWebsite(clubDetail.contact?.website_url || '');
    setEditStoreUrl(clubDetail.contact?.online_store_url || '');
    setEditDiscordInvite(clubDetail.discord?.invite_url || '');
    const savedPreset = clubDetail.theme_config?.preset;
    setThemePreset(isThemePresetKey(savedPreset) ? savedPreset : 'gts');
    const savedGalleries = (clubDetail.theme_config as any)?.galleries;
    if (Array.isArray(savedGalleries) && savedGalleries.length > 0) {
      setCustomGalleries(savedGalleries);
      setSelectedGallery(savedGalleries[0]);
    }
    setOpeningHours(
      clubDetail.opening_hours && Object.keys(clubDetail.opening_hours).length > 0
        ? clubDetail.opening_hours
        : DEFAULT_OPENING_HOURS
    );
  }, [clubDetail]);

  const loadPublicPreviewData = useCallback(async () => {
    if (!clubDetail?.slug) return;
    try {
      const res = await fetch(`/api/clubs/${clubDetail.slug}/public`, {
        headers: getClubAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPublicPayload(data);
        const picGalleries = Array.from(
          new Set<string>(
            (data.pictures || []).map(
              (p: any) => p.gallery_name || DEFAULT_GALLERY_NAME
            )
          )
        );
        if (picGalleries.length > 0) {
          setCustomGalleries((prev) => Array.from(new Set([...prev, ...picGalleries])));
        }
      }
    } catch {
      // ignore preview fetch errors
    }
  }, [clubDetail?.slug]);

  useEffect(() => {
    loadPublicPreviewData();
  }, [loadPublicPreviewData]);

  const groupedGalleries = useMemo(() => {
    const pics: any[] = publicPayload?.pictures || [];
    const map = new Map<string, { id: string; src: string; alt: string }[]>();
    for (const gName of customGalleries) {
      map.set(gName, []);
    }
    for (const p of pics) {
      const gName = p.gallery_name || DEFAULT_GALLERY_NAME;
      const list = map.get(gName) || [];
      list.push({
        id: p.id,
        src: p.url,
        alt: p.title || editName || 'Store Bild',
      });
      map.set(gName, list);
    }
    return Array.from(map.entries()).map(([name, images]) => ({ name, images }));
  }, [publicPayload?.pictures, customGalleries, editName]);

  if (!clubDetail) {
    return (
      <Paper p="xl" radius="md" className="gts-panel-card">
        <Text size="sm" className="gts-text-muted">
          Bitte zuerst in der Übersicht einen Club oder Store auswählen.
        </Text>
      </Paper>
    );
  }

  const isOutpost = clubDetail.tier === 'tier_1';
  const isCitadelOrAbove =
    clubDetail.tier === 'tier_3' ||
    clubDetail.tier === 'tier_4' ||
    Boolean(clubDetail.tier_limits?.can_edit_logo_and_description);
  const canCustomTheme = Boolean(clubDetail.tier_limits?.custom_theme) || isCitadelOrAbove;
  const canEditDescription = isCitadelOrAbove || isOutpost;
  const maxGalleries = Number(
    clubDetail.tier_limits?.max_galleries ?? (isCitadelOrAbove ? 10 : 1)
  );

  const handleAddGallery = () => {
    const clean = newGalleryInput.trim();
    if (!clean) return;
    if (customGalleries.includes(clean)) {
      setSelectedGallery(clean);
      setNewGalleryInput('');
      return;
    }
    if (customGalleries.length >= maxGalleries) {
      setStatusBanner({
        type: 'error',
        msg: `Dein Tier erlaubt maximal ${maxGalleries} Galerie(n). Mehrere Galerien sind ab Citadel verfügbar.`,
      });
      return;
    }
    const next = [...customGalleries, clean];
    setCustomGalleries(next);
    setSelectedGallery(clean);
    setNewGalleryInput('');
  };

  const handleUploadGalleryPicture = async (file: File | null) => {
    if (!file || !selectedClubId) return;
    setUploadingPic(true);
    setStatusBanner(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('gallery_name', selectedGallery || DEFAULT_GALLERY_NAME);
      if (picTitle.trim()) {
        fd.append('title', picTitle.trim());
      }
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') ||
            localStorage.getItem('access_token') ||
            localStorage.getItem('gts_token')
          : null;
      const res = await fetch(`/api/clubs/${selectedClubId}/pictures`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({ type: 'error', msg: data.msg || 'Upload fehlgeschlagen.' });
      } else {
        setPicTitle('');
        setStatusBanner({ type: 'success', msg: 'Bild zur Galerie hinzugefügt!' });
        await loadPublicPreviewData();
      }
    } finally {
      setUploadingPic(false);
    }
  };

  const handleDeleteGalleryPicture = async (picId: string) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/pictures/${picId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      await loadPublicPreviewData();
    }
  };

  const handleSavePageSetup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedClubId) return;
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/clubs/${selectedClubId}`, {
        method: 'PUT',
        headers: getClubAuthHeaders(),
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          is_private: editIsPrivate,
          address_street: editStreet,
          address_city: editCity,
          address_postal_code: editPostal,
          address_country: editCountry,
          contact_email: editEmail,
          contact_phone: editPhone,
          website_url: editWebsite,
          online_store_url: editStoreUrl,
          discord_invite_url: editDiscordInvite,
          opening_hours: openingHours,
          theme_config: {
            preset: canCustomTheme ? themePreset : undefined,
            galleries: customGalleries,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Speichern.' });
      } else {
        setStatusBanner({ type: 'success', msg: 'Store-/Club-Seite gespeichert!' });
        await refreshClubData();
        await loadPublicPreviewData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (file: File | null) => {
    if (!file || !selectedClubId) return;
    setUploadingLogo(true);
    setStatusBanner(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('access_token')
          : null;
      const res = await fetch(`/api/clubs/${selectedClubId}/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({ type: 'error', msg: data.msg || 'Logo-Upload fehlgeschlagen.' });
      } else {
        setLogoPreviewUrl(data.logo_url);
        setStatusBanner({ type: 'success', msg: data.msg });
        await refreshClubData();
        await loadPublicPreviewData();
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  // Compute simulated restriction state for the Live Preview based on `previewAs`, `isOutpost`, and `editIsPrivate`
  const isSimulatedRestricted =
    previewAs === 'outsider' && (editIsPrivate || isOutpost);
  const simulatedRestrictionReason = editIsPrivate ? 'private' : 'outpost_members_only';

  const nonEmptyGalleries = groupedGalleries.filter((g) => g.images.length > 0);
  const previewEvents = publicPayload?.events || [];
  const previewTournaments = (publicPayload?.tournaments || []).filter(
    (t: any) => (t.category || 'tabletop').toLowerCase() === previewTourneyTab
  );

  const previewTacticalTables: TacticalTableProps[] = (
    publicPayload?.tables ||
    clubDetail?.tables ||
    []
  )
    .filter((t: any) => t.is_active !== false)
    .map((t: any) => {
      const category = t.supports_tabletop ? 'wargaming' : 'card_board';
      return {
        id: t.id,
        name: t.name,
        category,
        status: t.status === 'occupied' ? 'occupied' : 'free',
        occupiedUntil: t.occupied_until || null,
        dimensionsLabel:
          t.dimensions ||
          (category === 'wargaming'
            ? `60" × 44" • Max ${t.max_players || 2}P`
            : `TCG / RPG Pod • Max ${t.max_players || 4}P`),
      };
    });

  // Build Swiss / KO rounds for inspected tournament in preview
  const buildRounds = (tourney: any): { swiss: SwissRound[]; ko: BracketRound[] } => {
    if (!tourney) return { swiss: [], ko: [] };
    const byRound = new Map<number, any[]>();
    for (const m of tourney.matches || []) {
      const list = byRound.get(m.round_number) || [];
      list.push(m);
      byRound.set(m.round_number, list);
    }
    const entries = Array.from(byRound.entries());
    return {
      swiss: entries.map(([rNum, rMatches]) => ({
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
      })),
      ko: entries.map(([rNum, rMatches]) => ({
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
      })),
    };
  };

  const renderLivePreview = () => {
    const activeRounds = buildRounds(inspectedTourney);

    return (
      <Stack gap="md">
        {/* Preview Toolbar */}
        <Paper p="sm" radius="md" className="gts-preview-toolbar">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="xs">
              <IconEye size={18} className="gts-section-icon" />
              <Text size="xs" className="gts-section-heading">
                LIVE-VORSCHAU
              </Text>
              <Badge
                size="xs"
                variant="outline"
                className="gts-status-badge"
                data-tone={isCitadelOrAbove ? 'accent' : 'muted'}
              >
                {isCitadelOrAbove
                  ? `${clubDetail.slug}.gametablesync.com`
                  : `gametablesync.com/${locale}/s/${clubDetail.slug}`}
              </Badge>
            </Group>

            <SegmentedControl
              size="xs"
              className="gts-segmented"
              value={previewAs}
              onChange={(val) => setPreviewAs(val as 'outsider' | 'member')}
              data={[
                { label: 'Ansicht: Gast / Nicht-Mitglied', value: 'outsider' },
                { label: 'Ansicht: Mitglied / Verbunden', value: 'member' },
              ]}
            />
          </Group>
        </Paper>

        {/* Simulated Public Page Canvas */}
        <Paper
          p={{ base: 'md', md: 'lg' }}
          radius="md"
          className="gts-preview-canvas"
          data-gts-theme={themePreset}
        >
          {/* HERO HEADER */}
          <Paper p="lg" radius="md" mb="lg" className="gts-store-hero">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Group gap="md" wrap="nowrap" className="gts-store-hero-identity">
                {isCitadelOrAbove && logoPreviewUrl ? (
                  <Avatar
                    src={logoPreviewUrl}
                    alt={editName}
                    size={76}
                    radius="md"
                    className="gts-logo-frame"
                  />
                ) : (
                  <Avatar size={64} radius="md" className="gts-logo-fallback gts-store-logo">
                    <IconBuildingStore size={30} />
                  </Avatar>
                )}

                <Stack gap={4} className="gts-grow">
                  <Group gap={6}>
                    {editIsPrivate && (
                      <Badge
                        size="xs"
                        variant="outline"
                        className="gts-status-badge"
                        data-tone="muted"
                        leftSection={<IconLock size={10} />}
                      >
                        PRIVAT
                      </Badge>
                    )}
                    <Badge
                      size="xs"
                      variant="outline"
                      className="gts-game-meta-tag"
                      leftSection={<IconUsers size={10} />}
                    >
                      {publicPayload?.members_count || 1} Mitglieder
                    </Badge>
                  </Group>

                  <Title order={2} className="brand-logo gts-army-title">
                    {(editName || clubDetail.name).toUpperCase()}
                  </Title>

                  {canEditDescription && editDesc && (
                    <Text size="xs" className="gts-text-secondary" maw={680}>
                      {editDesc}
                    </Text>
                  )}
                </Stack>
              </Group>

              {/* Simulated CTA Button */}
              {previewAs === 'member' ? (
                <Badge
                  size="lg"
                  variant="outline"
                  className="gts-status-badge"
                  data-tone="success"
                  leftSection={<IconUserCheck size={14} />}
                >
                  {isOutpost ? 'Mitglied' : 'Verbundener Store'}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  leftSection={<IconUserPlus size={16} />}
                  className="brand-logo gts-btn-primary"
                >
                  {isOutpost || editIsPrivate ? 'Beitritt anfragen' : 'Mit Store verbinden'}
                </Button>
              )}
            </Group>
          </Paper>

          {/* RESTRICTED VIEW (OUTPOST NON-MEMBER OR PRIVATE PAGE) */}
          {isSimulatedRestricted ? (
            <Paper p="xl" radius="md" className="gts-restricted-panel">
              <Stack align="center" gap="xs" py="md">
                <IconLock size={32} className="gts-restricted-icon" />
                <Title order={4} className="gts-section-heading-lg">
                  {simulatedRestrictionReason === 'private'
                    ? 'DIESE SEITE IST PRIVAT'
                    : 'INTERNER VEREINSBEREICH'}
                </Title>
                <Text size="xs" className="gts-text-muted" maw={460}>
                  {simulatedRestrictionReason === 'private'
                    ? 'Termine, Turniere und Standortdaten sind nur für freigeschaltete Mitglieder sichtbar.'
                    : 'Für Außenstehende werden bei Outpost-Clubs keine Adresse, keine Events und keine Turniere angezeigt. Erst nach Freigabe der Beitrittsanfrage durch Admin oder Keymaster wird der Bereich sichtbar.'}
                </Text>
              </Stack>
            </Paper>
          ) : (
            <Stack gap="md" w="100%">
              {/* LOCATION, CONTACT & OPENING HOURS ROW */}
              {!isOutpost && (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <Paper p="md" radius="md" className="gts-panel-card">
                    <Group gap="xs" mb="xs">
                      <IconMapPin size={16} className="gts-section-icon" />
                      <Text size="xs" className="gts-section-heading">
                        STANDORT & KONTAKT
                      </Text>
                    </Group>

                    <Stack gap={6}>
                      {(editStreet || editCity) && (
                        <Box>
                          {editStreet && (
                            <Text size="xs" className="gts-text-heading" fw={600}>
                              {editStreet}
                            </Text>
                          )}
                          <Text size="xs" className="gts-text-muted">
                            {editPostal} {editCity} ({editCountry})
                          </Text>
                        </Box>
                      )}

                      {editEmail && (
                        <Group gap="xs">
                          <IconMail size={14} className="gts-text-muted" />
                          <Text size="xs" className="gts-text-secondary">
                            {editEmail}
                          </Text>
                        </Group>
                      )}

                      {editPhone && (
                        <Group gap="xs">
                          <IconPhone size={14} className="gts-text-muted" />
                          <Text size="xs" className="gts-text-secondary">
                            {editPhone}
                          </Text>
                        </Group>
                      )}

                      {editWebsite && (
                        <Group gap="xs">
                          <IconWorld size={14} className="gts-text-muted" />
                          <Text size="xs" className="gts-link">
                            Website
                          </Text>
                        </Group>
                      )}

                      {editDiscordInvite && (
                        <Button
                          size="xs"
                          variant="default"
                          className="gts-btn-discord"
                          leftSection={<IconBrandDiscord size={14} />}
                          mt={4}
                        >
                          Discord beitreten
                        </Button>
                      )}
                    </Stack>
                  </Paper>

                  <Paper p="md" radius="md" className="gts-panel-card">
                    <Group gap="xs" mb="xs">
                      <IconClock size={16} className="gts-section-icon" />
                      <Text size="xs" className="gts-section-heading">
                        ÖFFNUNGSZEITEN
                      </Text>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                      {WEEKDAY_ROWS.map((d) => {
                        const cfg = openingHours[d.key];
                        const isOpen = cfg && cfg.is_open !== false;
                        return (
                          <Group key={d.key} justify="space-between" className="gts-store-hours-row">
                            <Text size="xs" className="gts-text-secondary" fw={600}>
                              {d.label}
                            </Text>
                            {isOpen ? (
                              <Text size="xs" className="gts-text-success" fw={700}>
                                {cfg.open} – {cfg.close}
                              </Text>
                            ) : (
                              <Text size="xs" className="gts-text-muted">
                                Geschlossen
                              </Text>
                            )}
                          </Group>
                        );
                      })}
                    </SimpleGrid>
                  </Paper>
                </SimpleGrid>
              )}

              {nonEmptyGalleries.map((gal) => (
                <GalleryShowcase
                  key={gal.name}
                  title={gal.name}
                  images={gal.images}
                  height={280}
                />
              ))}

              {/* TACTICAL TABLES & RESERVATIONS (TacticalTableGrid from @gts/ui) */}
              {previewTacticalTables.length > 0 && (
                <Paper p="md" radius="md" className="gts-panel-card">
                  <Group justify="space-between" mb="sm" wrap="wrap">
                    <Group gap="xs">
                      <IconLayoutGrid size={16} className="gts-section-icon" />
                      <Text size="xs" className="gts-section-heading">
                        SPIELTISCHE & RESERVIERUNG ({previewTacticalTables.length})
                      </Text>
                    </Group>
                    <Badge size="xs" variant="outline" className="gts-status-badge" data-tone="accent">
                      LIVE-STATUS & ZEITFENSTER-BUCHUNG
                    </Badge>
                  </Group>
                  <TacticalTableGrid tables={previewTacticalTables} />
                </Paper>
              )}

              {/* UPCOMING EVENTS */}
              <Paper p="md" radius="md" className="gts-panel-card">
                <Group justify="space-between" mb="sm">
                  <Group gap="xs">
                    <IconCalendarEvent size={16} className="gts-section-icon" />
                    <Text size="xs" className="gts-section-heading">
                      KOMMENDE EVENTS ({previewEvents.length})
                    </Text>
                  </Group>
                </Group>

                {previewEvents.length === 0 ? (
                  <Text size="xs" className="gts-empty-state">
                    Aktuell sind keine kommenden Events eingetragen.
                  </Text>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {previewEvents.map((ev: any) => (
                      <Paper key={ev.id} p="sm" radius="sm" className="gts-store-event-card">
                        <Text fw={700} size="xs" className="gts-text-heading">
                          {ev.title}
                        </Text>
                        <Text size="xs" className="gts-text-accent" fw={600}>
                          {ev.start_time
                            ? new Date(ev.start_time).toLocaleString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'TBA'}
                        </Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                )}
              </Paper>

              {/* TOURNAMENTS WITH EMBEDDED ANIMATIONS */}
              <Paper p="md" radius="md" className="gts-panel-card">
                <Group justify="space-between" align="center" mb="sm" wrap="wrap">
                  <Group gap="xs">
                    <IconTrophy size={16} className="gts-section-icon" />
                    <Text size="xs" className="gts-section-heading">
                      TURNIERE & LIGEN
                    </Text>
                  </Group>

                  <Tabs
                    value={previewTourneyTab}
                    onChange={(v) => {
                      setPreviewTourneyTab(v || 'tabletop');
                      setInspectedTourney(null);
                    }}
                    variant="pills"
                    className="gts-pill-tabs"
                  >
                    <Tabs.List>
                      <Tabs.Tab value="tabletop" leftSection={<IconSwords size={12} />}>
                        Tabletop
                      </Tabs.Tab>
                      <Tabs.Tab value="tcg" leftSection={<IconTrophy size={12} />}>
                        TCG
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs>
                </Group>

                {previewTournaments.length === 0 ? (
                  <Text size="xs" className="gts-empty-state">
                    Keine Turniere in dieser Kategorie ausgeschrieben.
                  </Text>
                ) : (
                  <Stack gap="md">
                    {previewTournaments.map((t: any) => (
                      <TournamentCard
                        key={t.id}
                        tournament={t}
                        isAuthenticated={false}
                      />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          )}
        </Paper>
      </Stack>
    );
  };

  const activeGalleryObj = groupedGalleries.find((g) => g.name === selectedGallery) || {
    name: selectedGallery,
    images: [],
  };

  const renderEditorForm = () => (
    <Paper
      component="form"
      onSubmit={handleSavePageSetup}
      p="lg"
      radius="md"
      className="gts-panel-card gts-form"
    >
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Text size="sm" className="gts-section-heading">
            SEITEN-KONFIGURATION
          </Text>
          <Switch
            size="sm"
            label="Seite auf Privat stellen"
            disabled={!isOwner}
            checked={editIsPrivate}
            onChange={(e) => setEditIsPrivate(e.currentTarget.checked)}
          />
        </Group>

        <Divider label="Logo & Darstellung" labelPosition="left" className="gts-divider" />

        <Group gap="md" align="center" wrap="wrap">
          <Avatar
            src={isCitadelOrAbove ? logoPreviewUrl : null}
            size={60}
            radius="md"
            className={
              isCitadelOrAbove && logoPreviewUrl
                ? 'gts-logo-frame'
                : 'gts-logo-fallback gts-store-logo'
            }
          >
            {(editName || clubDetail.name).slice(0, 2).toUpperCase()}
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
                  disabled={!isOwner}
                  loading={uploadingLogo}
                  leftSection={<IconUpload size={14} />}
                >
                  Store-Logo hochladen
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
              Store-Logo & Subdomain ab Citadel (Tier 3)
            </Badge>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Store- / Club-Name"
            required
            disabled={!isOwner}
            value={editName}
            onChange={(e) => setEditName(e.currentTarget.value)}
          />
          <TextInput label="Slug / Subdomain" value={clubDetail.slug} disabled />
        </SimpleGrid>

        <Textarea
          label={
            canEditDescription
              ? 'Beschreibung'
              : 'Beschreibung (Bearbeitung ab Citadel Tier 3)'
          }
          minRows={3}
          disabled={!isOwner || !canEditDescription}
          value={editDesc}
          onChange={(e) => setEditDesc(e.currentTarget.value)}
        />

        {canCustomTheme && (
          <Stack gap={6}>
            <Text className="gts-eyebrow">Farbschema</Text>
            <Group gap="sm">
              {THEME_PRESETS.map((preset) => {
                const isActive = themePreset === preset.key;
                return (
                  <UnstyledButton
                    key={preset.key}
                    type="button"
                    className="gts-theme-swatch"
                    data-gts-theme={preset.key}
                    data-active={isActive ? 'true' : undefined}
                    data-disabled={!isOwner ? 'true' : undefined}
                    disabled={!isOwner}
                    aria-label={preset.label}
                    aria-pressed={isActive}
                    title={preset.label}
                    onClick={() => setThemePreset(preset.key)}
                  />
                );
              })}
            </Group>
          </Stack>
        )}

        {/* =========================================================
            GALLERY BUILDER (USING GalleryShowcase FROM @gts/ui)
           ========================================================= */}
        <Divider label="Galerien (GalleryShowcase)" labelPosition="left" className="gts-divider" />

        <Stack gap="sm">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
            <Select
              label={`Aktive Galerie (${customGalleries.length}/${maxGalleries})`}
              value={selectedGallery}
              onChange={(val) => val && setSelectedGallery(val)}
              data={customGalleries.map((g) => ({ value: g, label: g }))}
              className="gts-grow-180"
            />

            {maxGalleries > 1 ? (
              <Group gap="xs" align="flex-end">
                <TextInput
                  label="Neue Galerie"
                  placeholder="z.B. Turnier-Impressionen"
                  value={newGalleryInput}
                  onChange={(e) => setNewGalleryInput(e.currentTarget.value)}
                />
                <Button
                  type="button"
                  variant="default"
                  className="gts-btn-secondary"
                  leftSection={<IconPlus size={14} />}
                  onClick={handleAddGallery}
                >
                  Galerie hinzufügen
                </Button>
              </Group>
            ) : (
              <Badge
                variant="outline"
                className="gts-status-badge"
                data-tone="muted"
                leftSection={<IconLock size={12} />}
              >
                1 Galerie inklusive (Mehrere Galerien ab Citadel)
              </Badge>
            )}
          </Group>

          {isKeymaster && (
            <Group align="flex-end" gap="sm" wrap="wrap">
              <TextInput
                label="Bildtitel"
                placeholder="z.B. Spieltisch 1"
                className="gts-grow-180"
                value={picTitle}
                onChange={(e) => setPicTitle(e.currentTarget.value)}
              />
              <FileButton
                onChange={handleUploadGalleryPicture}
                accept="image/png,image/jpeg,image/webp,image/gif"
              >
                {(props) => (
                  <Button
                    {...props}
                    type="button"
                    variant="default"
                    className="gts-btn-secondary"
                    loading={uploadingPic}
                    leftSection={<IconUpload size={14} />}
                  >
                    Bild in „{selectedGallery}“ hochladen
                  </Button>
                )}
              </FileButton>
            </Group>
          )}

          {activeGalleryObj.images.length > 0 && (
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              {activeGalleryObj.images.map((img) => (
                <Paper key={img.id} p={6} radius="sm" className="gts-gallery-admin-thumb">
                  <Box className="gts-thumb-frame gts-thumb-frame-sm">
                    <MantineImage src={img.src} alt={img.alt} className="gts-thumb-img" />
                  </Box>
                  <Group justify="space-between" mt={4} wrap="nowrap">
                    <Text size="xs" className="gts-text-secondary" truncate="end">
                      {img.alt}
                    </Text>
                    {isKeymaster && (
                      <ActionIcon
                        size="xs"
                        variant="default"
                        className="gts-icon-btn-danger"
                        onClick={() => handleDeleteGalleryPicture(img.id)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Stack>

        <Divider label="Standort & Kontakt" labelPosition="left" className="gts-divider" />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <TextInput
            label="Straße & Hausnr."
            disabled={!isOwner}
            value={editStreet}
            onChange={(e) => setEditStreet(e.currentTarget.value)}
          />
          <TextInput
            label="PLZ"
            disabled={!isOwner}
            value={editPostal}
            onChange={(e) => setEditPostal(e.currentTarget.value)}
          />
          <TextInput
            label="Stadt"
            disabled={!isOwner}
            value={editCity}
            onChange={(e) => setEditCity(e.currentTarget.value)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Kontakt-E-Mail"
            disabled={!isOwner}
            value={editEmail}
            onChange={(e) => setEditEmail(e.currentTarget.value)}
          />
          <TextInput
            label="Telefon"
            disabled={!isOwner}
            value={editPhone}
            onChange={(e) => setEditPhone(e.currentTarget.value)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <TextInput
            label="Website-URL"
            disabled={!isOwner}
            value={editWebsite}
            onChange={(e) => setEditWebsite(e.currentTarget.value)}
          />
          <TextInput
            label="Online-Shop-URL"
            disabled={!isOwner}
            value={editStoreUrl}
            onChange={(e) => setEditStoreUrl(e.currentTarget.value)}
          />
          <TextInput
            label="Discord-Invite-URL"
            disabled={!isOwner}
            value={editDiscordInvite}
            onChange={(e) => setEditDiscordInvite(e.currentTarget.value)}
          />
        </SimpleGrid>

        <Divider label="Globale Öffnungszeiten" labelPosition="left" className="gts-divider" />

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
                spacing="xs"
                className="gts-align-center"
              >
                <Text size="xs" fw={700} className="gts-text-secondary">
                  {day.label}
                </Text>
                <Switch
                  size="xs"
                  disabled={!isOwner}
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
                  disabled={!isOwner || !cfg.is_open}
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
                  disabled={!isOwner || !cfg.is_open}
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

        {isOwner && (
          <Group justify="flex-end" mt="sm">
            <Button
              type="submit"
              variant="default"
              className="gts-btn-primary"
              loading={saving}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Änderungen veröffentlichen
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Stack gap="lg" maw={1400}>
      {/* TOP BAR */}
      <Paper p="xl" radius="md" className="gts-panel-header">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Group gap="xs">
              <Badge variant="outline" className="gts-tier-badge">
                {clubDetail.tier_limits?.name || clubDetail.tier}
              </Badge>
              <Badge
                variant="outline"
                className="gts-status-badge"
                data-tone={editIsPrivate ? 'muted' : 'success'}
              >
                {editIsPrivate ? 'PRIVAT' : 'ÖFFENTLICH'}
              </Badge>
            </Group>
            <Title order={2} className="brand-logo gts-army-title">
              STORE- & CLUB-SEITE EINRICHTEN
            </Title>
          </Stack>

          <Group gap="sm" wrap="wrap">
            <SegmentedControl
              size="xs"
              className="gts-segmented"
              value={viewMode}
              onChange={(v) => setViewMode(v as 'split' | 'editor' | 'preview')}
              data={[
                { label: 'Split-View', value: 'split' },
                { label: 'Editor', value: 'editor' },
                { label: 'Vollbild-Vorschau', value: 'preview' },
              ]}
            />

            <Button
              component={Link}
              href={`/${locale}/s/${clubDetail.slug}`}
              target="_blank"
              size="xs"
              variant="default"
              className="gts-btn-secondary"
              leftSection={<IconExternalLink size={14} />}
            >
              Live-Seite öffnen
            </Button>

            {isOwner && (
              <Button
                size="xs"
                variant="default"
                className="gts-btn-primary"
                loading={saving}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => handleSavePageSetup()}
              >
                Speichern
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {statusBanner && (
        <Alert
          className="gts-alert"
          data-tone={statusBanner.type === 'success' ? 'success' : 'danger'}
          icon={<IconCheck size={16} />}
          withCloseButton
          onClose={() => setStatusBanner(null)}
        >
          {statusBanner.msg}
        </Alert>
      )}

      {viewMode === 'editor' && renderEditorForm()}

      {viewMode === 'preview' && renderLivePreview()}

      {viewMode === 'split' && (
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, xl: 5 }}>{renderEditorForm()}</Grid.Col>
          <Grid.Col span={{ base: 12, xl: 7 }}>{renderLivePreview()}</Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
