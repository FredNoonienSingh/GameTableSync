'use client';

import { Box, Text, Group, Badge, Stack, HoverCard } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconSwords, IconTrophy, IconBan } from '@tabler/icons-react';
import { ProfileSmall, type ProfileSmallProps } from '../player/ProfileSmall';

export interface BracketParticipant {
  id: string | number | null;
  name: string;
  score: string | null;
  isWinner: boolean;
  profile?: ProfileSmallProps['player'] | null;
}

export interface BracketMatch {
  id: string;
  status: 'open' | 'finished' | 'canceled';
  top: BracketParticipant;
  bottom: BracketParticipant;
}

export interface BracketRound {
  id: string;
  title: string;
  matches: BracketMatch[];
}

export interface TournamentBracketProps {
  rounds: BracketRound[];
}

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const matchVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

export function TournamentBracketGraphic({ rounds }: TournamentBracketProps) {
  return (
    <Box className="gts-graphic-scope gts-bracket-viewport">
      <motion.div
        className="gts-bracket-container"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {rounds.map((round, roundIndex) => (
          <div key={round.id} className="gts-bracket-column">
            {/* Round Title Header */}
            <div className="gts-bracket-round-header">
              <Text className="gts-bracket-round-title">{round.title}</Text>
            </div>

            {/* Matches for this round */}
            <div className="gts-bracket-matches">
              {round.matches.map((match) => (
                <BracketMatchCard key={match.id} match={match} />
              ))}
            </div>

            {/* Tactical Data Bus Line (Connects to next round, hidden on last round) */}
            {roundIndex < rounds.length - 1 && <div className="gts-bracket-bus-line" />}
          </div>
        ))}
      </motion.div>
    </Box>
  );
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const isFinished = match.status === 'finished';
  const isCanceled = match.status === 'canceled';

  let statusBadge;
  if (isFinished) {
    statusBadge = (
      <Badge size="xs" variant="outline" className="gts-bracket-badge gts-badge-finished">
        RESOLVED
      </Badge>
    );
  } else if (isCanceled) {
    statusBadge = (
      <Badge size="xs" variant="outline" className="gts-bracket-badge gts-badge-canceled">
        <Group gap={4}>
          <IconBan size={10} /> CANCELED
        </Group>
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge size="xs" variant="outline" className="gts-bracket-badge gts-badge-open">
        <Group gap={4}>
          <IconSwords size={10} className="gts-spin-slow" /> ACTIVE
        </Group>
      </Badge>
    );
  }

  return (
    <motion.div variants={matchVariants} className="gts-bracket-match-node">
      <div className="gts-bracket-match-card" data-status={match.status}>
        {/* Header */}
        <Group justify="space-between" className="gts-bracket-match-header">
          <Text className="gts-bracket-match-id">MATCH {match.id}</Text>
          {statusBadge}
        </Group>

        {/* Players / Teams */}
        <Stack gap={0} className="gts-bracket-match-body">
          <PlayerRow participant={match.top} isFinished={isFinished} />
          <div className="gts-bracket-divider" />
          <PlayerRow participant={match.bottom} isFinished={isFinished} />
        </Stack>
      </div>
    </motion.div>
  );
}

function PlayerRow({ participant, isFinished }: { participant: BracketParticipant; isFinished: boolean }) {
  const isTBD = !participant.id && (!participant.name || participant.name === 'TBD' || participant.name === 'OFFENER SLOT');
  const showWinnerState = isFinished && participant.isWinner;
  const showLoserState = isFinished && !participant.isWinner && !isTBD;

  const nameNode = (
    <Text
      truncate
      className={isTBD ? 'gts-bracket-player-name' : 'gts-bracket-player-name gts-hover-target'}
    >
      {isTBD ? 'TBD' : participant.name}
    </Text>
  );

  return (
    <Group
      wrap="nowrap"
      justify="space-between"
      className="gts-bracket-player-row"
      data-winner={showWinnerState ? 'true' : undefined}
      data-loser={showLoserState ? 'true' : undefined}
      data-tbd={isTBD ? 'true' : undefined}
    >
      <Group gap={8} wrap="nowrap" className="gts-overflow-hidden">
        {showWinnerState && <IconTrophy size={14} className="gts-bracket-winner-icon" />}
        {!isTBD ? (
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
      </Group>

      {participant.score !== null && (
        <div className="gts-bracket-score-pill">
          {participant.score}
        </div>
      )}
    </Group>
  );
}