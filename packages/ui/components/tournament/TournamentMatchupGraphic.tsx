'use client';

import { Box, Group, Paper, Stack, Text, Badge, Button } from '@mantine/core';
import { IconClock, IconFileCode } from '@tabler/icons-react';
import { useTranslations, useLocale } from 'next-intl';

export interface UITournamentParticipant {
  id?: number;
  user_id: number;
  display_name: string;
  army_list_id?: number | null;
  army_list_name?: string | null;
  is_disqualified?: boolean;
}

export interface UITournamentMatch {
  id: number | string;
  round_number: number;
  player1_id: number | null;
  player1_name: string | null;
  player2_id: number | null;
  player2_name: string | null;
  score_player1: number | null;
  score_player2: number | null;
  winner_id: number | null;
  hand_in_by?: string | null;
  status: string;
}

export interface TournamentMatchupGraphicProps {
  maxPlayers: number;
  participants?: UITournamentParticipant[];
  matches?: UITournamentMatch[];
  roundNumber?: number;
  compact?: boolean;
  onInspectArmyList?: (armyListId: number) => void;
}

interface SlotPair {
  id: string | number;
  p1Name: string | null;
  p2Name: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  p1Id: number | null;
  p2Id: number | null;
  p1ArmyId: number | null;
  p1ArmyName: string | null;
  p2ArmyId: number | null;
  p2ArmyName: string | null;
  p1Disqualified?: boolean;
  p2Disqualified?: boolean;
  handInBy: string | null;
}

export function TournamentMatchupGraphic({
  maxPlayers,
  participants = [],
  matches = [],
  roundNumber,
  compact = false,
  onInspectArmyList,
}: TournamentMatchupGraphicProps) {
  const t = useTranslations();
  const locale = useLocale();
  const tr = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  const totalMatchSlots = Math.max(1, Math.ceil(maxPlayers / 2));
  const targetRound =
    roundNumber ??
    (matches.length > 0 ? Math.max(...matches.map((m) => m.round_number)) : 1);

  const roundMatches = matches.filter((m) => m.round_number === targetRound);
  const participantMap = new Map<number, UITournamentParticipant>();
  participants.forEach((p) => participantMap.set(p.user_id, p));

  const pairs: SlotPair[] = [];

  for (let i = 0; i < totalMatchSlots; i++) {
    if (roundMatches.length > 0) {
      const m = roundMatches[i];
      if (m) {
        const p1Part = m.player1_id ? participantMap.get(m.player1_id) : undefined;
        const p2Part = m.player2_id ? participantMap.get(m.player2_id) : undefined;

        pairs.push({
          id: m.id,
          p1Name: m.player1_name,
          p2Name: m.player2_name,
          score1: m.score_player1,
          score2: m.score_player2,
          winnerId: m.winner_id,
          p1Id: m.player1_id,
          p2Id: m.player2_id,
          p1ArmyId: p1Part?.army_list_id ?? null,
          p1ArmyName: p1Part?.army_list_name ?? null,
          p2ArmyId: p2Part?.army_list_id ?? null,
          p2ArmyName: p2Part?.army_list_name ?? null,
          p1Disqualified: p1Part?.is_disqualified,
          p2Disqualified: p2Part?.is_disqualified,
          handInBy: m.hand_in_by ?? null,
        });
      } else {
        pairs.push({
          id: `empty-match-${i}`,
          p1Name: null,
          p2Name: null,
          score1: null,
          score2: null,
          winnerId: null,
          p1Id: null,
          p2Id: null,
          p1ArmyId: null,
          p1ArmyName: null,
          p2ArmyId: null,
          p2ArmyName: null,
          handInBy: null,
        });
      }
    } else {
      const p1 = participants[i * 2] || null;
      const p2 = participants[i * 2 + 1] || null;
      pairs.push({
        id: `seed-slot-${i}`,
        p1Name: p1 ? p1.display_name : null,
        p2Name: p2 ? p2.display_name : null,
        score1: null,
        score2: null,
        winnerId: null,
        p1Id: p1 ? p1.user_id : null,
        p2Id: p2 ? p2.user_id : null,
        p1ArmyId: p1?.army_list_id ?? null,
        p1ArmyName: p1?.army_list_name ?? null,
        p2ArmyId: p2?.army_list_id ?? null,
        p2ArmyName: p2?.army_list_name ?? null,
        p1Disqualified: p1?.is_disqualified,
        p2Disqualified: p2?.is_disqualified,
        handInBy: null,
      });
    }
  }

  const renderSlotRow = (
    name: string | null,
    score: number | null,
    isWinner: boolean,
    armyId: number | null,
    armyName: string | null,
    isDisqualified?: boolean
  ) => (
    <Group
      justify="space-between"
      px={compact ? 10 : 12}
      py={compact ? 6 : 8}
      wrap="nowrap"
      className="gts-matchup-slot-row"
      data-occupied={name ? 'true' : undefined}
      data-winner={isWinner ? 'true' : undefined}
      data-dq={isDisqualified ? 'true' : undefined}
      style={{ minHeight: compact ? 32 : 38 }}
    >
      <Group gap={8} wrap="nowrap" style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
        <Text
          size={compact ? 'xs' : 'sm'}
          fw={name ? 700 : 500}
          c={isDisqualified ? 'red.5' : isWinner ? 'teal.4' : name ? undefined : 'dimmed'}
          td={isDisqualified ? 'line-through' : undefined}
          truncate
        >
          {name || tr('Tournament.openSlot', 'OFFENER SLOT')}
        </Text>

        {isDisqualified && (
          <Badge color="red" size="xs" variant="filled">
            DQ
          </Badge>
        )}

        {armyId && (
          <Button
            size="compact-xs"
            variant="light"
            color="brandBlue.5"
            leftSection={<IconFileCode size={12} />}
            onClick={(e) => {
              e.stopPropagation();
              onInspectArmyList?.(armyId);
            }}
            style={{ flexShrink: 0 }}
          >
            {armyName || tr('Tournament.list', 'Liste')}
          </Button>
        )}
      </Group>

      <Text
        size={compact ? 'xs' : 'sm'}
        fw={800}
        className="brand-logo"
        c={score !== null ? 'var(--gts-accent)' : 'dimmed'}
        style={{ flexShrink: 0 }}
      >
        {score !== null ? score : '—'}
      </Text>
    </Group>
  );

  return (
    <Box className="gts-matchup-grid" data-compact={compact ? 'true' : undefined}>
      {pairs.map((pair, idx) => (
        <Paper key={pair.id} className="gts-matchup-pair-card">
          <Group
            justify="space-between"
            px={compact ? 8 : 10}
            py={compact ? 4 : 6}
            className="gts-matchup-pair-header"
          >
            <Text size="10px" fw={700} className="brand-logo" c="dimmed">
              {tr('Tournament.match', 'MATCH')} #{idx + 1}
            </Text>

            {pair.handInBy && (
              <Group gap={4}>
                <IconClock size={12} color="var(--gts-accent)" />
                <Text size="10px" fw={700} style={{ color: 'var(--gts-accent)' }}>
                  {new Date(pair.handInBy).toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Group>
            )}
          </Group>

          <Stack gap={0}>
            {renderSlotRow(
              pair.p1Name,
              pair.score1,
              Boolean(pair.winnerId && pair.winnerId === pair.p1Id),
              pair.p1ArmyId,
              pair.p1ArmyName,
              pair.p1Disqualified
            )}

            <Box className="gts-matchup-vs-divider">
              <Text size="9px" fw={800} className="brand-logo" style={{ color: 'var(--gts-primary)' }}>
                VS
              </Text>
            </Box>

            {renderSlotRow(
              pair.p2Name,
              pair.score2,
              Boolean(pair.winnerId && pair.winnerId === pair.p2Id),
              pair.p2ArmyId,
              pair.p2ArmyName,
              pair.p2Disqualified
            )}
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}