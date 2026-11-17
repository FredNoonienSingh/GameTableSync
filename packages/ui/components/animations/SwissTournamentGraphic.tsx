'use client';

import { Box, Text, Group, Badge, Stack, Paper, HoverCard } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconSwords, IconTrophy, IconBan, IconMapPin } from '@tabler/icons-react';
import { ProfileSmall, type ProfileSmallProps } from '../player/ProfileSmall';

export interface SwissParticipant {
  id: string | number | null;
  name: string;
  score: string | null;
  isWinner: boolean;
  /** e.g., "1-0", "2-1-0" or "45 VP" - helps show why they are paired */
  record?: string;
  profile?: ProfileSmallProps['player'] | null;
}

export interface SwissMatch {
  id: string;
  tableNumber?: string | number;
  status: 'open' | 'finished' | 'canceled';
  top: SwissParticipant;
  bottom: SwissParticipant;
}

export interface SwissRound {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'pending';
  matches: SwissMatch[];
}

export interface SwissTournamentProps {
  rounds: SwissRound[];
}

// Framer Motion Variants
const trackVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 250, damping: 24, staggerChildren: 0.1 },
  },
};

const matchVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function SwissTournamentGraphic({ rounds }: SwissTournamentProps) {
  return (
    <Box className="gts-graphic-scope gts-swiss-viewport">
      <motion.div
        className="gts-swiss-track"
        variants={trackVariants}
        initial="hidden"
        animate="show"
      >
        {rounds.map((round) => (
          <motion.div key={round.id} variants={columnVariants} className="gts-swiss-column">
            <RoundHeader round={round} />
            <div className="gts-swiss-matches">
              {round.matches.length > 0 ? (
                round.matches.map((match) => <SwissMatchCard key={match.id} match={match} />)
              ) : (
                <div className="gts-swiss-empty-state">
                  <Text size="sm" className="gts-text-muted">PAIRINGS PENDING</Text>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
}

function RoundHeader({ round }: { round: SwissRound }) {
  return (
    <Paper className="gts-swiss-round-header" data-status={round.status}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text className="gts-swiss-round-title">{round.title}</Text>
        <div className="gts-swiss-round-indicator" />
      </Group>
    </Paper>
  );
}

function SwissMatchCard({ match }: { match: SwissMatch }) {
  const isFinished = match.status === 'finished';
  const isCanceled = match.status === 'canceled';

  let statusBadge;
  if (isFinished) {
    statusBadge = (
      <Badge size="xs" variant="outline" className="gts-swiss-badge gts-badge-finished">
        RESOLVED
      </Badge>
    );
  } else if (isCanceled) {
    statusBadge = (
      <Badge size="xs" variant="outline" className="gts-swiss-badge gts-badge-canceled">
        CANCELED
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge size="xs" variant="outline" className="gts-swiss-badge gts-badge-open">
        <Group gap={4}>
          <IconSwords size={10} className="gts-spin-slow" /> ACTIVE
        </Group>
      </Badge>
    );
  }

  return (
    <motion.div variants={matchVariants} className="gts-swiss-match-card" data-status={match.status}>
      {/* Header */}
      <Group justify="space-between" className="gts-swiss-match-header" wrap="nowrap">
        <Group gap={6} wrap="nowrap">
          {match.tableNumber && (
            <Badge size="xs" radius="sm" className="gts-swiss-table-badge">
              <Group gap={3} wrap="nowrap">
                <IconMapPin size={9} /> {match.tableNumber}
              </Group>
            </Badge>
          )}
          <Text className="gts-swiss-match-id">MATCH {match.id}</Text>
        </Group>
        {statusBadge}
      </Group>

      {/* Players */}
      <Stack gap={0} className="gts-swiss-match-body">
        <PlayerRow participant={match.top} isFinished={isFinished} />
        <div className="gts-swiss-divider" />
        <PlayerRow participant={match.bottom} isFinished={isFinished} />
      </Stack>
    </motion.div>
  );
}

function PlayerRow({ participant, isFinished }: { participant: SwissParticipant; isFinished: boolean }) {
  const upperName = (participant.name || '').toUpperCase();
  const isBye = upperName === 'BYE' || upperName === 'TBD' || upperName === 'OFFENER SLOT';
  const showWinnerState = isFinished && participant.isWinner;
  const showLoserState = isFinished && !participant.isWinner && !isBye;

  const nameNode = (
    <Text
      truncate
      className={isBye ? 'gts-swiss-player-name' : 'gts-swiss-player-name gts-hover-target'}
    >
      {participant.name}
    </Text>
  );

  return (
    <Group
      wrap="nowrap"
      justify="space-between"
      className="gts-swiss-player-row"
      data-winner={showWinnerState ? 'true' : undefined}
      data-loser={showLoserState ? 'true' : undefined}
      data-bye={isBye ? 'true' : undefined}
    >
      <Group gap={8} wrap="nowrap" className="gts-overflow-hidden">
        {showWinnerState && <IconTrophy size={14} className="gts-swiss-winner-icon" />}
        {!isBye ? (
          <HoverCard width={270} shadow="lg" withArrow openDelay={120} closeDelay={80} position="top-start" withinPortal classNames={{ arrow: 'gts-hovercard-arrow' }}>
            <HoverCard.Target>{nameNode}</HoverCard.Target>
            <HoverCard.Dropdown className="gts-hovercard-dropdown">
              <ProfileSmall
                player={
                  participant.profile || {
                    DisplayName: participant.name,
                  }
                }
              />
            </HoverCard.Dropdown>
          </HoverCard>
        ) : (
          nameNode
        )}
        {participant.record && (
          <Text className="gts-swiss-player-record">({participant.record})</Text>
        )}
      </Group>

      {participant.score !== null && (
        <div className="gts-swiss-score-pill">
          {participant.score}
        </div>
      )}
    </Group>
  );
}