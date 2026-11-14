'use client';

import { Paper, Table, Badge, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';

export interface UITournamentStanding {
  userId?: number;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalScore: number;
  isDisqualified?: boolean;
}

export interface TournamentStandingsTableProps {
  standings: UITournamentStanding[];
}

export function TournamentStandingsTable({ standings }: TournamentStandingsTableProps) {
  const t = useTranslations();
  const tr = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  return (
    <Paper p="md" radius="md" className="gts-army-panel">
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
              <Table.Th style={{ width: 70 }} ta="center">
                {tr('Tournament.rank', 'RANG')}
              </Table.Th>
              <Table.Th>{tr('Tournament.player', 'SPIELER')}</Table.Th>
              <Table.Th ta="center">{tr('Tournament.status', 'STATUS')}</Table.Th>
              <Table.Th ta="center">{tr('Tournament.wins', 'SIEGE')}</Table.Th>
              <Table.Th ta="center">{tr('Tournament.draws', 'REMIS')}</Table.Th>
              <Table.Th ta="center">{tr('Tournament.losses', 'NIEDERL.')}</Table.Th>
              <Table.Th ta="right">{tr('Tournament.totalScore', 'GESAMTPUNKTE')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {standings.map((st, idx) => (
              <Table.Tr
                key={st.userId ?? `${st.name}-${idx}`}
                style={{ opacity: st.isDisqualified ? 0.55 : 1 }}
              >
                <Table.Td fw={700} ta="center" className="brand-logo">
                  #{idx + 1}
                </Table.Td>
                <Table.Td fw={700} td={st.isDisqualified ? 'line-through' : undefined}>
                  {st.name}
                </Table.Td>
                <Table.Td ta="center">
                  {st.isDisqualified ? (
                    <Badge color="red" size="xs" variant="filled">
                      {tr('Tournament.disqualified', 'DISQUALIFIZIERT')}
                    </Badge>
                  ) : (
                    <Badge color="teal" size="xs" variant="light">
                      {tr('Tournament.active', 'AKTIV')}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td ta="center" fw={700} c="teal.4">
                  {st.wins}
                </Table.Td>
                <Table.Td ta="center" c="dimmed">
                  {st.draws}
                </Table.Td>
                <Table.Td ta="center" fw={700} c="red.4">
                  {st.losses}
                </Table.Td>
                <Table.Td ta="right" className="gts-army-points-cell">
                  {st.totalScore}
                </Table.Td>
              </Table.Tr>
            ))}
            {standings.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center" c="dimmed" py="xl">
                  {tr('Tournament.noStandings', 'Keine Rangliste verfügbar.')}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}