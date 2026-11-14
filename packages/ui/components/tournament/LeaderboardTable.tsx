'use client';

import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Tabs,
  Table,
  Badge,
  Tooltip,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import { IconTrophy, IconMedal, IconSwords, IconUserOff } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export interface UIPodiumCounts {
  first: number;
  second: number;
  third: number;
}

export interface UILeaderboardPlayer {
  user_id: number;
  rank: number;
  display_name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  podiums: UIPodiumCounts;
}

export interface UILeaderboardSystemBoard {
  ranked: UILeaderboardPlayer[];
  unranked?: { user_id: number; display_name: string; podiums: UIPodiumCounts }[];
}

export interface LeaderboardTableProps {
  data: Record<string, UILeaderboardSystemBoard>;
  systems?: string[];
}

export function PodiumIcons({ podiums }: { podiums: UIPodiumCounts }) {
  return (
    <Group gap={4} wrap="nowrap">
      {Array.from({ length: podiums.first }).map((_, i) => (
        <Tooltip key={`1st-${i}`} label="1. Platz" withArrow>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <IconTrophy size={16} className="gts-podium-gold" />
          </span>
        </Tooltip>
      ))}
      {Array.from({ length: podiums.second }).map((_, i) => (
        <Tooltip key={`2nd-${i}`} label="2. Platz" withArrow>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <IconMedal size={16} className="gts-podium-silver" />
          </span>
        </Tooltip>
      ))}
      {Array.from({ length: podiums.third }).map((_, i) => (
        <Tooltip key={`3rd-${i}`} label="3. Platz" withArrow>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <IconMedal size={16} className="gts-podium-bronze" />
          </span>
        </Tooltip>
      ))}
    </Group>
  );
}

export function LeaderboardTable({ data, systems }: LeaderboardTableProps) {
  const t = useTranslations();
  const tr = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  const systemKeys = systems ?? Object.keys(data);
  if (systemKeys.length === 0) return null;

  return (
    <Paper p="xl" radius="md" className="gts-army-panel">
      <Group mb="xs" gap="sm">
        <IconTrophy size={28} color="var(--gts-accent)" />
        <Title order={3} className="brand-logo gts-army-title">
          {tr('Leaderboard.title', 'RANGLISTE // LEADERBOARD')}
        </Title>
      </Group>
      <Text size="sm" mb="lg" style={{ color: 'var(--gts-text-secondary)' }}>
        {tr(
          'Leaderboard.subtitle',
          'Offizielles Turnier-Ranking nach Spielsystem (gewichtet nach Turnierspielen & Leistung).'
        )}
      </Text>

      <Tabs color="brandBlue.5" defaultValue={systemKeys[0]}>
        <Tabs.List mb="lg" style={{ flexWrap: 'wrap' }}>
          {systemKeys.map((sys) => {
            const rankedCount = data[sys]?.ranked.length || 0;
            return (
              <Tabs.Tab
                key={sys}
                value={sys}
                leftSection={<IconSwords size={15} />}
                className="brand-logo"
                style={{ fontSize: '0.75rem' }}
              >
                {sys} ({rankedCount})
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {systemKeys.map((sys) => {
          const board = data[sys] || { ranked: [], unranked: [] };
          const unrankedList = board.unranked || [];

          return (
            <Tabs.Panel key={sys} value={sys}>
              <Stack gap="lg">
                <Table.ScrollContainer minWidth={560}>
                  <Table
                    withRowBorders
                    classNames={{
                      thead: 'gts-army-table-head',
                      th: 'gts-army-table-th',
                      td: 'gts-army-table-td',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: 80 }} ta="center">
                          {tr('Leaderboard.rank', 'RANG')}
                        </Table.Th>
                        <Table.Th>{tr('Leaderboard.player', 'SPIELER & ERFOLGE')}</Table.Th>
                        <Table.Th ta="center" style={{ width: 160 }}>
                          {tr('Leaderboard.matches', 'TURNIERSPIELE')}
                        </Table.Th>
                        <Table.Th ta="center" style={{ width: 180 }}>
                          {tr('Leaderboard.record', 'BILANZ (S / U / N)')}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {board.ranked.map((player) => (
                        <Table.Tr key={player.user_id}>
                          <Table.Td ta="center">
                            <Badge
                              size="md"
                              variant={player.rank <= 3 ? 'filled' : 'outline'}
                              color={
                                player.rank === 1
                                  ? 'yellow'
                                  : player.rank === 2
                                    ? 'gray'
                                    : player.rank === 3
                                      ? 'orange'
                                      : 'brandBlue.5'
                              }
                              className="brand-logo"
                            >
                              #{player.rank}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Text fw={700} size="sm">
                                {player.display_name}
                              </Text>
                              <PodiumIcons podiums={player.podiums} />
                            </Group>
                          </Table.Td>
                          <Table.Td ta="center" fw={700} className="brand-logo">
                            {player.matches_played}
                          </Table.Td>
                          <Table.Td ta="center">
                            <Group gap={6} justify="center" wrap="nowrap">
                              <Text span fw={700} c="teal.4">
                                {player.wins}
                              </Text>
                              <Text span c="dimmed">
                                /
                              </Text>
                              <Text span fw={700} c="dimmed">
                                {player.draws}
                              </Text>
                              <Text span c="dimmed">
                                /
                              </Text>
                              <Text span fw={700} c="red.4">
                                {player.losses}
                              </Text>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      {board.ranked.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={4} ta="center" c="dimmed" py="xl">
                            {tr('Leaderboard.empty', 'Noch keine gewerteten Turnierspiele.')}
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>

                {unrankedList.length > 0 && (
                  <>
                    <Divider color="var(--gts-border-faint)" />
                    <div>
                      <Group gap="xs" mb="sm">
                        <IconUserOff size={16} color="var(--gts-text-muted)" />
                        <Text size="xs" fw={700} className="brand-logo" c="dimmed">
                          {tr('Leaderboard.unranked', 'UNRANKED')} ({unrankedList.length})
                        </Text>
                      </Group>
                      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                        {unrankedList.map((u) => (
                          <Paper key={u.user_id} px="sm" py="xs" className="gts-unranked-pill">
                            <Group justify="space-between" wrap="nowrap">
                              <Text size="xs" fw={600} truncate>
                                {u.display_name}
                              </Text>
                              <PodiumIcons podiums={u.podiums} />
                            </Group>
                          </Paper>
                        ))}
                      </SimpleGrid>
                    </div>
                  </>
                )}
              </Stack>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Paper>
  );
}