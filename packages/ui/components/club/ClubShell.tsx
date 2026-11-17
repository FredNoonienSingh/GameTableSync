'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Group,
  Stack,
  Text,
  NavLink,
  Paper,
  Divider,
  Badge,
  Burger,
  Drawer,
  Button,
  Select,
  ThemeIcon,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconLayoutGrid,
  IconWorld,
  IconCalendarEvent,
  IconTrophy,
  IconPhoto,
  IconBan,
  IconUsers,
  IconCreditCard,
  IconLogout,
} from '@tabler/icons-react';

export interface ClubShellLabels {
  title: string;
  overview: string;
  publicPage?: string;
  events: string;
  tournaments: string;
  pictures: string;
  banlist: string;
  employees: string;
  licenses: string;
  logout: string;
  mobileMenuButton: string;
  switchClubPlaceholder?: string;
}

export interface ClubShellClubSummary {
  id: string;
  name: string;
  slug?: string;
  tier_label?: string;
  role_label?: string;
}

export interface ClubShellProps {
  locale: string;
  activePath: string;
  club?: ClubShellClubSummary | null;
  clubs?: ClubShellClubSummary[];
  onSelectClub?: (clubId: string) => void;
  labels: ClubShellLabels;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function ClubShell({
  locale,
  activePath,
  club,
  clubs = [],
  onSelectClub,
  labels,
  onLogout,
  children,
}: ClubShellProps) {
  const [mobileOpened, setMobileOpened] = useState(false);

  const basePath = `/${locale}/club`;
  const p = (subpath: string) => (subpath ? `${basePath}/${subpath}` : basePath);

  const cleanActive = activePath.replace(/\/$/, '');
  const isRouteActive = (target: string) => cleanActive === target.replace(/\/$/, '');

  const closeMobile = () => setMobileOpened(false);

  const renderSidebarContent = () => (
    <Stack justify="space-between" h="100%" gap="md">
      <Stack gap="xs">
        {/* Active Club / Store Summary Card */}
        <Paper p="sm" radius="md" withBorder className="gts-panel-summary">
          <Stack gap="xs" className="gts-form">
            <Group wrap="nowrap" gap="sm">
              <ThemeIcon size="lg" radius="md" variant="default" className="gts-shell-club-icon">
                <IconBuildingStore size={20} />
              </ThemeIcon>
              <Box className="gts-flex-1">
                <Text fw={700} size="sm" truncate="end" className="gts-text-heading">
                  {club?.name || 'Club Management'}
                </Text>
                <Group gap={6} mt={2} wrap="wrap">
                  {club?.tier_label && (
                    <Badge size="xs" variant="outline" className="gts-tier-badge">
                      {club.tier_label}
                    </Badge>
                  )}
                  {club?.role_label && (
                    <Badge size="xs" variant="outline" className="gts-status-badge" data-tone="success">
                      {club.role_label}
                    </Badge>
                  )}
                </Group>
              </Box>
            </Group>

            {clubs.length > 1 && onSelectClub && (
              <Select
                size="xs"
                placeholder={labels.switchClubPlaceholder || 'Store wechseln'}
                value={club?.id || null}
                onChange={(val) => {
                  if (val) onSelectClub(val);
                }}
                data={clubs.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.tier_label ? ` (${c.tier_label})` : ''}`,
                }))}
              />
            )}
          </Stack>
        </Paper>

        <Divider my={4} className="gts-divider" />

        {/* Sidebar Navigation Links (Matching AccountShell) */}
        <NavLink
          component={Link}
          href={p('')}
          label={labels.overview}
          leftSection={<IconLayoutGrid size={18} />}
          active={isRouteActive(p(''))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <NavLink
          component={Link}
          href={p('public-page')}
          label={labels.publicPage || 'Store- & Club-Seite'}
          leftSection={<IconWorld size={18} />}
          active={isRouteActive(p('public-page'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <NavLink
          component={Link}
          href={p('events')}
          label={labels.events}
          leftSection={<IconCalendarEvent size={18} />}
          active={isRouteActive(p('events'))}
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
          href={p('pictures')}
          label={labels.pictures}
          leftSection={<IconPhoto size={18} />}
          active={isRouteActive(p('pictures'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <NavLink
          component={Link}
          href={p('banlist')}
          label={labels.banlist}
          leftSection={<IconBan size={18} />}
          active={isRouteActive(p('banlist'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <NavLink
          component={Link}
          href={p('employees')}
          label={labels.employees}
          leftSection={<IconUsers size={18} />}
          active={isRouteActive(p('employees'))}
          onClick={closeMobile}
          variant="light"
          className="gts-shell-navlink"
        />

        <Divider my={4} className="gts-divider" />

        <NavLink
          component={Link}
          href={p('licenses')}
          label={labels.licenses}
          leftSection={<IconCreditCard size={18} />}
          active={isRouteActive(p('licenses'))}
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
      {/* Mobile Sub-Header Bar for Club Drawer */}
      <Box hiddenFrom="md" px="md" py="xs" className="gts-account-mobile-bar">
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
        <Box component="aside" visibleFrom="md" p="md" className="gts-account-sidebar">
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
