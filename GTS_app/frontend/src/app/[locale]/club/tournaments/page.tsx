'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  NumberInput,
  Switch,
  SimpleGrid,
  Alert,
  ActionIcon,
  Tabs,
  SegmentedControl,
  Select,
  Modal,
  Divider,
  Box,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconSwords,
  IconCards,
  IconTrophy,
  IconCheck,
  IconAlertTriangle,
  IconEye,
  IconGavel,
  IconScale,
} from '@tabler/icons-react';
import {
  TournamentBracketGraphic,
  SwissTournamentGraphic,
  TournamentStandingsTable,
  type BracketRound,
  type SwissRound,
} from '@gts/ui';
import {
  useClubManagement,
  getClubAuthHeaders,
} from '../../../../context/ClubManagementContext';

interface ClubTournamentMatchDto {
  id: string;
  round_number: number;
  player1_id: string | null;
  player1_name: string | null;
  player2_id: string | null;
  player2_name: string | null;
  score_player1: number | null;
  score_player2: number | null;
  p1_reported_s1: number | null;
  p1_reported_s2: number | null;
  p2_reported_s1: number | null;
  p2_reported_s2: number | null;
  hand_in_by: string | null;
  scheduled_at: string | null;
  table_id: string | null;
  p1_submitted: boolean;
  p2_submitted: boolean;
  winner_id: string | null;
  status: string;
}

interface TournamentJudgeDto {
  id: string;
  user_id: string;
  display_name: string;
  is_employee: boolean;
  role_label: string;
}

interface ClubTournamentDto {
  id: string;
  name: string;
  club_id: string;
  system: string;
  category: 'tabletop' | 'tcg';
  format_type: string;
  pairing_system: 'swiss' | 'ko';
  schedule_mode: 'sync' | 'async';
  is_virtual: boolean;
  max_players: number;
  round_duration_days: number;
  round_duration_hours: number;
  status: string;
  start_date: string;
  participants_count: number;
  active_participants_count: number;
  participants: any[];
  judges: TournamentJudgeDto[];
  standings: any[];
  matches: ClubTournamentMatchDto[];
}

const TABLETOP_SYSTEM_PRESETS = [
  'Warhammer 40k',
  'Age of Sigmar',
  'Horus Heresy (30k)',
  'The Old World',
  'Kill Team',
  'Trench Crusade',
];

const TCG_SYSTEM_PRESETS = [
  'Magic: The Gathering',
  'Pokémon TCG',
  'Yu-Gi-Oh!',
  'Disney Lorcana',
  'One Piece Card Game',
  'Star Wars: Unlimited',
  'Flesh and Blood',
];

export default function ClubTournamentsPage() {
  const { selectedClubId, clubDetail, canManageTournaments } = useClubManagement();

  const [tournaments, setTournaments] = useState<ClubTournamentDto[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'tabletop' | 'tcg'>('tabletop');

  // Creation Form State (Clean & Aligned — No description subtexts)
  const [name, setName] = useState('');
  const [system, setSystem] = useState('Warhammer 40k');
  const [formatType, setFormatType] = useState('2000 Pkt. Strike Force');
  const [pairingSystem, setPairingSystem] = useState<'swiss' | 'ko'>('swiss');
  const [scheduleMode, setScheduleMode] = useState<'sync' | 'async'>('sync');
  const [isVirtual, setIsVirtual] = useState(false); // Default is In-Person (false)
  const [maxPlayers, setMaxPlayers] = useState<number>(16);
  const [roundDays, setRoundDays] = useState<number>(14);
  const [roundHours, setRoundHours] = useState<number>(3);
  const [startDate, setStartDate] = useState('');

  // Inspector & Judges Modal State
  const [inspectedTournamentId, setInspectedTournamentId] = useState<string | null>(null);
  const [resolveScores, setResolveScores] = useState<Record<string, { s1: number; s2: number }>>({});
  const [judgeEmployeeId, setJudgeEmployeeId] = useState<string | null>(null);
  const [judgeUserIdentifier, setJudgeUserIdentifier] = useState('');
  const [judgeRoleLabel, setJudgeRoleLabel] = useState('Head Judge');

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const loadTournaments = useCallback(async () => {
    if (!selectedClubId) return;
    const res = await fetch('/api/admin/tournaments', {
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      const all: ClubTournamentDto[] = await res.json();
      setTournaments(all.filter((t) => t.club_id === selectedClubId));
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleCategoryTabChange = (val: string | null) => {
    const nextCat = val === 'tcg' ? 'tcg' : 'tabletop';
    setActiveCategoryTab(nextCat);
    if (nextCat === 'tcg') {
      setSystem('Magic: The Gathering');
      setFormatType('Commander / Modern');
      setRoundHours(1);
    } else {
      setSystem('Warhammer 40k');
      setFormatType('2000 Pkt. Strike Force');
      setRoundHours(3);
    }
  };

  const tierLimits = clubDetail?.tier_limits;
  const maxSignupTournaments = tierLimits?.max_active_signup_tournaments ?? 1;
  const activeSignupCount = useMemo(
    () => tournaments.filter((t) => t.status === 'Registration').length,
    [tournaments]
  );
  const isAtTournamentLimit = activeSignupCount >= maxSignupTournaments;

  const filteredTournaments = useMemo(
    () =>
      tournaments.filter(
        (t) => (t.category || 'tabletop').toLowerCase() === activeCategoryTab
      ),
    [tournaments, activeCategoryTab]
  );

  const inspectedTournament = useMemo(
    () => tournaments.find((t) => t.id === inspectedTournamentId) || null,
    [tournaments, inspectedTournamentId]
  );

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !name.trim() || !startDate) return;
    setStatusBanner(null);

    const res = await fetch('/api/admin/tournaments', {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({
        club_id: selectedClubId,
        name: name.trim(),
        system: system.trim(),
        category: activeCategoryTab,
        format_type: formatType.trim(),
        pairing_system: pairingSystem,
        schedule_mode: scheduleMode,
        is_virtual: isVirtual,
        max_players: maxPlayers,
        round_duration_days: roundDays,
        round_duration_hours: roundHours,
        start_date: startDate,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setName('');
      await loadTournaments();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Erstellen.' });
    }
  };

  const handleGenerateNextRound = async (tourneyId: string) => {
    setStatusBanner(null);
    const res = await fetch(`/api/admin/tournaments/${tourneyId}/generate-round`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadTournaments();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Paarungs-Fehler.' });
    }
  };

  const handleResolveMatchScore = async (matchId: string, s1: number, s2: number) => {
    setStatusBanner(null);
    const res = await fetch(`/api/admin/tournaments/matches/${matchId}/resolve`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({ score_player1: s1, score_player2: s2 }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadTournaments();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg });
    }
  };

  const handleAddJudge = async (
    tourneyId: string,
    payload: { user_id?: string; user_identifier?: string; role_label: string }
  ) => {
    const res = await fetch(`/api/admin/tournaments/${tourneyId}/judges`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setJudgeUserIdentifier('');
      setJudgeEmployeeId(null);
      await loadTournaments();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Judge konnte nicht hinzugefügt werden.' });
    }
  };

  const handleRemoveJudge = async (tourneyId: string, judgeId: string) => {
    const res = await fetch(`/api/admin/tournaments/${tourneyId}/judges/${judgeId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      await loadTournaments();
    }
  };

  const handleDeleteTournament = async (tourneyId: string) => {
    const res = await fetch(`/api/admin/tournaments/${tourneyId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      if (inspectedTournamentId === tourneyId) setInspectedTournamentId(null);
      await loadTournaments();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg });
    }
  };

  const visualSwissRounds: SwissRound[] = useMemo(() => {
    if (!inspectedTournament) return [];
    const byRound = new Map<number, ClubTournamentMatchDto[]>();
    for (const m of inspectedTournament.matches || []) {
      const list = byRound.get(m.round_number) || [];
      list.push(m);
      byRound.set(m.round_number, list);
    }
    return Array.from(byRound.entries()).map(([rNum, rMatches]) => {
      const allDone = rMatches.every((m) => m.status === 'Completed');
      return {
        id: `round-${rNum}`,
        title: `RUNDE ${rNum}`,
        status: allDone ? 'completed' : 'active',
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
      };
    });
  }, [inspectedTournament]);

  const visualBracketRounds: BracketRound[] = useMemo(() => {
    if (!inspectedTournament) return [];
    const byRound = new Map<number, ClubTournamentMatchDto[]>();
    for (const m of inspectedTournament.matches || []) {
      const list = byRound.get(m.round_number) || [];
      list.push(m);
      byRound.set(m.round_number, list);
    }
    return Array.from(byRound.entries()).map(([rNum, rMatches]) => ({
      id: `ko-round-${rNum}`,
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
          name: m.player2_name || 'Freilos (Bye)',
          score: m.score_player2 !== null ? String(m.score_player2) : null,
          isWinner: m.winner_id !== null && m.winner_id === m.player2_id,
        },
      })),
    }));
  }, [inspectedTournament]);

  const systemPresets =
    activeCategoryTab === 'tcg' ? TCG_SYSTEM_PRESETS : TABLETOP_SYSTEM_PRESETS;

  return (
    <Stack gap="lg" maw={1100}>
      <Paper p="lg" radius="md" className="gts-panel-header">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <Title order={2} className="brand-logo gts-army-title">
              TURNIERE
            </Title>
            <Badge variant="outline" size="sm" className="brand-logo gts-tier-badge">
              {tierLimits?.display_label || clubDetail?.tier}
            </Badge>
          </Group>
          <Badge
            variant="outline"
            size="sm"
            className="gts-status-badge"
            data-tone={isAtTournamentLimit ? 'danger' : 'success'}
          >
            {activeSignupCount} / {maxSignupTournaments} ANMELDEPHASEN OFFEN
          </Badge>
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

      {/* SPLIT TABS: TABLETOP vs. TCG */}
      <Tabs
        value={activeCategoryTab}
        onChange={handleCategoryTabChange}
        variant="pills"
        radius="md"
        className="gts-pill-tabs"
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="tabletop" leftSection={<IconSwords size={16} />}>
            Tabletop ({tournaments.filter((t) => (t.category || 'tabletop') === 'tabletop').length})
          </Tabs.Tab>
          <Tabs.Tab value="tcg" leftSection={<IconCards size={16} />}>
            TCG ({tournaments.filter((t) => t.category === 'tcg').length})
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* CLEAN & ALIGNED CREATE TOURNAMENT FORM */}
      {canManageTournaments && (
        <Paper
          component="form"
          onSubmit={handleCreateTournament}
          p="lg"
          radius="md"
          className="gts-panel-card gts-form"
        >
          <Stack gap="md">
            <Group justify="space-between" wrap="wrap">
              <Group gap="xs">
                {activeCategoryTab === 'tcg' ? (
                  <IconCards size={18} className="gts-section-icon" />
                ) : (
                  <IconSwords size={18} className="gts-section-icon" />
                )}
                <Text className="gts-section-heading">
                  NEUES {activeCategoryTab === 'tcg' ? 'TCG-' : 'TABLETOP-'}TURNIER
                </Text>
              </Group>

              {isAtTournamentLimit && (
                <Badge variant="outline" className="gts-status-badge" data-tone="danger">
                  Limit erreicht ({activeSignupCount}/{maxSignupTournaments})
                </Badge>
              )}
            </Group>

            {/* Row 1: Pairing System (Swiss vs KO) & Schedule Mode (Sync vs Async) */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Box>
                <Text className="gts-eyebrow" mb={4}>
                  Paarung
                </Text>
                <SegmentedControl
                  fullWidth
                  size="xs"
                  className="gts-segmented"
                  disabled={isAtTournamentLimit}
                  value={pairingSystem}
                  onChange={(v) => setPairingSystem(v as 'swiss' | 'ko')}
                  data={[
                    { label: 'Swiss', value: 'swiss' },
                    { label: 'KO-System', value: 'ko' },
                  ]}
                />
              </Box>

              <Box>
                <Text className="gts-eyebrow" mb={4}>
                  Zeit-Modus
                </Text>
                <SegmentedControl
                  fullWidth
                  size="xs"
                  className="gts-segmented"
                  disabled={isAtTournamentLimit}
                  value={scheduleMode}
                  onChange={(v) => setScheduleMode(v as 'sync' | 'async')}
                  data={[
                    { label: 'Synchron (Stunden)', value: 'sync' },
                    { label: 'Asynchron (Tage)', value: 'async' },
                  ]}
                />
              </Box>
            </SimpleGrid>

            {/* Row 2: Name, System, Format */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" className="gts-align-end">
              <TextInput
                label="Turniername"
                placeholder={
                  activeCategoryTab === 'tcg' ? 'FNM Commander Cup' : 'Citadel 40k Grand Melee'
                }
                required
                disabled={isAtTournamentLimit}
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
              <Select
                label="Spielsystem"
                searchable
                disabled={isAtTournamentLimit}
                value={system}
                onChange={(v) => v && setSystem(v)}
                data={systemPresets}
              />
              <TextInput
                label="Format"
                placeholder={
                  activeCategoryTab === 'tcg' ? 'Commander / Bo3' : '2000 Pkt. Strike Force'
                }
                disabled={isAtTournamentLimit}
                value={formatType}
                onChange={(e) => setFormatType(e.currentTarget.value)}
              />
            </SimpleGrid>

            {/* Row 3: Max Players, Round Duration, Start Date (All aligned without sub-descriptions) */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" className="gts-align-end">
              <NumberInput
                label="Max. Teilnehmer"
                min={4}
                max={128}
                disabled={isAtTournamentLimit}
                value={maxPlayers}
                onChange={(v) => setMaxPlayers(Number(v) || 16)}
              />

              {scheduleMode === 'sync' ? (
                <NumberInput
                  label="Rundendauer (Stunden)"
                  min={0.5}
                  max={12}
                  step={0.5}
                  decimalScale={1}
                  disabled={isAtTournamentLimit}
                  value={roundHours}
                  onChange={(v) => setRoundHours(Number(v) || 3)}
                />
              ) : (
                <NumberInput
                  label="Rundendauer (Tage)"
                  min={1}
                  max={60}
                  disabled={isAtTournamentLimit}
                  value={roundDays}
                  onChange={(v) => setRoundDays(Number(v) || 14)}
                />
              )}

              <TextInput
                label="Turnierstart"
                type="datetime-local"
                required
                disabled={isAtTournamentLimit}
                value={startDate}
                onChange={(e) => setStartDate(e.currentTarget.value)}
              />
            </SimpleGrid>

            {/* Row 4: Clean In-Person / Online Toggle + Submit */}
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="sm">
                <Switch
                  size="xs"
                  label="Online-Turnier"
                  disabled={isAtTournamentLimit}
                  checked={isVirtual}
                  onChange={(e) => setIsVirtual(e.currentTarget.checked)}
                />
                <Badge
                  size="xs"
                  variant="outline"
                  className="gts-status-badge"
                  data-tone={isVirtual ? 'accent' : 'success'}
                >
                  {isVirtual ? 'ONLINE' : 'VOR ORT'}
                </Badge>
              </Group>

              <Button
                type="submit"
                variant="default"
                className="gts-btn-primary"
                size="xs"
                disabled={isAtTournamentLimit}
                leftSection={<IconPlus size={14} />}
              >
                {isAtTournamentLimit ? 'Limit erreicht' : 'Turnier erstellen'}
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* TOURNAMENTS TABLE */}
      <Paper p="lg" radius="md" className="gts-panel-card">
        <Text className="gts-section-heading" mb="md">
          {activeCategoryTab === 'tcg' ? 'TCG-TURNIERE' : 'TABLETOP-TURNIERE'} (
          {filteredTournaments.length})
        </Text>

        {filteredTournaments.length === 0 ? (
          <div className="gts-empty-state">Keine Turniere vorhanden.</div>
        ) : (
          <Table striped highlightOnHover className="gts-data-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Turnier</Table.Th>
                <Table.Th>System</Table.Th>
                <Table.Th>Modus</Table.Th>
                <Table.Th>Judges</Table.Th>
                <Table.Th>Spieler</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Steuerung</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTournaments.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>
                    <Text size="sm" fw={700} className="gts-text-heading">
                      {t.name}
                    </Text>
                    <Group gap={4} mt={2}>
                      <Badge
                        size="xs"
                        variant="outline"
                        className="gts-status-badge"
                        data-tone={t.is_virtual ? 'accent' : 'success'}
                      >
                        {t.is_virtual ? 'Online' : 'Vor Ort'}
                      </Badge>
                      <Text size="xs" className="gts-text-muted">
                        {new Date(t.start_date).toLocaleDateString('de-DE')}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={600} className="gts-text-body">
                      {t.system}
                    </Text>
                    <Text size="xs" className="gts-text-muted">
                      {t.format_type}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Badge
                        size="xs"
                        variant="outline"
                        className="gts-status-badge"
                        data-tone={t.pairing_system === 'ko' ? 'danger' : undefined}
                      >
                        {t.pairing_system === 'ko' ? 'KO' : 'SWISS'}
                      </Badge>
                      <Badge
                        size="xs"
                        variant="outline"
                        className="gts-game-meta-tag"
                      >
                        {t.schedule_mode === 'async'
                          ? `${t.round_duration_days}d Async`
                          : `${t.round_duration_hours}h Sync`}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {(t.judges || []).length === 0 ? (
                        <Text size="xs" className="gts-text-muted">
                          —
                        </Text>
                      ) : (
                        (t.judges || []).map((j) => (
                          <Badge
                            key={j.id}
                            size="xs"
                            variant="outline"
                            className="gts-status-badge"
                            data-tone={j.is_employee ? 'gold' : 'accent'}
                          >
                            {j.display_name}
                          </Badge>
                        ))
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {t.participants_count} / {t.max_players}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="outline"
                      className="gts-status-badge"
                      data-tone={t.status === 'Registration' ? 'success' : undefined}
                    >
                      {t.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Button
                        size="xs"
                        variant="default"
                        className="gts-btn-ghost"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setInspectedTournamentId(t.id)}
                      >
                        Verwalten
                      </Button>
                      {canManageTournaments && t.status !== 'Completed' && (
                        <Button
                          size="xs"
                          variant="default"
                          className="gts-btn-primary"
                          leftSection={<IconTrophy size={14} />}
                          onClick={() => handleGenerateNextRound(t.id)}
                        >
                          Nächste Runde
                        </Button>
                      )}
                      {canManageTournaments && (
                        <ActionIcon
                          variant="default"
                          className="gts-icon-btn-danger"
                          onClick={() => handleDeleteTournament(t.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* INSPECT TOURNAMENT: JUDGES, BRACKET & MATCHES MODAL */}
      <Modal
        opened={Boolean(inspectedTournament)}
        onClose={() => setInspectedTournamentId(null)}
        size="xl"
        title={
          <Group gap="xs">
            <Text fw={700} className="brand-logo gts-text-heading">
              {inspectedTournament?.name?.toUpperCase()}
            </Text>
            <Badge size="xs" variant="outline" className="gts-tier-badge">
              {inspectedTournament?.pairing_system === 'ko' ? 'KO BRACKET' : 'SWISS'}
            </Badge>
            <Badge size="xs" variant="outline" className="gts-game-meta-tag">
              {inspectedTournament?.schedule_mode === 'async'
                ? `${inspectedTournament?.round_duration_days}d ASYNC`
                : `${inspectedTournament?.round_duration_hours}h SYNC`}
            </Badge>
          </Group>
        }
        classNames={{
          content: 'gts-modal-content',
          header: 'gts-modal-header',
          title: 'gts-modal-title',
        }}
      >
        {inspectedTournament && (
          <Stack gap="lg">
            {/* 1. TOURNAMENT JUDGES (EMPLOYEE OR REGULAR USER) */}
            <Box p="md" className="gts-subcard gts-form">
              <Group gap="xs" mb="sm">
                <IconScale size={18} className="gts-section-icon" />
                <Text className="gts-section-heading">
                  TURNIER-JUDGES ({inspectedTournament.judges?.length || 0})
                </Text>
              </Group>

              {canManageTournaments && (
                <SimpleGrid
                  cols={{ base: 1, sm: 3 }}
                  spacing="sm"
                  mb="sm"
                  className="gts-align-end"
                >
                  <Select
                    label="Aus Club-Mitarbeitern wählen"
                    placeholder="Mitarbeiter..."
                    size="xs"
                    clearable
                    value={judgeEmployeeId}
                    onChange={(val) => {
                      setJudgeEmployeeId(val);
                      if (val) setJudgeUserIdentifier('');
                    }}
                    data={(clubDetail?.employees || []).map((e) => ({
                      value: e.user_id,
                      label: `${e.display_name} (${e.role_title})`,
                    }))}
                  />
                  <TextInput
                    label="Oder Spieler (Name / E-Mail)"
                    placeholder="Benutzername..."
                    size="xs"
                    value={judgeUserIdentifier}
                    onChange={(e) => {
                      setJudgeUserIdentifier(e.currentTarget.value);
                      if (e.currentTarget.value) setJudgeEmployeeId(null);
                    }}
                  />
                  <Group gap="xs" wrap="nowrap">
                    <TextInput
                      label="Rolle"
                      size="xs"
                      className="gts-grow"
                      value={judgeRoleLabel}
                      onChange={(e) => setJudgeRoleLabel(e.currentTarget.value)}
                    />
                    <Button
                      size="xs"
                      variant="default"
                      className="gts-btn-primary"
                      mt={18}
                      leftSection={<IconPlus size={14} />}
                      onClick={() => {
                        if (!judgeEmployeeId && !judgeUserIdentifier.trim()) return;
                        handleAddJudge(inspectedTournament.id, {
                          user_id: judgeEmployeeId || undefined,
                          user_identifier: judgeUserIdentifier.trim() || undefined,
                          role_label: judgeRoleLabel.trim() || 'Judge',
                        });
                      }}
                    >
                      Judge
                    </Button>
                  </Group>
                </SimpleGrid>
              )}

              <Group gap="xs">
                {(inspectedTournament.judges || []).map((j) => (
                  <Badge
                    key={j.id}
                    variant="outline"
                    className="gts-status-badge"
                    data-tone={j.is_employee ? 'gold' : 'accent'}
                    rightSection={
                      canManageTournaments ? (
                        <ActionIcon
                          size={14}
                          variant="default"
                          className="gts-icon-btn-danger"
                          onClick={() => handleRemoveJudge(inspectedTournament.id, j.id)}
                        >
                          <IconTrash size={10} />
                        </ActionIcon>
                      ) : undefined
                    }
                  >
                    {j.display_name} • {j.role_label} ({j.is_employee ? 'Staff' : 'User'})
                  </Badge>
                ))}
              </Group>
            </Box>

            {/* 2. VISUAL BRACKET / SWISS ROUNDS */}
            {inspectedTournament.pairing_system === 'ko' ? (
              visualBracketRounds.length > 0 ? (
                <TournamentBracketGraphic rounds={visualBracketRounds} />
              ) : (
                <div className="gts-empty-state">Noch keine KO-Runden gestartet.</div>
              )
            ) : visualSwissRounds.length > 0 ? (
              <SwissTournamentGraphic rounds={visualSwissRounds} />
            ) : (
              <div className="gts-empty-state">Noch keine Swiss-Runden gestartet.</div>
            )}

            {/* 3. MATCHES & JUDGE / TO SCORE OVERRIDE */}
            {(inspectedTournament.matches || []).length > 0 && (
              <>
                <Divider
                  label="Matches & Ergebnis-Entscheid"
                  labelPosition="left"
                  className="gts-divider"
                />
                <Table striped className="gts-data-table">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Runde</Table.Th>
                      <Table.Th>Paarung</Table.Th>
                      <Table.Th>Termin / Frist</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Judge / TO Wertung</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {inspectedTournament.matches.map((m) => {
                      const draft = resolveScores[m.id] || {
                        s1: m.score_player1 ?? 0,
                        s2: m.score_player2 ?? 0,
                      };
                      return (
                        <Table.Tr key={m.id}>
                          <Table.Td fw={700}>R{m.round_number}</Table.Td>
                          <Table.Td>
                            {m.player1_name || 'TBD'} vs. {m.player2_name || 'BYE'}
                          </Table.Td>
                          <Table.Td>
                            {m.scheduled_at && (
                              <Badge
                                size="xs"
                                variant="outline"
                                className="gts-status-badge"
                                data-tone="success"
                                display="block"
                                mb={2}
                              >
                                {new Date(m.scheduled_at).toLocaleString('de-DE', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </Badge>
                            )}
                            <Text size="xs" className="gts-text-muted">
                              {m.hand_in_by
                                ? new Date(m.hand_in_by).toLocaleString('de-DE', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : '—'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              variant="outline"
                              className="gts-status-badge"
                              data-tone={
                                m.status === 'Completed'
                                  ? 'success'
                                  : m.status === 'Disputed'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {m.status} ({m.score_player1 ?? '-'} : {m.score_player2 ?? '-'})
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {m.player2_id && (
                              <Group gap={4} wrap="nowrap">
                                <NumberInput
                                  size="xs"
                                  w={64}
                                  value={draft.s1}
                                  onChange={(v) =>
                                    setResolveScores((prev) => ({
                                      ...prev,
                                      [m.id]: { ...draft, s1: Number(v) || 0 },
                                    }))
                                  }
                                />
                                <Text size="xs" className="gts-text-muted">:</Text>
                                <NumberInput
                                  size="xs"
                                  w={64}
                                  value={draft.s2}
                                  onChange={(v) =>
                                    setResolveScores((prev) => ({
                                      ...prev,
                                      [m.id]: { ...draft, s2: Number(v) || 0 },
                                    }))
                                  }
                                />
                                <ActionIcon
                                  variant="default"
                                  className="gts-icon-btn"
                                  onClick={() => handleResolveMatchScore(m.id, draft.s1, draft.s2)}
                                >
                                  <IconGavel size={15} />
                                </ActionIcon>
                              </Group>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </>
            )}

            {(inspectedTournament.standings || []).length > 0 && (
              <>
                <Divider label="Tabelle" labelPosition="left" className="gts-divider" />
                <TournamentStandingsTable standings={inspectedTournament.standings} />
              </>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
