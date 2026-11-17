'use client';

import React from 'react';
import { Box, Group, Text, Avatar, Stack, Badge, Divider } from '@mantine/core';
import { IconBrandDiscord, IconMapPin } from '@tabler/icons-react';
import { Player } from './interfaces';

export interface ProfileSmallProps {
  player: Partial<Player> & {
    username?: string;
    real_name?: string | null;
    city_or_zip?: string | null;
    bio?: string | null;
    discord_account?: string | null;
  };
}

export function ProfileSmall({ player }: ProfileSmallProps) {
  const displayName = player.DisplayName || player.username || 'Kommandant';
  const rawAvatar = player.Avatar as unknown;
  const avatarUrl =
    typeof rawAvatar === 'string'
      ? rawAvatar
      : (rawAvatar as { url?: string; src?: string } | null | undefined)?.url ||
        (rawAvatar as { src?: string } | null | undefined)?.src ||
        null;

  return (
    <Box className="gts-profile-small-box">
      <Stack gap="sm">
        <Group wrap="nowrap" gap="sm">
          <Avatar
            src={avatarUrl}
            alt={displayName}
            size={48}
            radius="md"
            className="gts-profile-small-avatar"
          >
            {displayName.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box className="gts-flex-1">
            <Text fw={700} size="sm" truncate="end" className="brand-logo gts-profile-small-name">
              {displayName}
            </Text>
            {player.city_or_zip && (
              <Group gap={4} mt={2} wrap="nowrap">
                <IconMapPin size={12} className="gts-profile-small-icon" />
                <Text size="xs" truncate="end" className="gts-text-muted">
                  {player.city_or_zip}
                </Text>
              </Group>
            )}
          </Box>
        </Group>

        {player.bio && (
          <Text size="xs" className="gts-text-description" lineClamp={3}>
            &ldquo;{player.bio}&rdquo;
          </Text>
        )}

        {(player.discord_account || player.DiscordID) && (
          <>
            <Divider className="gts-profile-small-divider" my={2} />
            <Group gap={6}>
              <IconBrandDiscord size={14} className="gts-profile-small-discord gts-shrink-0" />
              <Text size="xs" className="gts-profile-small-discord">
                @{player.discord_account || 'discord_user'}
              </Text>
            </Group>
          </>
        )}
      </Stack>
    </Box>
  );
}