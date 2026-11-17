'use client';

import { useMemo } from 'react';
import { Paper, Group, Badge, Text, Divider, Stack, Button } from '@mantine/core';
import { IconClock, IconUsers, IconLogin, IconLogout } from '@tabler/icons-react';
import { useTranslations, useLocale } from 'next-intl';
import {
  type UITournamentParticipant,
  type UITournamentMatch,
} from './TournamentMatchupGraphic';
import {
  TournamentBracketGraphic,
  type BracketRound,
} from '../animations/TournamentBracketGraphic';
import {
  SwissTournamentGraphic,
  type SwissRound,
} from '../animations/SwissTournamentGraphic';

export interface UITournament {
  id: number | string;
  name: string;
  system: string;
  category?: 'tabletop' | 'tcg' | string;
  format_type: string;
  pairing_system?: 'swiss' | 'ko' | string;
  schedule_mode?: 'sync' | 'async' | string;
  is_virtual?: boolean;
  status: 'Registration' | 'In Progress' | 'Completed' | string;
  start_date: string;
  max_players: number;
  participants_count: number;
  round_duration_days?: number;
  round_duration_hours?: number;
  participants?: UITournamentParticipant[];
  matches?: UITournamentMatch[];
}

export interface TournamentCardProps {
  tournament: UITournament;
  isAuthenticated?: boolean;
  isRegistered?: boolean;
  onRegisterClick?: (tournamentId: number | string) => void;
  onUnregisterClick?: (tournamentId: number | string) => void;
  onViewDetails?: (tournamentId: number | string) => void;
  onInspectArmyList?: (armyListId: number) => void;
}

export function TournamentCard({
  tournament,
  isAuthenticated = false,
  isRegistered = false,
  onRegisterClick,
  onUnregisterClick,
  onViewDetails,
}: TournamentCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const tr = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  const startDate = new Date(tournament.start_date);
  const isRegistrationOpen = tournament.status === 'Registration';
  const isFull = tournament.participants_count >= tournament.max_players;
  const isKo = (tournament.pairing_system || 'swiss').toLowerCase() === 'ko';

  const statusLabel =
    tournament.status === 'Registration'
      ? tr('Tournament.statusRegistration', 'ANMELDUNG LÄUFT')
      : tournament.status === 'In Progress'
        ? tr('Tournament.statusInProgress', 'LÄUFT AKTUELL')
        : tr('Tournament.statusCompleted', 'BEENDET');

  const participantProfileMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of tournament.participants || []) {
      const profileObj = p.profile || {
        DisplayName: p.display_name,
        Avatar: p.avatar_url || undefined,
        city_or_zip: p.city_or_zip,
        bio: p.bio,
        discord_account: p.discord_account,
      };
      map.set(String(p.user_id), profileObj);
    }
    return map;
  }, [tournament.participants]);

  // Build KO Bracket Rounds for TournamentBracketGraphic
  const koRounds: BracketRound[] = useMemo(() => {
    const matches = tournament.matches || [];
    const parts = tournament.participants || [];
    const maxP = Math.min(16, Math.max(4, Number(tournament.max_players) || 8));
    const totalFirstRoundMatches = Math.max(2, Math.ceil(maxP / 2));

    if (matches.length > 0) {
      const byRound = new Map<number, UITournamentMatch[]>();
      for (const m of matches) {
        const list = byRound.get(m.round_number) || [];
        list.push(m);
        byRound.set(m.round_number, list);
      }
      return Array.from(byRound.entries()).map(([rNum, rMatches]) => ({
        id: `ko-r-${rNum}`,
        title: `RUNDE ${rNum}`,
        matches: rMatches.map((m, idx) => ({
          id: `${rNum}.${idx + 1}`,
          status: m.status === 'Completed' ? 'finished' : 'open',
          top: {
            id: m.player1_id,
            name: m.player1_name || 'TBD',
            score: m.score_player1 !== null ? String(m.score_player1) : null,
            isWinner: m.winner_id !== null && m.winner_id === m.player1_id,
            profile:
              m.player1_profile ||
              (m.player1_id ? participantProfileMap.get(String(m.player1_id)) : null),
          },
          bottom: {
            id: m.player2_id,
            name: m.player2_name || 'TBD',
            score: m.score_player2 !== null ? String(m.score_player2) : null,
            isWinner: m.winner_id !== null && m.winner_id === m.player2_id,
            profile:
              m.player2_profile ||
              (m.player2_id ? participantProfileMap.get(String(m.player2_id)) : null),
          },
        })),
      }));
    }

    // Pre-seeded bracket during Registration so the KO animation is always visible
    const round1Matches = Array.from({ length: totalFirstRoundMatches }, (_, i) => {
      const p1 = parts[i * 2] || null;
      const p2 = parts[i * 2 + 1] || null;
      return {
        id: `1.${i + 1}`,
        status: 'open' as const,
        top: {
          id: p1 ? p1.user_id : null,
          name: p1 ? p1.display_name : 'TBD',
          score: null,
          isWinner: false,
          profile: p1 ? participantProfileMap.get(String(p1.user_id)) : null,
        },
        bottom: {
          id: p2 ? p2.user_id : null,
          name: p2 ? p2.display_name : 'TBD',
          score: null,
          isWinner: false,
          profile: p2 ? participantProfileMap.get(String(p2.user_id)) : null,
        },
      };
    });

    const rounds: BracketRound[] = [
      {
        id: 'ko-r-1',
        title: totalFirstRoundMatches === 2 ? 'HALBFINALE' : 'RUNDE 1',
        matches: round1Matches,
      },
    ];

    let nextMatchCount = Math.floor(totalFirstRoundMatches / 2);
    let rIdx = 2;
    while (nextMatchCount >= 1) {
      const roundTitle =
        nextMatchCount === 1
          ? 'FINALE'
          : nextMatchCount === 2
            ? 'HALBFINALE'
            : `RUNDE ${rIdx}`;
      rounds.push({
        id: `ko-r-${rIdx}`,
        title: roundTitle,
        matches: Array.from({ length: nextMatchCount }, (_, i) => ({
          id: `${rIdx}.${i + 1}`,
          status: 'open' as const,
          top: { id: null, name: 'TBD', score: null, isWinner: false },
          bottom: { id: null, name: 'TBD', score: null, isWinner: false },
        })),
      });
      nextMatchCount = Math.floor(nextMatchCount / 2);
      rIdx++;
    }

    return rounds;
  }, [tournament.matches, tournament.participants, tournament.max_players, participantProfileMap]);

  // Build Swiss Rounds for SwissTournamentGraphic
  const swissRounds: SwissRound[] = useMemo(() => {
    const matches = tournament.matches || [];
    const parts = tournament.participants || [];
    const maxP = Math.min(16, Math.max(4, Number(tournament.max_players) || 8));
    const slotsCount = Math.max(2, Math.ceil(maxP / 2));

    if (matches.length > 0) {
      const byRound = new Map<number, UITournamentMatch[]>();
      for (const m of matches) {
        const list = byRound.get(m.round_number) || [];
        list.push(m);
        byRound.set(m.round_number, list);
      }
      return Array.from(byRound.entries()).map(([rNum, rMatches]) => ({
        id: `swiss-r-${rNum}`,
        title: `RUNDE ${rNum}`,
        status: rMatches.every((m) => m.status === 'Completed') ? 'completed' : 'active',
        matches: rMatches.map((m, idx) => ({
          id: `${rNum}.${idx + 1}`,
          tableNumber: `T${idx + 1}`,
          status: m.status === 'Completed' ? 'finished' : 'open',
          top: {
            id: m.player1_id,
            name: m.player1_name || 'TBD',
            score: m.score_player1 !== null ? String(m.score_player1) : null,
            isWinner: m.winner_id !== null && m.winner_id === m.player1_id,
            profile:
              m.player1_profile ||
              (m.player1_id ? participantProfileMap.get(String(m.player1_id)) : null),
          },
          bottom: {
            id: m.player2_id,
            name: m.player2_name || 'BYE',
            score: m.score_player2 !== null ? String(m.score_player2) : null,
            isWinner: m.winner_id !== null && m.winner_id === m.player2_id,
            profile:
              m.player2_profile ||
              (m.player2_id ? participantProfileMap.get(String(m.player2_id)) : null),
          },
        })),
      }));
    }

    // Pre-seeded Swiss Round 1 + upcoming Swiss columns during Registration
    const r1Matches = Array.from({ length: slotsCount }, (_, i) => {
      const p1 = parts[i * 2] || null;
      const p2 = parts[i * 2 + 1] || null;
      return {
        id: `1.${i + 1}`,
        tableNumber: `T${i + 1}`,
        status: 'open' as const,
        top: {
          id: p1 ? p1.user_id : null,
          name: p1 ? p1.display_name : 'TBD',
          score: null,
          isWinner: false,
          profile: p1 ? participantProfileMap.get(String(p1.user_id)) : null,
        },
        bottom: {
          id: p2 ? p2.user_id : null,
          name: p2 ? p2.display_name : 'TBD',
          score: null,
          isWinner: false,
          profile: p2 ? participantProfileMap.get(String(p2.user_id)) : null,
        },
      };
    });

    return [
      {
        id: 'swiss-r-1',
        title: 'RUNDE 1',
        status: 'active',
        matches: r1Matches,
      },
      {
        id: 'swiss-r-2',
        title: 'RUNDE 2 (SWISS)',
        status: 'pending',
        matches: [],
      },
      {
        id: 'swiss-r-3',
        title: 'RUNDE 3 (SWISS)',
        status: 'pending',
        matches: [],
      },
    ];
  }, [tournament.matches, tournament.participants, tournament.max_players, participantProfileMap]);

  return (
    <Paper
      p="lg"
      radius="md"
      className="gts-tournament-card"
      data-status={tournament.status}
    >
      <Stack gap="sm">
        <div className="gts-game-header-bar">
          <Group gap="xs">
            <Badge variant="outline" size="sm" className="brand-logo gts-game-badge">
              {statusLabel}
            </Badge>
            <Badge variant="outline" size="xs" className="brand-logo gts-game-meta-tag">
              {isKo ? 'KO BRACKET' : 'SWISS SYSTEM'}
            </Badge>
            <Badge
              variant="outline"
              size="xs"
              className="brand-logo gts-status-badge"
              data-tone={tournament.is_virtual ? 'discord' : 'success'}
            >
              {tournament.is_virtual ? 'ONLINE / REMOTE' : 'VOR ORT (IN-PERSON)'}
            </Badge>
          </Group>

          <Group gap={5} wrap="nowrap" className="gts-game-time">
            <IconClock size={14} />
            <span>
              {startDate.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}{' '}
              •{' '}
              {startDate.toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </Group>
        </div>

        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={4}>
            <Text fw={700} size="xl" className="brand-logo gts-tournament-title">
              {tournament.name}
            </Text>

            <Group gap="xs" wrap="wrap">
              <Badge variant="outline" size="sm" className="gts-game-meta-tag">
                {tournament.system}
              </Badge>
              <Badge variant="outline" size="sm" className="gts-game-meta-tag">
                {tournament.format_type}
              </Badge>
              <Badge variant="outline" size="sm" className="gts-status-badge">
                ⏳ {tr('Tournament.roundDuration', 'Rundendauer')}:{' '}
                {(tournament.schedule_mode || 'sync').toLowerCase() === 'async'
                  ? `${tournament.round_duration_days ?? 14} ${tr('Tournament.days', 'Tage')} (Async)`
                  : `${tournament.round_duration_hours ?? 3} Std. (Live)`}
              </Badge>
              <Group gap={6} ml={4}>
                <IconUsers size={16} className="gts-text-accent" />
                <Text size="sm" fw={600} className="gts-text-secondary">
                  <strong className="gts-text-heading">
                    {tournament.participants_count} / {tournament.max_players}
                  </strong>
                </Text>
              </Group>
            </Group>
          </Stack>

          <Group gap="xs">
            {onViewDetails && (
              <Button
                size="xs"
                variant="default"
                className="brand-logo gts-tournament-secondary-btn"
                onClick={() => onViewDetails(tournament.id)}
              >
                {tr('Tournament.viewDetails', 'RANGLISTE & DETAILS')}
              </Button>
            )}

            {isAuthenticated &&
              isRegistrationOpen &&
              (isRegistered ? (
                <Button
                  size="xs"
                  variant="default"
                  className="brand-logo gts-btn-danger"
                  leftSection={<IconLogout size={14} />}
                  onClick={() => onUnregisterClick?.(tournament.id)}
                >
                  {tr('Tournament.unregister', 'ABMELDEN')}
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="default"
                  disabled={isFull}
                  leftSection={<IconLogin size={14} />}
                  className="brand-logo gts-game-cta-join"
                  onClick={() => onRegisterClick?.(tournament.id)}
                >
                  {isFull
                    ? tr('Tournament.full', 'VOLL')
                    : tr('Tournament.register', 'FÜR TURNIER ANMELDEN')}
                </Button>
              ))}
          </Group>
        </Group>

        <Divider
          className="gts-divider"
          my={4}
          label={
            <Text size="10px" fw={700} className="brand-logo gts-text-muted">
              {isKo ? 'KO TOURNAMENT BRACKET' : 'SWISS ROUND TRACKER'}
            </Text>
          }
          labelPosition="center"
        />

        {/* Render the GTS UI Animation directly inside the card */}
        {isKo ? (
          <TournamentBracketGraphic rounds={koRounds} />
        ) : (
          <SwissTournamentGraphic rounds={swissRounds} />
        )}
      </Stack>
    </Paper>
  );
}
