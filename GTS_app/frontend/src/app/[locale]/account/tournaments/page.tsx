'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  NumberInput,
  TextInput,
  Tabs,
  SimpleGrid,
  Divider,
  Alert,
  Box,
} from '@mantine/core';
import {
  IconSwords,
  IconCards,
  IconCalendarTime,
  IconCheck,
  IconAlertTriangle,
  IconTrophy,
} from '@tabler/icons-react';

interface PlayerTournamentMatchDto {
  id: string;
  round_number: number;
  status: string;
  hand_in_by: string | null;
  scheduled_at: string | null;
  table_id: string | null;
  is_player1: boolean;
  my_score: number | null;
  opponent_score: number | null;
  my_submitted: boolean;
  opponent_submitted: boolean;
  opponent_id: string | null;
  opponent_name: string;
  opponent_army_list_id: string | null;
  opponent_army_list_name: string | null;
  my_army_list_id: string | null;
  my_army_list_name: string | null;
  winner_id: string | null;
}

interface PlayerTournamentDto {
  tournament_id: string;
  tournament_name: string;
  club_id: string;
  system: string;
  category: 'tabletop' | 'tcg';
  format_type: string;
  pairing_system: 'swiss' | 'ko';
  schedule_mode: 'sync' | 'async';
  is_virtual: boolean;
  round_duration_days: number;
  round_duration_hours: number;
  status: string;
  start_date: string;
  is_disqualified: boolean;
  army_list_id: string | null;
  army_list_name: string | null;
  matches: PlayerTournamentMatchDto[];
}

export default function AccountTournamentsPage() {
  const t = useTranslations('Account.tournaments');

  const [tournaments, setTournaments] = useState<PlayerTournamentDto[]>([]);
  const [activeTab, setActiveTab] = useState<'tabletop' | 'tcg'>('tabletop');
  const [scoresDraft, setScoresDraft] = useState<Record<string, { my: number; opp: number }>>({});
  const [scheduleDraft, setScheduleDraft] = useState<Record<string, string>>({});
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const loadMyTournaments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/account/tournaments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTournaments(await res.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadMyTournaments();
  }, [loadMyTournaments]);

  const handleScheduleMatch = async (matchId: string) => {
    const dt = scheduleDraft[matchId];
    if (!dt) return;
    const token = localStorage.getItem('token');
    setStatusBanner(null);

    const res = await fetch(`/api/tournaments/matches/${matchId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scheduled_at: dt }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadMyTournaments();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Termin-Planung fehlgeschlagen.' });
    }
  };

  const handleSubmitMatchResult = async (matchId: string, myScore: number, oppScore: number) => {
    const token = localStorage.getItem('token');
    setStatusBanner(null);

    const res = await fetch(`/api/tournaments/matches/${matchId}/hand-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        my_score: myScore,
        opponent_score: oppScore,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadMyTournaments();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Ergebnis-Übermittlung fehlgeschlagen.' });
    }
  };

  const filtered = tournaments.filter(
    (item) => (item.category || 'tabletop').toLowerCase() === activeTab
  );

  return (
    <Stack gap="lg" maw={1100}>
      <Paper p={{ base: 'lg', md: 'xl' }} radius="md" withBorder className="gts-panel-header">
        <Stack gap="xs">
          <Badge variant="outline" size="sm" className="brand-logo gts-game-meta-tag" w="fit-content">
            {t('badge')}
          </Badge>
          <Title order={2} className="brand-logo gts-army-title">
            {t('title')}
          </Title>
          <Text size="sm" maw={700} className="gts-text-subtitle">
            {t('subtitle')}
          </Text>
        </Stack>
      </Paper>

      {statusBanner && (
        <Alert
          color={statusBanner.type === 'success' ? 'teal' : 'red'}
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

      <Tabs
        value={activeTab}
        onChange={(v) => setActiveTab((v as 'tabletop' | 'tcg') || 'tabletop')}
        variant="pills"
        radius="md"
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="tabletop" leftSection={<IconSwords size={16} />}>
            Tabletop & Wargaming (
            {tournaments.filter((x) => (x.category || 'tabletop') === 'tabletop').length})
          </Tabs.Tab>
          <Tabs.Tab value="tcg" leftSection={<IconCards size={16} />}>
            Trading Card Games / TCG ({tournaments.filter((x) => x.category === 'tcg').length})
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {filtered.length === 0 ? (
        <Paper p="xl" radius="md" withBorder className="gts-panel-card">
          <Text size="sm" c="dimmed">
            Du bist aktuell für kein {activeTab === 'tcg' ? 'TCG' : 'Tabletop'}-Turnier angemeldet.
          </Text>
        </Paper>
      ) : (
        <Stack gap="md">
          {filtered.map((tourney) => (
            <Paper
              key={tourney.tournament_id}
              p="lg"
              radius="md"
              withBorder
              className="gts-panel-card"
            >
              <Stack gap="md">
                <Group justify="space-between" wrap="wrap">
                  <div>
                    <Group gap="xs">
                      <IconTrophy size={18} color="#f59e0b" />
                      <Text fw={700} size="md" className="brand-logo" c="white">
                        {tourney.tournament_name}
                      </Text>
                      <Badge size="xs" color={tourney.pairing_system === 'ko' ? 'red' : 'blue'}>
                        {tourney.pairing_system === 'ko' ? 'KO BRACKET' : 'SWISS'}
                      </Badge>
                      <Badge
                        size="xs"
                        color={tourney.schedule_mode === 'async' ? 'cyan' : 'orange'}
                        variant="light"
                      >
                        {tourney.schedule_mode === 'async'
                          ? `Async (${tourney.round_duration_days} Tage/Runde)`
                          : `Sync (${tourney.round_duration_hours} Std./Runde)`}
                      </Badge>
                      <Badge
                        size="xs"
                        color={tourney.is_virtual ? 'violet' : 'teal'}
                        variant="outline"
                      >
                        {tourney.is_virtual ? 'Online' : 'Vor Ort (In-Person)'}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>
                      {tourney.system} • {tourney.format_type} • Start:{' '}
                      {new Date(tourney.start_date).toLocaleDateString('de-DE')}
                    </Text>
                  </div>

                  <Badge color={tourney.status === 'Registration' ? 'teal' : 'blue'}>
                    {tourney.status}
                  </Badge>
                </Group>

                {(tourney.matches || []).length > 0 && (
                  <>
                    <Divider color="rgba(255,255,255,0.08)" />
                    <Stack gap="sm">
                      {tourney.matches.map((m) => {
                        const draft = scoresDraft[m.id] || {
                          my: m.my_score ?? 0,
                          opp: m.opponent_score ?? 0,
                        };
                        const schedVal =
                          scheduleDraft[m.id] ??
                          (m.scheduled_at ? m.scheduled_at.slice(0, 16) : '');

                        return (
                          <Paper
                            key={m.id}
                            p="md"
                            radius="sm"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                              <Box>
                                <Group gap="xs" mb={4}>
                                  <Badge size="xs" color="orange">
                                    RUNDE {m.round_number}
                                  </Badge>
                                  <Badge
                                    size="xs"
                                    color={
                                      m.status === 'Completed'
                                        ? 'teal'
                                        : m.status === 'Disputed'
                                        ? 'red'
                                        : 'yellow'
                                    }
                                  >
                                    {m.status}
                                  </Badge>
                                </Group>
                                <Text size="sm" fw={700}>
                                  Gegner: {m.opponent_name}
                                </Text>
                                {m.hand_in_by && (
                                  <Text size="xs" c="dimmed">
                                    Abgabefrist:{' '}
                                    {new Date(m.hand_in_by).toLocaleString('de-DE', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}
                                  </Text>
                                )}
                              </Box>

                              {/* Async Self-Scheduling Box */}
                              {tourney.schedule_mode === 'async' && m.status !== 'Completed' ? (
                                <Stack gap={4}>
                                  <Text size="xs" fw={600}>
                                    Spieltermin vereinbaren (Async)
                                  </Text>
                                  <Group gap="xs" wrap="nowrap">
                                    <TextInput
                                      type="datetime-local"
                                      size="xs"
                                      style={{ flex: 1 }}
                                      value={schedVal}
                                      onChange={(e) => {
                                        const val = e.currentTarget.value;
                                        setScheduleDraft((prev) => ({
                                          ...prev,
                                          [m.id]: val,
                                        }));
                                      }}
                                    />
                                    <Button
                                      size="xs"
                                      variant="light"
                                      color="cyan"
                                      leftSection={<IconCalendarTime size={14} />}
                                      onClick={() => handleScheduleMatch(m.id)}
                                    >
                                      Termin setzen
                                    </Button>
                                  </Group>
                                </Stack>
                              ) : (
                                <Box>
                                  {m.scheduled_at && (
                                    <Text size="xs" c="teal.3">
                                      Geplanter Termin:{' '}
                                      {new Date(m.scheduled_at).toLocaleString('de-DE')}
                                    </Text>
                                  )}
                                </Box>
                              )}

                              {/* Score Push / Hand-in Box */}
                              {m.status !== 'Completed' && m.opponent_id ? (
                                <Stack gap={4}>
                                  <Text size="xs" fw={600}>
                                    Ergebnis melden (Du : Gegner)
                                  </Text>
                                  <Group gap="xs" wrap="nowrap">
                                    <NumberInput
                                      size="xs"
                                      w={68}
                                      value={draft.my}
                                      onChange={(v) =>
                                        setScoresDraft((prev) => ({
                                          ...prev,
                                          [m.id]: { ...draft, my: Number(v) || 0 },
                                        }))
                                      }
                                    />
                                    <Text size="xs">:</Text>
                                    <NumberInput
                                      size="xs"
                                      w={68}
                                      value={draft.opp}
                                      onChange={(v) =>
                                        setScoresDraft((prev) => ({
                                          ...prev,
                                          [m.id]: { ...draft, opp: Number(v) || 0 },
                                        }))
                                      }
                                    />
                                    <Button
                                      size="xs"
                                      color="orange"
                                      onClick={() =>
                                        handleSubmitMatchResult(m.id, draft.my, draft.opp)
                                      }
                                    >
                                      {m.my_submitted ? 'Korrigieren' : 'Pushen'}
                                    </Button>
                                  </Group>
                                </Stack>
                              ) : (
                                <Group justify="flex-end" align="center">
                                  <Badge size="md" color="teal" variant="light">
                                    Endstand: {m.my_score ?? 0} : {m.opponent_score ?? 0}
                                  </Badge>
                                </Group>
                              )}
                            </SimpleGrid>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
