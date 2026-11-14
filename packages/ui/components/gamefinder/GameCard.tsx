'use client';

import { Paper, Group, Badge, Text, Stack, Button, Box } from '@mantine/core';
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
  const maxPerSide = is2v2 ? 2 : 1;

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

  const team1EmptyCount = Math.max(0, maxPerSide - team1Players.length);
  const team2EmptyCount = Math.max(0, maxPerSide - team2Players.length);

  const renderPlayerSlot = (p: UIPlayer, alignRight = false) => {
    const isMe = p.user_id === currentUserId;
    return (
      <div key={p.user_id} className="gts-game-player-slot">
        <div className={alignRight ? 'gts-game-player-row-right' : 'gts-game-player-row'}>
          <IconShield
            size={15}
            className={isMe ? 'gts-game-player-icon-me' : 'gts-game-player-icon'}
          />
          <span className="gts-game-player-name" title={p.display_name}>
            {p.display_name}
          </span>
        </div>
        <Text
          c={isMe ? 'brandCyan.4' : 'gray.4'}
          size="xs"
          fw={600}
          ta={alignRight ? 'right' : 'left'}
          className={alignRight ? 'gts-game-army-right' : 'gts-game-army-left'}
          title={p.army || 'Unbekannt'}
        >
          {p.army || 'Unbekannt'}
        </Text>
      </div>
    );
  };

  const renderEmptySlot = (idx: number, alignRight = false) => (
    <div
      key={`empty-${idx}`}
      className="gts-game-empty-slot"
      style={{ textAlign: alignRight ? 'right' : 'left' }}
    >
      OFFENER SLOT
    </div>
  );

  return (
    <Paper
      p="lg"
      radius="md"
      className="gts-game-card"
      data-matched={isMatched ? 'true' : undefined}
      data-pending={!isApproved ? 'true' : undefined}
    >
      <Stack gap="xs">
        {/* Top bar: Status Badge + Date/Time */}
        <div className="gts-game-header-bar">
          <Badge variant="outline" size="sm" className="brand-logo gts-game-badge">
            {!isApproved
              ? 'AUSSTEHEND'
              : isMatched
                ? 'MATCHED (LOCK)'
                : 'HERAUSFORDERUNG'}
          </Badge>

          <Group gap={5} wrap="nowrap" className="gts-game-time">
            <IconClock size={14} />
            <span>
              {gameDate.toLocaleDateString('de-DE')} •{' '}
              {gameDate.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              Uhr
            </span>
          </Group>
        </div>

        {/* Game System Title */}
        <Text fw={700} className="brand-logo gts-game-system-title" title={game.system}>
          {game.system}
        </Text>

        {/* Meta Pills Row */}
        <Group gap={6} wrap="wrap">
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
      </Stack>

      {/* Matchup Arena Box: 3-Column Strict CSS Grid */}
      <Box p="sm" my="md" className="gts-game-arena-box">
        {/* Team 1 Column */}
        <div className="gts-game-team-col">
          <Text fw={700} className="brand-logo gts-game-team-header">
            TEAM 1
          </Text>
          {team1Players.map((p) => renderPlayerSlot(p, false))}
          {Array.from({ length: team1EmptyCount }).map((_, i) =>
            renderEmptySlot(i, false)
          )}
        </div>

        {/* Center VS Column */}
        <div className="gts-game-vs-col">
          <IconSwords size={20} className="gts-game-vs-icon" />
          <Text className="brand-logo gts-game-vs-text">VS</Text>
        </div>

        {/* Team 2 Column */}
        <div className="gts-game-team-col-right">
          <Text fw={700} className="brand-logo gts-game-team-header">
            TEAM 2
          </Text>
          {team2Players.map((p) => renderPlayerSlot(p, true))}
          {Array.from({ length: team2EmptyCount }).map((_, i) =>
            renderEmptySlot(i, true)
          )}
        </div>
      </Box>

      {/* Bottom Action CTA */}
      {isAuthenticated && (
        <Stack gap="xs" mt="auto">
          {!isMatched && !userIsInGame && onJoinClick && (
            <Button
              fullWidth
              radius="md"
              variant="default"
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