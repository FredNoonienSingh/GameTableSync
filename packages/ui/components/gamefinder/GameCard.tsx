'use client';

import { Card, Group, Badge, Text, Divider, Stack, Button, Grid, Box } from '@mantine/core';
import { IconClock, IconShield, IconSwords, IconTrash, IconDoorExit, IconDeviceDesktop, IconBuilding, IconKey, IconFileCode } from '@tabler/icons-react';

// Decoupled types for the UI package
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

export function GameCard({ game, currentUserId, isAuthenticated, onJoinClick, onLeaveClick, onDeleteClick }: GameCardProps) {
  const isMatched = game.status === "Matched";
  const gameDate = new Date(game.start_time);
  const isCreator = currentUserId === game.created_by_id;
  const userIsInGame = currentUserId && game.players.some(p => p.user_id === currentUserId);
  const isVirtual = game.is_virtual;
  const isApproved = game.is_approved;

  // --- TEAM AUFSPLITTUNG (1v1 & 2v2) ---
  const is2v2 = game.format_type === '2v2';
  const maxPerSide = is2v2 ? 2 : 1;

  let team1Players: UIPlayer[] = [];
  let team2Players: UIPlayer[] = [];

  if (is2v2) {
    team1Players = game.players.filter(p => p.team === 'Team 1');
    team2Players = game.players.filter(p => p.team === 'Team 2');
    const unassigned = game.players.filter(p => p.team !== 'Team 1' && p.team !== 'Team 2');
    unassigned.forEach(p => {
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
        <Group gap={6} wrap="nowrap" style={{ flexDirection: alignRight ? 'row-reverse' : 'row' }}>
          <IconShield size={16} color={isMe ? "#e0282b" : "#a6a7ab"} style={{ flexShrink: 0 }} />
          <Text c="white" fw={700} size="sm" lineClamp={1}>{p.display_name}</Text>
        </Group>
        <Text 
          c={isMe ? "#e0282b" : "gray.4"} 
          size="xs" fw={600} ta={alignRight ? 'right' : 'left'}
          style={{ paddingLeft: alignRight ? 0 : 22, paddingRight: alignRight ? 22 : 0 }}
        >
          {p.army || 'Unbekannt'}
        </Text>
      </Stack>
    );
  };

  return (
    <Card 
      shadow="sm" padding="lg" radius="md" withBorder
      style={{ 
        backgroundColor: '#101113', 
        borderColor: !isApproved ? '#f59f00' : (isMatched ? '#354b60' : '#e0282b'),
        opacity: isMatched ? 0.85 : 1,
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <Badge color={isMatched ? "gray" : "red"} variant="filled" size="lg" style={{ fontFamily: 'Impact', letterSpacing: '0.05em' }}>
              {isMatched ? "MATCHED (LOCK)" : "OFFENE HERAUSFORDERUNG"}
            </Badge>
          </Group>
          <Group gap="xs" c="gray.4">
            <IconClock size={16} />
            <Text size="sm" fw={700}>
              {gameDate.toLocaleDateString('de-DE')} • {gameDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </Text>
          </Group>
        </Group>

        <Text fw={700} size="xl" c="white" style={{ fontFamily: 'Impact', letterSpacing: '0.05em' }}>
          {game.system}
        </Text>
      </Stack>

      <Stack gap="xs" my="md">
        <Divider color="#354b60" mb={5} />
        <Box p="sm" style={{ backgroundColor: '#16181d', borderRadius: '8px', border: '1px solid #252830' }}>
          <Grid align="center" gap="xs">
            <Grid.Col span={5}>
              <Stack gap="sm">
                <Text c="gray.5" fw={800} size="xs" style={{ letterSpacing: '0.08em' }}>TEAM 1</Text>
                {team1Players.map(p => renderPlayerSlot(p, false))}
              </Stack>
            </Grid.Col>
            <Grid.Col span={2}>
              <Stack align="center" justify="center" gap={2}>
                <IconSwords size={22} color="#e0282b" />
                <Text c="#e0282b" style={{ fontFamily: 'Impact', fontSize: '1.35rem' }}>VS</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={5}>
              <Stack gap="sm" align="flex-end">
                <Text c="gray.5" fw={800} size="xs" ta="right" style={{ letterSpacing: '0.08em' }}>TEAM 2</Text>
                {team2Players.map(p => renderPlayerSlot(p, true))}
              </Stack>
            </Grid.Col>
          </Grid>
        </Box>
      </Stack>

      {isAuthenticated && (
        <Stack gap="xs" mt="auto">
          {!isMatched && !userIsInGame && onJoinClick && (
            <Button fullWidth color="red" leftSection={<IconSwords size={18} />} onClick={() => onJoinClick(game.id)}>
              HERAUSFORDERUNG ANNEHMEN
            </Button>
          )}
          {userIsInGame && !isCreator && onLeaveClick && (
            <Button fullWidth variant="outline" color="gray" onClick={() => onLeaveClick(game.id)}>
              MATCH VERLASSEN
            </Button>
          )}
          {isCreator && onDeleteClick && (
            <Button fullWidth variant="outline" color="red" onClick={() => onDeleteClick(game.id)}>
              HERAUSFORDERUNG LÖSCHEN
            </Button>
          )}
        </Stack>
      )}
    </Card>
  );
}