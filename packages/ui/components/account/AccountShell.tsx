'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Group,
  Stack,
  Text,
  NavLink,
  Avatar,
  Paper,
  Divider,
  Badge,
  Burger,
  Drawer,
  Button,
} from '@mantine/core';
import {
  IconUser,
  IconUsersGroup,
  IconTrophy,
  IconRadar2,
  IconStack2,
  IconSwords,
  IconCards,
  IconDice2,
  IconSettings,
  IconLogout,
  IconBrandDiscord,
} from '@tabler/icons-react';

export interface AccountShellLabels {
  title: string;
  overview: string;
  clubs: string;
  tournaments: string;
  games: string;
  systems: string;
  systemsWargaming: string;
  systemsTcg: string;
  systemsRpg: string;
  settings: string;
  logout: string;
  discordVerified: string;
  adminBadge: string;
  mobileMenuButton: string;
}

export interface AccountShellUser {
  id?: string | number;
  username: string;
  email: string;
  discord_account?: string | null;
  discord_id?: string | null;
  avatar_url?: string | null;
  isAdmin?: boolean;
}

export interface AccountShellProps {
  locale: string;
  activePath: string;
  user?: AccountShellUser | null;
  labels: AccountShellLabels;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function AccountShell({
  locale,
  activePath,
  user,
  labels,
  onLogout,
  children,
}: AccountShellProps) {
  const [mobileOpened, setMobileOpened] = useState(false);

  const basePath = `/${locale}/account`;
  const p = (subpath: string) => (subpath ? `${basePath}/${subpath}` : basePath);

  const cleanActive = activePath.replace(/\/$/, '');
  const isRouteActive = (target: string) => cleanActive === target.replace(/\/$/, '');
  const isSystemsOpen = cleanActive.includes(`${basePath}/systems`);

  const closeMobile = () => setMobileOpened(false);

  const renderSidebarContent = () => (
    <Stack justify="space-between" h="100%" gap="md">
      <Stack gap="xs">
        {/* User Profile Summary Card */}
        <Paper
          p="sm"
          radius="md"
          withBorder
          className="gts-panel-summary"
        >
          <Group wrap="nowrap" gap="sm">
            <Avatar
              src={user?.avatar_url || null}
              alt={user?.username || 'Player'}
              radius="md"
              size="md"
              className="gts-logo-fallback"
            >
              {(user?.username || 'P').slice(0, 2).toUpperCase()}
            </Avatar>
            <Box className="gts-flex-1">
              <Group gap={6} wrap="nowrap">
                <Text fw={700} size="sm" truncate="end" className="gts-text-heading">
                  {user?.username || 'Kommandant'}
                </Text>
                {user?.isAdmin && (
                  <Badge size="xs" variant="outline" className="gts-status-badge" data-tone="warning">
                    {labels.adminBadge}
                  </Badge>
                )}
              </Group>
              <Text size="xs" truncate="end" className="gts-text-muted">
                {user?.email || ''}
              </Text>
              {(user?.discord_id || user?.discord_account) && (
                <Group gap={4} mt={4} wrap="nowrap">
                  <IconBrandDiscord size={13} className="gts-profile-small-discord gts-shrink-0" />
                  <Text size="xs" truncate="end" className="gts-profile-small-discord">
                    {user.discord_account || labels.discordVerified}
                  </Text>
                </Group>
              )}
            </Box>
          </Group>
        </Paper>

        <Divider my={4} className="gts-divider" />

        {/* Sidebar Navigation Links */}
        <NavLink
          component={Link}
          href={p('')}
          label={labels.overview}
          leftSection={<IconUser size={18} />}
          active={isRouteActive(p(''))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <NavLink
          component={Link}
          href={p('clubs')}
          label={labels.clubs}
          leftSection={<IconUsersGroup size={18} />}
          active={isRouteActive(p('clubs'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <NavLink
          component={Link}
          href={p('tournaments')}
          label={labels.tournaments}
          leftSection={<IconTrophy size={18} />}
          active={isRouteActive(p('tournaments'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <NavLink
          component={Link}
          href={p('games')}
          label={labels.games}
          leftSection={<IconRadar2 size={18} />}
          active={isRouteActive(p('games'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        {/* Systems Split: Wargaming, TCG, RPG */}
        <NavLink
          label={labels.systems}
          leftSection={<IconStack2 size={18} />}
          childrenOffset={24}
          defaultOpened={isSystemsOpen || true}
          variant="light"
          className="gts-shell-navlink"
        >
          <NavLink
            component={Link}
            href={p('systems/wargaming')}
            label={labels.systemsWargaming}
            leftSection={<IconSwords size={16} className="gts-shell-system-icon" data-system="wargaming" />}
            active={isRouteActive(p('systems/wargaming'))}
            onClick={closeMobile}
            variant="light"
            className="gts-shell-navlink"
          />
          <NavLink
            component={Link}
            href={p('systems/tcg')}
            label={labels.systemsTcg}
            leftSection={<IconCards size={16} className="gts-shell-system-icon" data-system="tcg" />}
            active={isRouteActive(p('systems/tcg'))}
            onClick={closeMobile}
            variant="light"
            className="gts-shell-navlink"
          />
          <NavLink
            component={Link}
            href={p('systems/rpg')}
            label={labels.systemsRpg}
            leftSection={<IconDice2 size={16} className="gts-shell-system-icon" data-system="rpg" />}
            active={isRouteActive(p('systems/rpg'))}
            onClick={closeMobile}
            variant="light"
            className="gts-shell-navlink"
          />
        </NavLink>

        <Divider my={4} className="gts-divider" />

        <NavLink
          component={Link}
          href={p('settings')}
          label={labels.settings}
          leftSection={<IconSettings size={18} />}
          active={isRouteActive(p('settings'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />
      </Stack>

      {onLogout && (
        <Button
          variant="default"
          className="gts-btn-danger"
          fullWidth
          leftSection={<IconLogout size={16} />}
          onClick={() => {
            closeMobile();
            onLogout();
          }}
        >
          {labels.logout}
        </Button>
      )}
    </Stack>
  );

  return (
    <Box className="gts-account-shell">
      {/* Mobile Sub-Header Bar for Account Drawer */}
      <Box
        hiddenFrom="md"
        px="md"
        py="xs"
        className="gts-account-mobile-bar"
      >
        <Group justify="space-between">
          <Text fw={700} size="sm" className="brand-logo">
            {labels.title}
          </Text>
          <Button
            variant="default"
            size="xs"
            className="gts-btn-ghost"
            leftSection={
              <Burger
                component="span"
                opened={mobileOpened}
                size="xs"
                className="gts-shell-burger"
              />
            }
            onClick={() => setMobileOpened((o) => !o)}
          >
            {labels.mobileMenuButton}
          </Button>
        </Group>
      </Box>

      {/* Main Split Layout */}
      <Box className="gts-account-split-layout">
        {/* Desktop Sidebar */}
        <Box
          component="aside"
          visibleFrom="md"
          p="md"
          className="gts-account-sidebar"
        >
          {renderSidebarContent()}
        </Box>

        {/* Subpage Content Area */}
        <Box component="main" p={{ base: 'md', md: 'xl' }} className="gts-account-main-content">
          {children}
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        opened={mobileOpened}
        onClose={closeMobile}
        title={
          <Text className="brand-logo" fw={700} size="sm">
            {labels.title}
          </Text>
        }
        position="left"
        size="280px"
        padding="md"
        hiddenFrom="md"
        zIndex={1000}
        classNames={{
          content: 'gts-modal-content',
          header: 'gts-modal-header',
          title: 'gts-modal-title',
          close: 'gts-modal-close',
        }}
      >
        {renderSidebarContent()}
      </Drawer>
    </Box>
  );
}