'use client';

import { Paper, Group, Badge, Text, Stack, Button, Grid, Box } from '@mantine/core';
import {
  IconClock,
  IconShield,
  IconSwords,
  IconTrash,
  IconDoorExit,
  IconDeviceDesktop,
  IconBuilding,
} from '@tabler/icons-react';

export interface UIPlayer {
  user_id: number;
  display_name: string;
  army?: string;
  army_list_id?: number;
  army_list_name?: string;
  team?: string;
}

export interface UIGame {
  id: number;
  status: string;
  start_time: string;
  created_by_id: number;
  is_virtual: boolean;
  is_approved: boolean;
  format_type: string;
  system: string;
  points?: number;
  is_open_list?: boolean;
  description?: string;
  players: UIPlayer[];
}

export interface GameCardProps {
  game: UIGame;
  currentUserId?: number | null;
  isAuthenticated?: boolean;
  onJoinClick?: (gameId: number) => void;
  onLeaveClick?: (gameId: number) => void;
  onDeleteClick?: (gameId: number) => void;
}

export function GameCard({
  game,
  currentUserId,
  isAuthenticated,
  onJoinClick,
  onLeaveClick,
  onDeleteClick,
}: GameCardProps) {
  const isMatched = game.status === 'Matched';
  const gameDate = new Date(game.start_time);
  const isCreator = currentUserId === game.created_by_id;
  const userIsInGame = Boolean(
    currentUserId && game.players.some((p) => p.user_id === currentUserId)
  );
  const isVirtual = game.is_virtual;
  const isApproved = game.is_approved;

  // --- TEAM SPLIT (1v1 & 2v2) ---
  const is2v2 = game.format_type === '2v2';

  let team1Players: UIPlayer[] = [];
  let team2Players: UIPlayer[] = [];

  if (is2v2) {
    team1Players = game.players.filter((p) => p.team === 'Team 1');
    team2Players = game.players.filter((p) => p.team === 'Team 2');
    const unassigned = game.players.filter(
      (p) => p.team !== 'Team 1' && p.team !== 'Team 2'
    );
    unassigned.forEach((p) => {
      if (team1Players.length < 2) team1Players.push(p);
      else team2Players.push(p);
    });
  } else {
    if (game.players.length > 0) team1Players.push(game.players[0]);
    if (game.players.length > 1) team2Players.push(game.players[1]);
  }

  const renderPlayerSlot = (p: UIPlayer, alignRight = false) => {
    const isMe = p.user_id === currentUserId;
    return (
      <Stack key={p.user_id} gap={2} align={alignRight ? 'flex-end' : 'flex-start'}>
        <Group
          gap={6}
          wrap="nowrap"
          className={alignRight ? 'gts-game-player-row-right' : undefined}
        >
          <IconShield
            size={16}
            className={isMe ? 'gts-game-player-icon-me' : 'gts-game-player-icon'}
          />
          <Text c="white" fw={700} size="sm" lineClamp={1}>
            {p.display_name}
          </Text>
        </Group>
        <Text
          c={isMe ? 'brandCyan.4' : 'gray.4'}
          size="xs"
          fw={600}
          ta={alignRight ? 'right' : 'left'}
          className={alignRight ? 'gts-game-army-right' : 'gts-game-army-left'}
        >
          {p.army || 'Unbekannt'}
        </Text>
      </Stack>
    );
  };

  return (
    <Paper
      p="lg"
      radius="md"
      className="gts-game-card"
      data-matched={isMatched ? 'true' : undefined}
      data-pending={!isApproved ? 'true' : undefined}
    >
      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap">
          <Badge variant="outline" size="md" className="brand-logo gts-game-badge">
            {!isApproved
              ? 'AUSSTEHEND'
              : isMatched
                ? 'MATCHED (LOCK)'
                : 'OFFENE HERAUSFORDERUNG'}
          </Badge>

          <Group gap={6} c="gray.4">
            <IconClock size={15} />
            <Text size="xs" fw={600}>
              {gameDate.toLocaleDateString('de-DE')} •{' '}
              {gameDate.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              Uhr
            </Text>
          </Group>
        </Group>

        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text fw={700} c="white" className="brand-logo gts-game-system-title">
            {game.system}
          </Text>

          <Group gap={6}>
            <Badge
              size="xs"
              variant="outline"
              className="gts-game-meta-tag"
              leftSection={
                isVirtual ? <IconDeviceDesktop size={11} /> : <IconBuilding size={11} />
              }
            >
              {isVirtual ? 'REMOTE' : 'VOR ORT'}
            </Badge>
            {game.format_type && (
              <Badge size="xs" variant="outline" className="gts-game-meta-tag">
                {game.format_type}
              </Badge>
            )}
            {game.points && (
              <Badge size="xs" variant="outline" className="gts-game-meta-tag">
                {game.points} PTS
              </Badge>
            )}
          </Group>
        </Group>
      </Stack>

      <Box p="sm" my="md" className="gts-game-arena-box">
        <Grid align="center" gap="xs">
          <Grid.Col span={5}>
            <Stack gap="sm">
              <Text c="gray.5" fw={700} className="brand-logo gts-game-team-header">
                TEAM 1
              </Text>
              {team1Players.map((p) => renderPlayerSlot(p, false))}
            </Stack>
          </Grid.Col>

          <Grid.Col span={2}>
            <Stack align="center" justify="center" gap={2}>
              <IconSwords size={20} className="gts-game-vs-icon" />
              <Text className="brand-logo gts-game-vs-text">VS</Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={5}>
            <Stack gap="sm" align="flex-end">
              <Text
                c="gray.5"
                fw={700}
                ta="right"
                className="brand-logo gts-game-team-header"
              >
                TEAM 2
              </Text>
              {team2Players.map((p) => renderPlayerSlot(p, true))}
            </Stack>
          </Grid.Col>
        </Grid>
      </Box>

      {isAuthenticated && (
        <Stack gap="xs" mt="auto">
          {!isMatched && !userIsInGame && onJoinClick && (
            <Button
              fullWidth
              radius="md"
              leftSection={<IconSwords size={18} />}
              className="brand-logo gts-game-cta-join"
              onClick={() => onJoinClick(game.id)}
            >
              HERAUSFORDERUNG ANNEHMEN
            </Button>
          )}
          {userIsInGame && !isCreator && onLeaveClick && (
            <Button
              fullWidth
              radius="md"
              variant="outline"
              color="gray"
              leftSection={<IconDoorExit size={16} />}
              className="brand-logo"
              onClick={() => onLeaveClick(game.id)}
            >
              MATCH VERLASSEN
            </Button>
          )}
          {isCreator && onDeleteClick && (
            <Button
              fullWidth
              radius="md"
              variant="outline"
              color="red"
              leftSection={<IconTrash size={16} />}
              className="brand-logo"
              onClick={() => onDeleteClick(game.id)}
            >
              HERAUSFORDERUNG LÖSCHEN
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}