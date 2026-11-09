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

export function AppHeader({ logoSrc = defaultPureLogo, locale = 'de', labels }: AppHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const t = { ...defaultLabels, ...labels };
  const p = (path: string) => `/${locale}${path === '/' ? '' : path}`;

  return (
    <Box
      component="header"
      style={{
        height: 80,
        backgroundColor: 'rgba(15, 16, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(24, 100, 255, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        width: '100%',
      }}
    >
      <Group justify="space-between" w="100%" align="center">
        {/* LEFT: Logo & Brand Name */}
        <Group component={Link} href={p('/')} gap="sm" style={{ textDecoration: 'none' }}>
          {logoSrc && !imgError && (
            <Image
              src={logoSrc}
              alt="GameTableSync"
              width={38}
              height={38}
              style={{ width: 'auto', height: '38px', objectFit: 'contain' }}
              onError={() => setImgError(true)}
              priority
            />
          )}
          <Text c="white" className="brand-logo" size="md" style={{ letterSpacing: '0.1em', fontWeight: 800 }}>
            GAMETABLESYNC
          </Text>
        </Group>

        {/* CENTER: Navigation with Dropdowns */}
        <Group gap="lg" visibleFrom="sm">
          <Button component={Link} href={p('/')} variant="subtle" color="gray" size="sm" style={{ color: '#C1C2C5' }}>
            {t.dashboard}
          </Button>

          {/* Tabletop Dropdown */}
          <Menu shadow="md" width={230} position="bottom-start" transitionProps={{ transition: 'pop' }}>
            <Menu.Target>
              <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C1C2C5', fontSize: '0.875rem', fontWeight: 600 }}>
                {t.tabletop} <IconChevronDown size={14} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown style={{ backgroundColor: '#14161b', borderColor: 'rgba(24, 100, 255, 0.25)' }}>
              <Menu.Item component={Link} href={p('/tabletop/systems')} leftSection={<IconSwords size={16} color="#1864ff" />} style={{ color: 'white' }}>
                {t.ttSystems}
              </Menu.Item>
              <Menu.Item component={Link} href={p('/tabletop/campaign')} leftSection={<IconTrophy size={16} color="#1864ff" />} style={{ color: 'white' }}>
                {t.ttCampaign}
              </Menu.Item>
              <Menu.Item component={Link} href={p('/tabletop/roster')} leftSection={<IconShield size={16} color="#1864ff" />} style={{ color: 'white' }}>
                {t.ttRoster}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* RPG Dropdown */}
          <Menu shadow="md" width={230} position="bottom-start" transitionProps={{ transition: 'pop' }}>
            <Menu.Target>
              <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C1C2C5', fontSize: '0.875rem', fontWeight: 600 }}>
                {t.rpg} <IconChevronDown size={14} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown style={{ backgroundColor: '#14161b', borderColor: 'rgba(24, 100, 255, 0.25)' }}>
              <Menu.Item component={Link} href={p('/rpg/sheets')} leftSection={<IconShield size={16} color="#29d4ff" />} style={{ color: 'white' }}>
                {t.rpgSheets}
              </Menu.Item>
              <Menu.Item component={Link} href={p('/rpg/worldmap')} leftSection={<IconCompass size={16} color="#29d4ff" />} style={{ color: 'white' }}>
                {t.rpgWorldmap}
              </Menu.Item>
              <Menu.Item component={Link} href={p('/rpg/sessions')} leftSection={<IconSwords size={16} color="#29d4ff" />} style={{ color: 'white' }}>
                {t.rpgSessions}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* TCG Dropdown */}
          <Menu shadow="md" width={230} position="bottom-start" transitionProps={{ transition: 'pop' }}>
            <Menu.Target>
              <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C1C2C5', fontSize: '0.875rem', fontWeight: 600 }}>
                {t.tcg} <IconChevronDown size={14} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown style={{ backgroundColor: '#14161b', borderColor: 'rgba(24, 100, 255, 0.25)' }}>
              <Menu.Item component={Link} href={p('/tcg/decks')} leftSection={<IconCards size={16} color="#4080ff" />} style={{ color: 'white' }}>
                {t.tcgDecks}
              </Menu.Item>
              <Menu.Item component={Link} href={p('/tcg/companion')} leftSection={<IconDeviceMobile size={16} color="#4080ff" />} style={{ color: 'white' }}>
                {t.tcgCompanion}
              </Menu.Item>
              <Menu.Item component={Link} href={p('/tcg/pods')} leftSection={<IconTrophy size={16} color="#4080ff" />} style={{ color: 'white' }}>
                {t.tcgPods}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Button component={Link} href={p('/game-finder')} variant="subtle" color="gray" size="sm" style={{ color: '#C1C2C5' }}>
            {t.gameFinder}
          </Button>
        </Group>

        {/* RIGHT: User Account Icon */}
        <Group gap="sm">
          <ActionIcon
            component={Link}
            href={p('/account')}
            variant="light"
            color="brandBlue.5"
            size="lg"
            radius="md"
            style={{ backgroundColor: 'rgba(24, 100, 255, 0.15)', border: '1px solid rgba(24, 100, 255, 0.3)' }}
            title={t.account}
          >
            <IconUser size={20} color="#29d4ff" />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}