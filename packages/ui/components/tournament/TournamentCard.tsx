'use client';

import { Paper, Group, Badge, Text, Divider, Stack, Button } from '@mantine/core';
import { IconClock, IconUsers, IconLogin, IconLogout } from '@tabler/icons-react';
import { useTranslations, useLocale } from 'next-intl';
import {
  TournamentMatchupGraphic,
  type UITournamentParticipant,
  type UITournamentMatch,
} from './TournamentMatchupGraphic';

export interface UITournament {
  id: number;
  name: string;
  system: string;
  format_type: string;
  status: 'Registration' | 'In Progress' | 'Completed' | string;
  start_date: string;
  max_players: number;
  participants_count: number;
  round_duration_days?: number;
  participants?: UITournamentParticipant[];
  matches?: UITournamentMatch[];
}

export interface TournamentCardProps {
  tournament: UITournament;
  isAuthenticated?: boolean;
  isRegistered?: boolean;
  onRegisterClick?: (tournamentId: number) => void;
  onUnregisterClick?: (tournamentId: number) => void;
  onViewDetails?: (tournamentId: number) => void;
  onInspectArmyList?: (armyListId: number) => void;
}

export function TournamentCard({
  tournament,
  isAuthenticated = false,
  isRegistered = false,
  onRegisterClick,
  onUnregisterClick,
  onViewDetails,
  onInspectArmyList,
}: TournamentCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const tr = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  const startDate = new Date(tournament.start_date);
  const isRegistrationOpen = tournament.status === 'Registration';
  const isFull = tournament.participants_count >= tournament.max_players;

  const statusLabel =
    tournament.status === 'Registration'
      ? tr('Tournament.statusRegistration', 'ANMELDUNG LÄUFT')
      : tournament.status === 'In Progress'
        ? tr('Tournament.statusInProgress', 'LÄUFT AKTUELL')
        : tr('Tournament.statusCompleted', 'BEENDET');

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
              SWISS SYSTEM
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
          <Badge color="brandBlue.5" variant="light" size="sm">
            ⏳ {tr('Tournament.roundDuration', 'Rundendauer')}:{' '}
            {tournament.round_duration_days ?? 14} {tr('Tournament.days', 'Tage')}
          </Badge>
        </Group>

        <Group gap="xs" mt={2}>
          <IconUsers size={16} color="var(--gts-accent)" />
          <Text size="sm" fw={600} style={{ color: 'var(--gts-text-secondary)' }}>
            {tr('Tournament.participants', 'Teilnehmer')}:{' '}
            <strong style={{ color: 'var(--gts-text-heading)' }}>
              {tournament.participants_count} / {tournament.max_players}
            </strong>
          </Text>
        </Group>

        <Divider
          color="var(--gts-border-subtle)"
          my={4}
          label={
            <Text size="10px" fw={700} className="brand-logo" c="dimmed">
              {tr('Tournament.matchupsLabel', 'MATCHUPS / SLOTS')}
            </Text>
          }
          labelPosition="center"
        />

        <TournamentMatchupGraphic
          maxPlayers={tournament.max_players}
          participants={tournament.participants}
          matches={tournament.matches}
          compact={true}
          onInspectArmyList={onInspectArmyList}
        />
      </Stack>

      <Stack gap="xs" mt="lg">
        <Divider color="var(--gts-border-faint)" mb={2} />

        {onViewDetails && (
          <Button
            fullWidth
            variant="default"
            className="brand-logo gts-tournament-secondary-btn"
            onClick={() => onViewDetails(tournament.id)}
          >
            {tr('Tournament.viewDetails', 'DETAILS & BRACKETS ANSEHEN')}
          </Button>
        )}

        {isAuthenticated &&
          isRegistrationOpen &&
          (isRegistered ? (
            <Button
              fullWidth
              variant="outline"
              color="red"
              className="brand-logo"
              leftSection={<IconLogout size={16} />}
              onClick={() => onUnregisterClick?.(tournament.id)}
            >
              {tr('Tournament.unregister', 'ANMELDUNG ZURÜCKZIEHEN')}
            </Button>
          ) : (
            <Button
              fullWidth
              variant="default"
              disabled={isFull}
              leftSection={<IconLogin size={16} />}
              className="brand-logo gts-game-cta-join"
              onClick={() => onRegisterClick?.(tournament.id)}
            >
              {isFull
                ? tr('Tournament.full', 'TURNIER IST VOLL')
                : tr('Tournament.register', 'FÜR TURNIER ANMELDEN')}
            </Button>
          ))}
      </Stack>
    </Paper>
  );
}