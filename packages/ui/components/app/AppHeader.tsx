'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Group, Box, Menu, Button, UnstyledButton, Text, ActionIcon } from '@mantine/core';
import {
  IconChevronDown,
  IconUser,
  IconSwords,
  IconShield,
  IconCards,
  IconTrophy,
  IconCompass,
  IconDeviceMobile,
} from '@tabler/icons-react';
import defaultPureLogo from '../../assets/gametablesync_pure.png';

export interface AppHeaderLabels {
  dashboard?: string;
  tabletop?: string;
  ttSystems?: string;
  ttCampaign?: string;
  ttRoster?: string;
  rpg?: string;
  rpgSheets?: string;
  rpgWorldmap?: string;
  rpgSessions?: string;
  tcg?: string;
  tcgDecks?: string;
  tcgCompanion?: string;
  tcgPods?: string;
  gameFinder?: string;
  account?: string;
}

export interface AppHeaderProps {
  logoSrc?: string | { src: string; height: number; width: number };
  locale?: string;
  labels?: AppHeaderLabels;
}

const defaultLabels: Required<AppHeaderLabels> = {
  dashboard: 'Dashboard',
  tabletop: 'Tabletop',
  ttSystems: 'Multi-System Support',
  ttCampaign: 'Narrative Campaign Editor',
  ttRoster: 'Army List Viewer',
  rpg: 'RPG',
  rpgSheets: 'Charakterbögen',
  rpgWorldmap: 'Welt- & Hex-Karten',
  rpgSessions: 'Session Logs & Bastionen',
  tcg: 'TCG',
  tcgDecks: 'DeckViewer & Legality',
  tcgCompanion: 'Live In-Game Companion',
  tcgPods: 'Draft Pods & Ledger',
  gameFinder: 'Game Finder',
  account: 'Benutzerkonto',
};

const menuClassNames = {
  dropdown: 'gts-app-menu-dropdown',
  item: 'gts-app-menu-item',
};

export function AppHeader({ logoSrc = defaultPureLogo, locale = 'de', labels }: AppHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const t = { ...defaultLabels, ...labels };
  const p = (path: string) => `/${locale}${path === '/' ? '' : path}`;

  return (
    <Box component="header" className="gts-app-header">
      <Group justify="space-between" w="100%" align="center">
        <Link href={p('/')} className="gts-app-header-brand-link">
          <Group gap="sm">
            {logoSrc && !imgError && (
              <Image
                src={logoSrc}
                alt="GameTableSync"
                width={38}
                height={38}
                className="gts-app-header-logo"
                onError={() => setImgError(true)}
                priority
              />
            )}
            <Text   className="brand-logo gts-app-header-title" size="md">
              GAMETABLESYNC
            </Text>
          </Group>
        </Link>

        {/* CENTER: Navigation with Dropdowns */}
        <Group gap="lg" visibleFrom="sm">
          <Button
            component={Link}
            href={p('/')}
            variant="subtle"
            color="gray"
            size="sm"
            className="gts-app-nav-btn"
          >
            {t.dashboard}
          </Button>

          {/* Tabletop Dropdown */}
          <Menu
            shadow="md"
            width={230}
            position="bottom-start"
            transitionProps={{ transition: 'pop' }}
            classNames={menuClassNames}
          >
            <Menu.Target>
              <UnstyledButton className="gts-app-menu-trigger">
                {t.tabletop} <IconChevronDown size={14} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                href={p('/tabletop/systems')}
                leftSection={<IconSwords size={16} color="var(--gts-primary)" />}
              >
                {t.ttSystems}
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={p('/tabletop/campaign')}
                leftSection={<IconTrophy size={16} color="var(--gts-primary)" />}
              >
                {t.ttCampaign}
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={p('/tabletop/roster')}
                leftSection={<IconShield size={16} color="var(--gts-primary)" />}
              >
                {t.ttRoster}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* RPG Dropdown */}
          <Menu
            shadow="md"
            width={230}
            position="bottom-start"
            transitionProps={{ transition: 'pop' }}
            classNames={menuClassNames}
          >
            <Menu.Target>
              <UnstyledButton className="gts-app-menu-trigger">
                {t.rpg} <IconChevronDown size={14} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                href={p('/rpg/sheets')}
                leftSection={<IconShield size={16} color="var(--gts-accent)" />}
              >
                {t.rpgSheets}
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={p('/rpg/worldmap')}
                leftSection={<IconCompass size={16} color="var(--gts-accent)" />}
              >
                {t.rpgWorldmap}
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={p('/rpg/sessions')}
                leftSection={<IconSwords size={16} color="var(--gts-accent)" />}
              >
                {t.rpgSessions}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* TCG Dropdown */}
          <Menu
            shadow="md"
            width={230}
            position="bottom-start"
            transitionProps={{ transition: 'pop' }}
            classNames={menuClassNames}
          >
            <Menu.Target>
              <UnstyledButton className="gts-app-menu-trigger">
                {t.tcg} <IconChevronDown size={14} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                href={p('/tcg/decks')}
                leftSection={<IconCards size={16} color="var(--gts-primary)" />}
              >
                {t.tcgDecks}
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={p('/tcg/companion')}
                leftSection={<IconDeviceMobile size={16} color="var(--gts-primary)" />}
              >
                {t.tcgCompanion}
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={p('/tcg/pods')}
                leftSection={<IconTrophy size={16} color="var(--gts-primary)" />}
              >
                {t.tcgPods}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Button
            component={Link}
            href={p('/game-finder')}
            variant="subtle"
            color="gray"
            size="sm"
            className="gts-app-nav-btn"
          >
            {t.gameFinder}
          </Button>
        </Group>

        {/* RIGHT: User Account Icon */}
        <Group gap="sm">
          <ActionIcon
            component={Link}
            href={p('/account')}
            variant="light"
            size="lg"
            radius="md"
            className="gts-app-account-btn"
            title={t.account}
          >
            <IconUser size={20} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}